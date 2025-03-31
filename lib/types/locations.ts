/**
 * Location Types
 * Based on locations table in database
 */

export type OpeningHours = {
  mon?: string[];
  tue?: string[];
  wed?: string[];
  thu?: string[];
  fri?: string[];
  sat?: string[];
  sun?: string[];
};

export interface Location {
  id: string; // UUID
  clinic_id: string; // UUID, references clinics
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_hours: OpeningHours;
  created_at: string; // TIMESTAMPTZ
}

export type NewLocation = Omit<Location, 'id' | 'created_at'>;
export type UpdateLocation = Partial<Omit<Location, 'id' | 'created_at'>>;
