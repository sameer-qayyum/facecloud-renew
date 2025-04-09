'use server';

import { createClient } from '@/utils/supabase/server';
import { RoomsTable } from '@/app/(protected)/rooms/components/rooms-table';
import { EmptyState } from '@/app/(protected)/rooms/components/empty-state';
import { ClinicSelector } from '@/app/(protected)/rooms/components/clinic-selector';

// Define types for the rooms data structure
interface RoomType {
  id: string;
  name: string;
  description: string | null;
}

interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

// Our room interface for frontend use
interface Room {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  room_type_id: string;
  clinic_id: string;
  room_type: RoomType | null;
  clinic: Clinic | null;
}

export default async function RoomsPageContent() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <EmptyState message="Please sign in to view rooms" />;
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
    
    // First, get the basic rooms data
    const { data: roomsData, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        active,
        created_at,
        room_type_id,
        clinic_id
      `)
      .order('name', { ascending: true });
    
    if (error) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Unable to load rooms</h3>
          <p>We encountered a problem loading your room data. Please try again or contact support if the issue persists.</p>
          <p className="text-xs mt-2">{error.message}</p>
        </div>
      );
    }
    
    if (!roomsData || roomsData.length === 0) {
      return <EmptyState message="No rooms found. Add your first treatment room to get started." />;
    }
    
    // Now get all the room types that we need (to avoid N+1 queries)
    const roomTypeIds = Array.from(new Set(roomsData.map(room => room.room_type_id)));
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name, description')
      .in('id', roomTypeIds);
      
    // Get all clinic data we need with location information
    const clinicIds = Array.from(new Set(roomsData.map(room => room.clinic_id)));
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
    
    // Map room types and clinics to their respective rooms
    const rooms = roomsData.map(room => {
      // Find the matching room type and clinic
      const roomType = roomTypes?.find(rt => rt.id === room.room_type_id) || null;
      const clinic = processedClinics?.find(c => c.id === room.clinic_id) || null;
      
      return {
        ...room,
        room_type: roomType,
        clinic: clinic
      };
    });
    
    return (
      <div className="space-y-6">
        {clinics && clinics.length > 1 && (
          <ClinicSelector clinics={clinics} />
        )}
        <RoomsTable rooms={rooms} />
      </div>
    );
  } catch (error) {
    console.error('Error in RoomsPageContent:', error);
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Unexpected error</h3>
        <p>We encountered an unexpected problem. Please try again or contact support if the issue persists.</p>
      </div>
    );
  }
}
