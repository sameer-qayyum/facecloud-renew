/**
 * Company Ownership Types
 * Based on company_owners table in database
 */

export interface CompanyOwner {
  id: string; // UUID
  company_id: string; // UUID, references companies
  user_id: string; // UUID, references auth.users
  created_at: string; // TIMESTAMPTZ
  created_by: string | null; // UUID, references auth.users
}

export type NewCompanyOwner = Omit<CompanyOwner, 'id' | 'created_at'>;
export type UpdateCompanyOwner = Partial<Omit<CompanyOwner, 'id' | 'created_at'>>;
