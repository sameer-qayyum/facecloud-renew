'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

interface UseCompanyDataOptions {
  includeLocations?: boolean;
  onError?: (error: any) => void;
}

interface UseCompanyDataResult {
  companyId: string | null;
  clinics: Clinic[];
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching company-related data
 * Provides company ID and clinics with optimized loading
 */
export function useCompanyData(options: UseCompanyDataOptions = {}): UseCompanyDataResult {
  const { includeLocations = true, onError } = options;
  
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  const supabase = createClient();
  
  // Fetch company data
  const fetchCompanyData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      // Get company ID from staff or company_owners
      let userCompanyId: string | null = null;
      
      // First try staff records
      const { data: staffData } = await supabase
        .from('staff')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .single();
        
      if (staffData) {
        userCompanyId = staffData.company_id;
      } else {
        // If no staff record, check company_owners
        const { data: ownerData } = await supabase
          .from('company_owners')
          .select('company_id')
          .eq('user_id', user.id)
          .single();
          
        if (ownerData) {
          userCompanyId = ownerData.company_id;
        }
      }
      
      if (!userCompanyId) {
        setError('No company associated with this user');
        return;
      }
      
      setCompanyId(userCompanyId);
      
      // Fetch clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('company_id', userCompanyId)
        .eq('active', true)
        .order('name');
        
      if (clinicsError) {
        throw clinicsError;
      }
      
      if (!clinicsData || clinicsData.length === 0) {
        setClinics([]);
        return;
      }
      
      // Fetch locations if needed
      if (includeLocations) {
        // Get locations for each clinic using parallel queries for ultra-fast performance
        const locationPromises = clinicsData.map(clinic => 
          supabase
            .from('locations')
            .select('name')
            .eq('clinic_id', clinic.id)
            .maybeSingle()
            .then(({ data }) => ({ 
              clinicId: clinic.id, 
              locationName: data?.name || null 
            }))
        );
        
        const locationResults = await Promise.all(locationPromises);
        
        // Create a map of clinic ID to location name
        const locationMap = locationResults.reduce((map, item) => {
          map[item.clinicId] = item.locationName;
          return map;
        }, {} as Record<string, string | null>);
        
        // Merge clinic and location data
        const clinicsWithLocations = clinicsData.map(clinic => ({
          id: clinic.id,
          name: clinic.name,
          location_name: locationMap[clinic.id]
        }));
        
        setClinics(clinicsWithLocations);
      } else {
        // Just use the basic clinic data without locations
        setClinics(clinicsData.map(clinic => ({
          id: clinic.id,
          name: clinic.name
        })));
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError(err);
      
      if (onError) {
        onError(err);
      } else {
        toast.error('Failed to load company data');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    fetchCompanyData();
  }, []);
  
  return {
    companyId,
    clinics,
    isLoading,
    error,
    refetch: fetchCompanyData
  };
}
