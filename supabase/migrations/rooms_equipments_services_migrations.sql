-- ============================================
-- COSMETIC CLINIC SERVICES MODULE
-- MVP: Service setup with templates, pricing, staff capabilities
-- Includes: Tables, Indexes, RLS Policies, UDFs
-- ============================================
-- ========== 13. UDFS ==========
CREATE OR REPLACE FUNCTION has_clinic_access(clinic UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM staff_assignments sa 
    JOIN staff s ON sa.staff_id = s.id
    JOIN locations l ON sa.location_id = l.id
    WHERE s.user_id = auth.uid() 
    AND l.clinic_id = clinic 
    AND sa.active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_clinic_manager(clinic UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM staff_assignments sa 
    JOIN staff s ON sa.staff_id = s.id
    JOIN locations l ON sa.location_id = l.id
    WHERE s.user_id = auth.uid() 
    AND l.clinic_id = clinic 
    AND sa.role = 'manager' 
    AND sa.active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_clinic_owner(clinic UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM staff_assignments sa 
    JOIN staff s ON sa.staff_id = s.id
    JOIN locations l ON sa.location_id = l.id
    WHERE s.user_id = auth.uid() 
    AND l.clinic_id = clinic 
    AND sa.role = 'owner' 
    AND sa.active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_service_category(_clinic_id UUID, _name TEXT)
RETURNS UUID AS $$
DECLARE
    normalized_name TEXT := TRIM(LOWER(_name));
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM service_categories
    WHERE clinic_id = _clinic_id AND LOWER(TRIM(name)) = normalized_name;

    IF cat_id IS NULL THEN
        INSERT INTO service_categories (clinic_id, name)
        VALUES (_clinic_id, INITCAP(normalized_name)) RETURNING id INTO cat_id;
    END IF;
    RETURN cat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_default_room_name(clinic UUID, room_type UUID)
RETURNS TEXT AS $$
DECLARE
    count_existing INTEGER;
    type_name TEXT;
BEGIN
    SELECT COUNT(*) INTO count_existing FROM rooms
    WHERE clinic_id = clinic AND room_type_id = room_type;
    SELECT name INTO type_name FROM room_types WHERE id = room_type;
    RETURN INITCAP(type_name) || ' Room ' || (count_existing + 1);
END;
$$ LANGUAGE plpgsql;




-- ========== 1. SERVICE TEMPLATES ==========
CREATE TABLE IF NOT EXISTS service_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    default_duration INTEGER,
    category_name TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_template_active ON service_templates(active);

-- ========== 2. SERVICE CATEGORIES ==========
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, name)
);
CREATE INDEX IF NOT EXISTS idx_service_categories_clinic ON service_categories(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(active);

-- ========== 3. ROOM TYPES ==========
CREATE TABLE IF NOT EXISTS room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, name)
);
CREATE INDEX IF NOT EXISTS idx_room_types_clinic ON room_types(clinic_id);

-- ========== 4. ROOMS ==========
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rooms_clinic ON rooms(clinic_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type_id);

-- ========== 5. EQUIPMENT ==========
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_clinic ON equipment(clinic_id);

-- ========== 6. SERVICES ==========
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    arrive_early_mins INTEGER DEFAULT 0,
    is_bundle BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, name)
);
CREATE INDEX IF NOT EXISTS idx_services_clinic ON services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- ========== 7. SERVICE PRICING ==========
CREATE TABLE IF NOT EXISTS service_pricing_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    price_display_type TEXT CHECK (price_display_type IN ('fixed', 'from', 'range', 'custom')) NOT NULL,
    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),
    fixed_price NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pricing_service ON service_pricing_options(service_id);

-- ========== 8. SERVICE ROLE CAPABILITIES ==========
CREATE TABLE IF NOT EXISTS service_role_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'nurse', 'therapist')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, role)
);

-- ========== 9. STAFF SERVICE CAPABILITIES ==========
CREATE TABLE IF NOT EXISTS staff_service_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    certified BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_staff_service_capabilities_clinic ON staff_service_capabilities(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_service_capabilities_staff ON staff_service_capabilities(staff_id);

-- ========== 10. SERVICE ROOM REQUIREMENTS ==========
CREATE TABLE IF NOT EXISTS service_room_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_service_room_requirements_service ON service_room_requirements(service_id);

-- ========== 11. SERVICE EQUIPMENT REQUIREMENTS ==========
CREATE TABLE IF NOT EXISTS service_equipment_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id),
    quantity_required INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_service_equipment_requirements_service ON service_equipment_requirements(service_id);

-- ========== 12. RLS POLICIES ==========
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic staff can view services" ON services FOR SELECT
USING (clinic_id IN (
    SELECT clinic_id FROM staff_assignments sa JOIN staff s ON s.id = sa.staff_id
    WHERE s.user_id = auth.uid() AND sa.active = TRUE));
CREATE POLICY "Managers and owners can manage services" ON services FOR ALL
USING (clinic_id IN (
    SELECT clinic_id FROM staff_assignments sa JOIN staff s ON s.id = sa.staff_id
    WHERE s.user_id = auth.uid() AND sa.active = TRUE AND sa.role IN ('manager', 'owner')));

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view active categories" ON service_categories FOR SELECT
USING (active = TRUE AND has_clinic_access(clinic_id));
CREATE POLICY "Managers and owners can manage categories" ON service_categories FOR ALL
USING (is_clinic_manager(clinic_id) OR is_clinic_owner(clinic_id));

-- ========== 14. TRIGGERS ==========
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_staff_cap_updated_at BEFORE UPDATE ON staff_service_capabilities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE OR REPLACE FUNCTION insert_default_room_types(clinic_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO room_types (clinic_id, name, description)
  VALUES
    (clinic_id, 'Injector', 'Used for injectables like Botox, filler'),
    (clinic_id, 'Therapist', 'Used for facials, peels, skin treatments'),
    (clinic_id, 'Laser', 'Used for laser treatments, IPL, etc.'),
    (clinic_id, 'Consultation', 'Used for patient consultations')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION after_insert_clinic_defaults()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_default_room_types(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_clinic_insert
AFTER INSERT ON clinics
FOR EACH ROW EXECUTE FUNCTION after_insert_clinic_defaults();

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view active room types" ON room_types FOR SELECT
USING (active = TRUE AND has_clinic_access(clinic_id));
CREATE POLICY "Managers and owners can manage room types" ON room_types FOR ALL
USING (is_clinic_manager(clinic_id) OR is_clinic_owner(clinic_id));

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view rooms" ON rooms FOR SELECT
USING (active = TRUE AND has_clinic_access(clinic_id));
CREATE POLICY "Managers and owners can manage rooms" ON rooms FOR ALL
USING (is_clinic_manager(clinic_id) OR is_clinic_owner(clinic_id));