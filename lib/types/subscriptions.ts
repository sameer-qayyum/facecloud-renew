/**
 * Subscription Types
 * Based on subscriptions table in database
 */

export type SubscriptionStatus = 'active' | 'trial' | 'canceled';

export interface Subscription {
  id: string; // UUID
  location_id: string; // UUID, references locations
  company_id: string; // UUID, references companies
  subscription_status: SubscriptionStatus;
  price: number;
  stripe_subscription_id?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type NewSubscription = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSubscription = Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>;
