-- Migration: Update user_profiles RLS policies
-- This migration adds policies to allow company owners and managers to view staff profiles

-- Create policy for company owners to view all user profiles in their company
CREATE POLICY "Company owners can view all user profiles in their company"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_owners
    JOIN staff ON staff.user_id = user_profiles.id
    WHERE company_owners.company_id = staff.company_id
    AND company_owners.user_id = auth.uid()
  )
);

-- Create policy for managers to view user profiles in their clinic
CREATE POLICY "Managers can view all user profiles in their clinic"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff AS manager_staff
    JOIN staff AS staff_member ON staff_member.clinic_id = manager_staff.clinic_id
    WHERE staff_member.user_id = user_profiles.id
    AND manager_staff.user_id = auth.uid()
    AND manager_staff.role in ('manager', 'owner')
  )
);

-- Create policy for staff to view basic information of colleagues
CREATE POLICY "Staff can view basic information of colleagues"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff AS viewer_staff
    JOIN staff AS colleague_staff ON colleague_staff.clinic_id = viewer_staff.clinic_id
    WHERE colleague_staff.user_id = user_profiles.id
    AND viewer_staff.user_id = auth.uid()
  )
);
