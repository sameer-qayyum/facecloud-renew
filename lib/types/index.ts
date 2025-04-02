/**
 * Database Types - FaceCloud
 * 
 * This file exports all database type definitions based on Supabase schema
 */

// Basic entity types
export * from './clinics';
export * from './locations'; 
export * from './subscriptions';

// User-related types
export type { 
  UserProfile, 
  NewUserProfile,
  UpdateUserProfile,
  EnhancedUserProfile,
  UserRole
} from './user-profiles';

// Company and ownership types
export type { 
  Company,
  NewCompany,
  UpdateCompany
} from './companies';

export type {
  CompanyOwner,
  NewCompanyOwner
} from './company-owners';

// Staff types
export type {
  StaffMember,
  NewStaffMember,
  UpdateStaffMember
} from './staff';

// Owner invitations
export * from './owner-invitations';
