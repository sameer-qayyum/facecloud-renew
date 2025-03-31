/**
 * Staff Types
 * Based on staff table in database
 */

import { UserRole } from './user-profiles';

export interface Staff {
  id: string; // UUID
  user_id: string; // UUID, references user_profiles
  company_id: string; // UUID, references companies
  clinic_id: string; // UUID, references clinics
  location_id: string | null; // UUID, references locations
  role: UserRole;
  created_at: string; // TIMESTAMPTZ
}

export type NewStaff = Omit<Staff, 'id' | 'created_at'>;
export type UpdateStaff = Partial<Omit<Staff, 'id' | 'created_at'>>;
