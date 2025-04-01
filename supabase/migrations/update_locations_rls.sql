-- Drop existing RLS policies on locations table
DROP POLICY IF EXISTS "Owners & Managers can manage locations" ON locations;
DROP POLICY IF EXISTS "Staff can view their assigned clinic locations" ON locations;

-- Create a new simplified policy that directly uses user_profiles
-- This combines both viewing and management into one ultra-fast policy
CREATE POLICY "Users can access locations for their company"
ON locations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN clinics ON locations.clinic_id = clinics.id
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.company_id = clinics.company_id
    )
);

-- Add a more specific policy for non-owners that still need access
CREATE POLICY "Staff can view locations for their assigned clinics"
ON locations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.clinic_id = locations.clinic_id
        AND staff.user_id = auth.uid()
    )
);
