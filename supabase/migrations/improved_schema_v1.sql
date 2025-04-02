-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------
-- IMPROVED SCHEMA: FaceCloud Clinic Management System
-- Optimized for performance with proper ownership model
-----------------------------------------------

-- 1️⃣ Companies Table with proper creation tracking
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who created the company
    name TEXT NOT NULL UNIQUE,
    abn TEXT, -- Australian Business Number
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ Company Owners Junction Table (supports multiple owners)
CREATE TABLE company_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who added this owner
    UNIQUE(company_id, user_id) -- Prevent duplicates
);

-- 3️⃣ Clinics Table (Belongs to a Company)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who created this clinic
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ Locations Table (Belongs to a Clinic, Subscription at This Level)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main Location', 
    address TEXT,
    suburb TEXT,
    state TEXT,
    postcode TEXT,
    country TEXT DEFAULT 'Australia',
    phone TEXT,
    email TEXT,
    opening_hours JSONB DEFAULT '{"mon":["9-5"], "tue":["9-5"], "wed":["9-5"], "thu":["9-5"], "fri":["9-5"]}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who created this location
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ User Profiles (Extends auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6️⃣ Staff Table (Tracks Employees and Their Roles)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Optional, staff might work at multiple locations
    role TEXT CHECK (role IN ('owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who added this staff member
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7️⃣ Subscriptions Table (Subscription Tied to Locations)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID UNIQUE REFERENCES locations(id) ON DELETE CASCADE, -- Subscription tied to a specific location
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'trial', 'canceled')) DEFAULT 'trial',
    price NUMERIC(10,2) NOT NULL, -- Subscription price per location
    stripe_subscription_id TEXT, -- Stripe ID for payments
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ Owner Invitations Table (For inviting new owners)
CREATE TABLE owner_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- Create critical indexes for performance
-----------------------------------------------

-- Company ownership indexes
CREATE INDEX company_created_by_idx ON companies(created_by);
CREATE INDEX company_owners_company_idx ON company_owners(company_id);
CREATE INDEX company_owners_user_idx ON company_owners(user_id);

-- Staff role indexes
CREATE INDEX staff_user_idx ON staff(user_id);
CREATE INDEX staff_company_idx ON staff(company_id);
CREATE INDEX staff_clinic_idx ON staff(clinic_id);
CREATE INDEX staff_location_idx ON staff(location_id);
CREATE INDEX staff_role_idx ON staff(role);

-- Clinic and location relationship indexes
CREATE INDEX clinics_company_idx ON clinics(company_id);
CREATE INDEX locations_clinic_idx ON locations(clinic_id);

-----------------------------------------------
-- 🔒 Enable Row Level Security
-----------------------------------------------

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_invitations ENABLE ROW LEVEL SECURITY;

-----------------------------------------------
-- 🔒 RLS Policies with Role-Based Access Control
-----------------------------------------------

-- 🔥 User Profile Policies
CREATE POLICY "Users can manage their own profile"
ON user_profiles FOR ALL
USING (auth.uid() = id);

-- 🔥 Company Policies
CREATE POLICY "Company creators have full access"
ON companies FOR ALL
USING (auth.uid() = created_by);

CREATE POLICY "Company owners have full access"
ON companies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = companies.id
        AND company_owners.user_id = auth.uid()
    )
);

CREATE POLICY "Staff can view company info"
ON companies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.company_id = companies.id
        AND staff.user_id = auth.uid()
    )
);

-- 🔥 Company Owners Policies
-- Drop the problematic policy
DROP POLICY "Company owners can manage ownership" ON company_owners;

-- Create two separate policies
-- 1. Users can see company_owners records for themselves
CREATE POLICY "Users can view their own company ownerships" 
ON company_owners FOR SELECT
USING (user_id = auth.uid());

-- 2. Company owners can manage ownership
CREATE POLICY "Company owners can manage company ownership"
ON company_owners FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners co
        WHERE co.company_id = company_owners.company_id
        AND co.user_id = auth.uid()
    )
);

-- 🔥 Clinic Policies
CREATE POLICY "Company owners can manage all clinics"
ON clinics FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = clinics.company_id
        AND company_owners.user_id = auth.uid()
    )
);

CREATE POLICY "Clinic managers can manage their clinics"
ON clinics FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.clinic_id = clinics.id
        AND staff.user_id = auth.uid()
        AND staff.role = 'manager'
    )
);

CREATE POLICY "Staff can view clinics they work at"
ON clinics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.clinic_id = clinics.id
        AND staff.user_id = auth.uid()
    )
);

-- 🔥 Location Policies
CREATE POLICY "Company owners can manage all locations"
ON locations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners co
        JOIN clinics c ON c.company_id = co.company_id
        WHERE locations.clinic_id = c.id
        AND co.user_id = auth.uid()
    )
);

CREATE POLICY "Clinic managers can manage locations at their clinics"
ON locations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.clinic_id = locations.clinic_id
        AND staff.user_id = auth.uid()
        AND staff.role = 'manager'
    )
);

CREATE POLICY "Staff can view their assigned locations"
ON locations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE (staff.clinic_id = locations.clinic_id OR staff.location_id = locations.id)
        AND staff.user_id = auth.uid()
    )
);

-- 🔥 Staff Policies
CREATE POLICY "Company owners can manage all staff"
ON staff FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = staff.company_id
        AND company_owners.user_id = auth.uid()
    )
);

CREATE POLICY "Managers can manage staff at their clinics"
ON staff FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM staff AS manager_staff
        WHERE manager_staff.clinic_id = staff.clinic_id
        AND manager_staff.user_id = auth.uid()
        AND manager_staff.role = 'manager'
    )
);

CREATE POLICY "Staff can view colleagues at their clinic"
ON staff FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff AS viewer_staff
        WHERE viewer_staff.clinic_id = staff.clinic_id
        AND viewer_staff.user_id = auth.uid()
    )
);

-- 🔥 Subscription Policies
CREATE POLICY "Company owners can manage subscriptions"
ON subscriptions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = subscriptions.company_id
        AND company_owners.user_id = auth.uid()
    )
);

CREATE POLICY "Managers can view subscriptions for their locations"
ON subscriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN locations ON locations.id = subscriptions.location_id
        WHERE staff.clinic_id = locations.clinic_id
        AND staff.user_id = auth.uid()
        AND staff.role = 'manager'
    )
);

-- 🔥 Owner Invitation Policies
CREATE POLICY "Company owners can manage invitations"
ON owner_invitations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM company_owners
        WHERE company_owners.company_id = owner_invitations.company_id
        AND company_owners.user_id = auth.uid()
    )
);

-----------------------------------------------
-- 🔥 Trigger Function: Create Company and Owner on User Signup
-----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    new_company_id UUID;
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (id, first_name, last_name, phone, email)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'first_name', 
        NEW.raw_user_meta_data->>'last_name', 
        NEW.raw_user_meta_data->>'phone',
        NEW.email
    );
    
    -- Only create company if user provided company name
    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
        -- Create a new company
        INSERT INTO public.companies (id, created_by, name, created_at)
        VALUES (
            gen_random_uuid(), 
            NEW.id, 
            NEW.raw_user_meta_data->>'company_name', 
            NOW()
        )
        RETURNING id INTO new_company_id;
        
        -- Add user as company owner
        INSERT INTO public.company_owners (company_id, user_id, created_by)
        VALUES (
            new_company_id,
            NEW.id,
            NEW.id -- Self-created
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_user_signup();
