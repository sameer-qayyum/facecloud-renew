/**
 * User Profile Types
 * Based on user_profiles table in database
 */

export type UserRole = 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';

export interface UserProfile {
  id: string; // UUID, references auth.users
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  profile_picture?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type NewUserProfile = Omit<UserProfile, 'created_at' | 'updated_at'>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Staff Types
 * Staff records connect users to companies, clinics, and locations with specific roles
 */
export interface StaffMember {
  id: string; // UUID
  user_id: string; // UUID, references user_profiles
  company_id: string; // UUID, references companies
  clinic_id: string; // UUID, references clinics
  location_id?: string; // UUID, references locations (optional)
  role: UserRole;
  active: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Company Ownership Type
 */
export interface CompanyOwner {
  id: string; // UUID
  company_id: string; // UUID, references companies
  user_id: string; // UUID, references auth.users
  created_at: string; // TIMESTAMPTZ
}

/**
 * Enhanced User Profile with Staff and Ownership Information
 */
export interface EnhancedUserProfile extends UserProfile {
  staff: StaffMember[];
  companyOwner: boolean;
}
