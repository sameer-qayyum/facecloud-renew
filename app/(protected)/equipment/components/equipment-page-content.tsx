'use server';

import { createClient } from '@/utils/supabase/server';
import { EquipmentTable } from '@/app/(protected)/equipment/components/equipment-table';
import { EmptyState } from '@/app/(protected)/equipment/components/empty-state';
import { ClinicSelector } from '@/app/(protected)/shared/components/clinic-selector';

// Define types for the equipment data structure
interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

// Our equipment interface for frontend use
interface Equipment {
  id: string;
  name: string;
  quantity: number;
  active: boolean;
  created_at: string;
  clinic_id: string;
  clinic: Clinic | null;
}

export default async function EquipmentPageContent() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <EmptyState message="Please sign in to view equipment" />;
  }
  
  // Get the user's company_id from their staff record or company_owners
  let company_id: string | null = null;
  
  // First check staff records
  const { data: staffRecords } = await supabase
    .from('staff')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('active', true);
    
  if (staffRecords && staffRecords.length > 0) {
    company_id = staffRecords[0].company_id;
  } else {
    // If no staff records, check company_owners
    const { data: companyOwners } = await supabase
      .from('company_owners')
      .select('company_id')
      .eq('user_id', user.id);
      
    if (companyOwners && companyOwners.length > 0) {
      company_id = companyOwners[0].company_id;
    }
  }
  
  // User has no company association
  if (!company_id) {
    return <EmptyState message="No clinic association found" />;
  }
  
  try {
    // Fetch all clinics for this company for the clinic selector
    const { data: clinicsRaw } = await supabase
      .from('clinics')
      .select(`
        id, 
        name,
        locations(id, name)
      `)
      .eq('company_id', company_id)
      .eq('active', true)
      .order('name', { ascending: true });
    
    // Process clinics with location data for the selector
    const clinics = clinicsRaw?.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      location_name: clinic.locations && Array.isArray(clinic.locations) && clinic.locations.length > 0
        ? clinic.locations[0].name
        : null
    })) || [];
    
    // Get the basic equipment data
    const { data: equipmentData, error } = await supabase
      .from('equipment')
      .select(`
        id,
        name,
        quantity,
        active,
        created_at,
        clinic_id
      `)
      .order('name', { ascending: true });
    
    if (error) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Unable to load equipment</h3>
          <p>We encountered a problem loading your equipment data. Please try again or contact support if the issue persists.</p>
          <p className="text-xs mt-2">{error.message}</p>
        </div>
      );
    }
    
    if (!equipmentData || equipmentData.length === 0) {
      return <EmptyState message="No equipment found. Add your first equipment item to get started." />;
    }
    
    // Get all clinic data we need with location information
    const clinicIds = Array.from(new Set(equipmentData.map(equipment => equipment.clinic_id)));
    const { data: clinicData } = await supabase
      .from('clinics')
      .select(`
        id, 
        name,
        locations(id, name)
      `)
      .in('id', clinicIds);
    
    // Process clinics to include location name
    const processedClinics = clinicData?.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      location_name: clinic.locations && Array.isArray(clinic.locations) && clinic.locations.length > 0
        ? clinic.locations[0].name
        : null
    })) || [];
    
    // Map clinics to their respective equipment
    const equipment = equipmentData.map(item => {
      // Find the matching clinic
      const clinic = processedClinics?.find(c => c.id === item.clinic_id) || null;
      
      return {
        ...item,
        clinic: clinic
      };
    });
    
    return (
      <div className="space-y-6">
        {clinics && clinics.length > 1 && (
          <ClinicSelector 
            clinics={clinics}
            urlParam={true}
            basePath="/equipment"
            multiSelect={false}
          />
        )}
        <EquipmentTable equipment={equipment} />
      </div>
    );
  } catch (error) {
    console.error('Error in EquipmentPageContent:', error);
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Unexpected error</h3>
        <p>We encountered an unexpected problem. Please try again or contact support if the issue persists.</p>
      </div>
    );
  }
}
