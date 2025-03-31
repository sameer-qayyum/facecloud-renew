/**
 * Company Types
 * Based on companies table in database
 */

export interface Company {
  id: string; // UUID
  owner_id: string; // UUID, references auth.users
  name: string;
  created_at: string; // TIMESTAMPTZ
}

export type NewCompany = Omit<Company, 'id' | 'created_at'>;
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at'>>;
