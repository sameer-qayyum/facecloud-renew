-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------
-- PHASE 1: Company, Clinics, and Users Setup --
-----------------------------------------------

-- 1️⃣ Companies Table (Parent Entity)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ Clinics Table (Belongs to a Company)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ Locations Table (Belongs to a Clinic, Subscription at This Level)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main Location', 
    address TEXT,
    phone TEXT,
    email TEXT,
    opening_hours JSONB DEFAULT '{"mon":["9-5"], "tue":["9-5"], "wed":["9-5"], "thu":["9-5"], "fri":["9-5"]}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ User Profiles (Extends auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin')) NOT NULL DEFAULT 'owner',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ Staff Table (Tracks Employees and Their Roles)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6️⃣ Subscriptions Table (Subscription Tied to Locations)
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

-- 🔥 Enable RLS on Phase 1 Tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 🔥 Function: Create User Profile & Company on Registration
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    new_company_id UUID;
    new_clinic_id UUID;
BEGIN
    -- Create a new company using the user's provided company name
    INSERT INTO public.companies (id, owner_id, name, created_at)
    VALUES (
        gen_random_uuid(), 
        NEW.id, 
        NEW.raw_user_meta_data->>'company_name', 
        NOW()
    )
    RETURNING id INTO new_company_id;

    -- Create a default clinic for the company
    INSERT INTO public.clinics (id, company_id, name, created_at)
    VALUES (
        gen_random_uuid(), 
        new_company_id, 
         NEW.raw_user_meta_data->>'company_name', 
        NOW()
    )
    RETURNING id INTO new_clinic_id;

    -- Create a user profile linked to auth.users
    INSERT INTO public.user_profiles (id, first_name, last_name, phone, role, company_id, created_at)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'first_name', 
        NEW.raw_user_meta_data->>'last_name', 
        NEW.raw_user_meta_data->>'phone', 
        'owner', 
        new_company_id, 
        NOW()
    );

    -- Add owner to the staff table. Note: using user_profile_id instead of user_id.
    INSERT INTO public.staff (id, user_id, clinic_id, role, created_at)
    VALUES (
        gen_random_uuid(), 
        NEW.id, 
        new_clinic_id, 
        'owner', 
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- 🔥 Trigger: Execute Function When a New User Registers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_user_signup();

-----------------------------------------------
-- 🔒 RLS Policies
-----------------------------------------------

-- 🔥 User can view and update own profile
CREATE POLICY "User can manage own profile"
ON user_profiles FOR ALL
USING (auth.uid() = id);

-- 🔥 Company owners can manage their company
CREATE POLICY "Owners can manage company"
ON companies FOR ALL
USING (auth.uid() = owner_id);

-- 🔥 Owners & Managers can manage clinics
CREATE POLICY "Owners & Managers can manage clinics"
ON clinics FOR ALL
USING (
    auth.uid() = (SELECT owner_id FROM companies WHERE companies.id = clinics.company_id)
    OR auth.uid() IN (SELECT user_id FROM staff WHERE role IN ('owner', 'manager'))
);

-- 🔥 Owners & Managers can manage locations
CREATE POLICY "Owners & Managers can manage locations"
ON locations FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM staff 
        WHERE role IN ('owner', 'manager')
    )
);

-- 🔥 Staff can view their assigned clinic locations
CREATE POLICY "Staff can view their assigned clinic locations"
ON locations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff 
        WHERE staff.clinic_id = locations.clinic_id
        AND staff.user_id = auth.uid()
    )
);

-- 🔧 FIXED: Break circular reference by using user_profiles instead
CREATE POLICY "Owners & Managers can manage staff"
ON staff FOR ALL
USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE company_id = staff.company_id
        AND role IN ('owner', 'manager')
    )
);

-- 🔥 Owners & Managers can manage subscriptions
CREATE POLICY "Owners & Managers can manage subscriptions"
ON subscriptions FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM staff 
        WHERE role IN ('owner', 'manager')
    )
);


