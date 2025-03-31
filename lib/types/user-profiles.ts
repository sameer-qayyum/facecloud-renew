/**
 * User Profile Types
 * Based on user_profiles table in database
 */

export type UserRole = 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';

export interface UserProfile {
  id: string; // UUID, references auth.users
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  company_id: string | null; // UUID, references companies
  profile_picture?: string;
  created_at: string; // TIMESTAMPTZ
}

export type NewUserProfile = Omit<UserProfile, 'created_at'>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at'>>;
