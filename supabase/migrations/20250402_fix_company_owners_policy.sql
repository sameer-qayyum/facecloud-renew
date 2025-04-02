-- Drop existing policy
DROP POLICY IF EXISTS "Company owners can manage company ownership" ON company_owners;

-- Following the fix from https://github.com/orgs/supabase/discussions/3328
-- Create a security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_company_owner(company_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_owners
    WHERE company_owners.company_id = $1
    AND company_owners.user_id = $2
  );
END;
$$;

-- Create updated policy using the security definer function
CREATE POLICY "Company owners can manage company ownership"
ON company_owners FOR ALL
USING (
    is_company_owner(company_id, auth.uid())
);
