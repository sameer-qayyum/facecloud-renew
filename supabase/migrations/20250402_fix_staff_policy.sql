-- Following the fix from https://github.com/orgs/supabase/discussions/3328
-- Create security definer functions to avoid infinite recursion in staff policies

-- Function to check if a user is a manager at a clinic
CREATE OR REPLACE FUNCTION is_clinic_manager(clinic_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    WHERE staff.clinic_id = $1
    AND staff.user_id = $2
    AND staff.role = 'manager'
    AND staff.active = true
  );
END;
$$;

-- Function to check if a user is a staff member at a clinic
CREATE OR REPLACE FUNCTION is_clinic_staff(clinic_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    WHERE staff.clinic_id = $1
    AND staff.user_id = $2
    AND staff.active = true
  );
END;
$$;

-- Drop existing policies that have recursion issues
DROP POLICY IF EXISTS "Managers can manage staff at their clinics" ON staff;
DROP POLICY IF EXISTS "Staff can view colleagues at their clinic" ON staff;

-- Replace with fixed policies
CREATE POLICY "Managers can manage staff at their clinics"
ON staff FOR ALL
USING (
    is_clinic_manager(clinic_id, auth.uid())
);

CREATE POLICY "Staff can view colleagues at their clinic"
ON staff FOR SELECT
USING (
    is_clinic_staff(clinic_id, auth.uid())
);
