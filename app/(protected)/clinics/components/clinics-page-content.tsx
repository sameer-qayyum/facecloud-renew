'use server';

import { createClient } from '@/utils/supabase/server';
import { ClinicCard } from '@/app/(protected)/clinics/components/clinic-card';
import { ClinicFilters } from '@/app/(protected)/clinics/components/clinic-filters';
import { EmptyState } from '@/app/(protected)/clinics/components/empty-state';

export default async function ClinicsPageContent() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <EmptyState />;
  }
  
  // Get the user's profile to determine role and company_id
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  
  if (!userProfile || !userProfile.company_id) {
    return <EmptyState />;
  }
  
  try {
    // Direct approach: Query companies first to get clinics
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', userProfile.company_id)
      .single();
      
    if (!company) {
      return <EmptyState />;
    }
    
    // Now fetch clinics through the company relation
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select(`
        id, 
        name, 
        created_at
      `)
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      const errorMessage = `Error fetching clinics: ${error.message}`;
      console.error(errorMessage);
      
      return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Unable to load clinics</h3>
          <p>We encountered a problem loading your clinic data. Please try again or contact support if the issue persists.</p>
        </div>
      );
    }
    
    if (!clinics || clinics.length === 0) {
      return <EmptyState />;
    }
    
    // Fetch locations separately to avoid the recursion in the join
    const locationPromises = clinics.map(clinic => 
      supabase
        .from('locations')
        .select('id, name, address, phone, email')
        .eq('clinic_id', clinic.id)
        .limit(1)
        .single()
        .then(({ data }) => ({ clinicId: clinic.id, location: data }))
    );
    
    const locationsResults = await Promise.all(locationPromises);
    
    // Create a map of clinic ID to location
    const locationsMap = locationsResults.reduce((map, item) => {
      if (item.location) {
        map[item.clinicId] = item.location;
      }
      return map;
    }, {} as Record<string, any>);
    
    // Transform the data with locations
    const processedClinics = clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      created_at: clinic.created_at,
      location: locationsMap[clinic.id] || null
    }));
  
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedClinics.map(clinic => (
            <ClinicCard 
              key={clinic.id} 
              clinic={clinic} 
            />
          ))}
        </div>
      </>
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Unable to load clinics</h3>
        <p>We encountered an unexpected problem. Please try again or contact support if the issue persists.</p>
      </div>
    );
  }
}
