/**
 * Owner Invitation Types
 * Based on owner_invitations table in database
 */

export interface OwnerInvitation {
  id: string; // UUID
  company_id: string; // UUID, references companies
  email: string;
  invited_by: string | null; // UUID, references auth.users
  token: string;
  accepted: boolean;
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

export type NewOwnerInvitation = Omit<OwnerInvitation, 'id' | 'created_at'>;
export type UpdateOwnerInvitation = Partial<Omit<OwnerInvitation, 'id' | 'created_at'>>;
