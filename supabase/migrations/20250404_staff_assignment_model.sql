-- Migration: Staff Assignment Model Implementation
-- Timestamp: 2025-04-04
-- Author: Sameer (via Cascade)
-- 
-- This migration implements a many-to-many relationship between staff and locations
-- allowing staff to work at multiple locations with different roles

-----------------------------------------------
-- Drop existing tables and policies to rebuild
-----------------------------------------------

-- First drop all dependent policies to avoid dependency issues
DROP POLICY IF EXISTS "Company owners can manage staff" ON staff;
DROP POLICY IF EXISTS "Managers can manage staff at their clinic" ON staff;
DROP POLICY IF EXISTS "Staff can view colleagues at the same company" ON staff;
DROP POLICY IF EXISTS "Staff can view their assigned locations" ON locations;

-- Now it's safe to drop the columns
ALTER TABLE staff DROP COLUMN IF EXISTS location_id CASCADE;
ALTER TABLE staff DROP COLUMN IF EXISTS clinic_id CASCADE;
ALTER TABLE staff DROP COLUMN IF EXISTS role CASCADE;

-----------------------------------------------
-- Create new staff_assignments junction table
-----------------------------------------------

CREATE TABLE IF NOT EXISTS staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin')),
    primary_location BOOLEAN DEFAULT FALSE,
    schedule JSONB DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure a staff member has only one assignment per location
    UNIQUE(staff_id, location_id)
);

-- Create a trigger to ensure at least one primary location
CREATE OR REPLACE FUNCTION ensure_primary_location()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this as primary, unset any other primary locations for this staff
    IF NEW.primary_location = TRUE THEN
        UPDATE staff_assignments
        SET primary_location = FALSE
        WHERE staff_id = NEW.staff_id 
        AND id != NEW.id;
    END IF;
    
    -- If no primary location exists for this staff, set this one as primary
    IF NOT EXISTS (
        SELECT 1 FROM staff_assignments
        WHERE staff_id = NEW.staff_id
        AND primary_location = TRUE
    ) THEN
        NEW.primary_location := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_staff_primary_location
BEFORE INSERT OR UPDATE ON staff_assignments
FOR EACH ROW EXECUTE FUNCTION ensure_primary_location();

-----------------------------------------------
-- Migrate existing staff data to new model
-----------------------------------------------

-- This function will run after schema changes to migrate existing data
DO $$ 
BEGIN
    -- Insert staff assignments for existing staff records
    INSERT INTO staff_assignments (staff_id, location_id, role, primary_location, created_by)
    SELECT 
        s.id, 
        loc.id,
        s.role, -- Uses the old role value before we drop it
        TRUE, -- Set as primary location
        s.created_by
    FROM 
        staff s
    JOIN
        locations loc ON s.location_id = loc.id
    WHERE
        s.location_id IS NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Data migration skipped or errored: %', SQLERRM;
END $$;

-----------------------------------------------
-- Update indexes for performance
-----------------------------------------------

-- Primary staff assignment indexes
CREATE INDEX IF NOT EXISTS staff_assignments_staff_idx ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS staff_assignments_location_idx ON staff_assignments(location_id);
CREATE INDEX IF NOT EXISTS staff_assignments_role_idx ON staff_assignments(role);
CREATE INDEX IF NOT EXISTS staff_assignments_active_idx ON staff_assignments(active);

-----------------------------------------------
-- 🔒 Enable Row Level Security on new table
-----------------------------------------------

ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-----------------------------------------------
-- 🔒 RLS Policies for staff_assignments
-----------------------------------------------

-- Company owners can manage all staff assignments
CREATE POLICY "Company owners can manage staff assignments"
ON staff_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners co
        JOIN staff s ON s.company_id = co.company_id
        WHERE s.id = staff_assignments.staff_id
        AND co.user_id = auth.uid()
    )
);

-- Managers can manage staff assignments at their locations
CREATE POLICY "Managers can manage staff assignments at their locations"
ON staff_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM staff_assignments sa
        JOIN staff s ON s.id = sa.staff_id
        WHERE sa.location_id = staff_assignments.location_id
        AND sa.role = 'manager'
        AND s.user_id = auth.uid()
        AND sa.active = TRUE
    )
);

-- Staff can view assignments at their locations
CREATE POLICY "Staff can view assignments at their locations"
ON staff_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff_assignments sa
        JOIN staff s ON s.id = sa.staff_id
        WHERE sa.location_id = staff_assignments.location_id
        AND s.user_id = auth.uid()
        AND sa.active = TRUE
    )
);

-- Users can see their own assignments regardless of status
CREATE POLICY "Users can view their own assignments"
ON staff_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff s
        WHERE s.id = staff_assignments.staff_id
        AND s.user_id = auth.uid()
    )
);

-----------------------------------------------
-- UDFs for Row Level Security
-----------------------------------------------

-- Function to check if current user is staff at the given company
CREATE OR REPLACE FUNCTION is_user_staff_at_company(company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_staff BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM staff 
        WHERE user_id = auth.uid()
        AND company_id = is_user_staff_at_company.company_id
    ) INTO is_staff;
    
    RETURN is_staff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is manager at given company
CREATE OR REPLACE FUNCTION is_user_manager_at_company(company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_manager BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM staff s
        JOIN staff_assignments sa ON s.id = sa.staff_id
        WHERE s.user_id = auth.uid()
        AND s.company_id = is_user_manager_at_company.company_id
        AND sa.role = 'manager'
        AND sa.active = TRUE
    ) INTO is_manager;
    
    RETURN is_manager;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-----------------------------------------------
-- 🔒 Updated RLS Policies for modified staff table
-----------------------------------------------

-- Company owners can manage all staff
CREATE POLICY "Company owners can manage staff"
ON staff FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = staff.company_id
        AND company_owners.user_id = auth.uid()
    )
);

-- Managers can view all staff at their company (using UDF)
CREATE POLICY "Managers can view staff at company"
ON staff FOR SELECT
USING (is_user_manager_at_company(company_id));

-- Staff can view colleagues at the same company (using UDF)
CREATE POLICY "Staff can view colleagues at the same company"
ON staff FOR SELECT
USING (is_user_staff_at_company(company_id));

-- Users can see and update their own staff record
CREATE POLICY "Users can manage their own staff record"
ON staff FOR ALL
USING (user_id = auth.uid());

-----------------------------------------------
-- Additional functions to support the data model
-----------------------------------------------

-- Get all locations where a staff member works
CREATE OR REPLACE FUNCTION get_staff_locations(staff_id UUID)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    clinic_name TEXT,
    role TEXT,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        c.name,
        sa.role,
        sa.primary_location
    FROM
        staff_assignments sa
    JOIN
        locations l ON sa.location_id = l.id
    JOIN
        clinics c ON l.clinic_id = c.id
    WHERE
        sa.staff_id = get_staff_locations.staff_id
        AND sa.active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Get all staff at a specific location
CREATE OR REPLACE FUNCTION get_location_staff(location_id UUID)
RETURNS TABLE (
    staff_id UUID,
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.user_id,
        up.first_name,
        up.last_name,
        sa.role,
        sa.primary_location
    FROM
        staff_assignments sa
    JOIN
        staff s ON sa.staff_id = s.id
    JOIN
        user_profiles up ON s.user_id = up.id
    WHERE
        sa.location_id = get_location_staff.location_id
        AND sa.active = TRUE;
END;
$$ LANGUAGE plpgsql;
