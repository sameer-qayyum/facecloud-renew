/**
 * Staff Types
 * Based on staff table in database
 */

import { UserRole } from './user-profiles';

export interface StaffMember {
  id: string; // UUID
  user_id: string; // UUID, references user_profiles
  company_id: string; // UUID, references companies
  clinic_id: string; // UUID, references clinics
  location_id: string | null; // UUID, references locations
  role: UserRole;
  created_by: string | null; // UUID, references auth.users
  active: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type NewStaffMember = Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>;
export type UpdateStaffMember = Partial<Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>>;
