/**
 * Company Types
 * Based on companies table in database
 */

export interface Company {
  id: string; // UUID
  created_by: string | null; // UUID, references auth.users
  name: string;
  abn?: string; // Australian Business Number
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type NewCompany = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
