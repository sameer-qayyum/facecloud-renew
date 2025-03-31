/**
 * Clinic Types
 * Based on clinics table in database
 */

export interface Clinic {
  id: string; // UUID
  company_id: string; // UUID, references companies
  name: string;
  created_at: string; // TIMESTAMPTZ
}

export type NewClinic = Omit<Clinic, 'id' | 'created_at'>;
export type UpdateClinic = Partial<Omit<Clinic, 'id' | 'created_at'>>;
