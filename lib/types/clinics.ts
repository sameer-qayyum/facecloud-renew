/**
 * Clinic Types
 * Based on clinics table in database
 */

export interface Clinic {
  id: string; // UUID
  company_id: string; // UUID, references companies
  name: string;
  created_by: string | null; // UUID, references auth.users
  active: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type NewClinic = Omit<Clinic, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClinic = Partial<Omit<Clinic, 'id' | 'created_at' | 'updated_at'>>;
