'use server';

import { createClient } from '@/utils/supabase/server';
import { ClinicCard } from '@/app/(protected)/clinics/components/clinic-card';
import { EmptyState } from '@/app/(protected)/clinics/components/empty-state';

export default async function ClinicsPageContent() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <EmptyState />;
  }
  
  // Get the user's company_id from their staff record
  const { data: staffRecords } = await supabase
    .from('staff')
    .select('company_id, role')
    .eq('user_id', user.id)
    .eq('active', true);
  
  // User has no active staff records
  if (!staffRecords || staffRecords.length === 0) {
    return <EmptyState />;
  }
  
  // Get the company_id from the first staff record
  const company_id = staffRecords[0].company_id;
  
  try {
    // Now fetch clinics for this company
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select(`
        id, 
        name,
        company_id,
        created_by,
        active,
        created_at,
        updated_at
      `)
      .eq('company_id', company_id)
      .eq('active', true)
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
    
    // Fetch locations separately with the new fields
    const locationPromises = clinics.map(clinic => 
      supabase
        .from('locations')
        .select(`
          id, 
          name, 
          address, 
          suburb,
          state,
          postcode,
          country,
          phone, 
          email
        `)
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
    
    // Transform the data with locations and include all required fields
    const processedClinics = clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      company_id: clinic.company_id,
      created_by: clinic.created_by,
      active: clinic.active,
      created_at: clinic.created_at,
      updated_at: clinic.updated_at,
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
