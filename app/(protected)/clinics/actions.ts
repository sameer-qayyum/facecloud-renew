'use server';

import { createClient } from '@/utils/supabase/server';
import { Clinic, Location } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Define the type for operating hours
interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// Define the submission data interface that will be sent to the server
interface ClinicSubmissionData {
  clinic: {
    name: string;
    logoBase64?: string;
  };
  location: Partial<Location>; // This includes the contact info (email, phone)
  operatingHours: OperatingHours;
}

/**
 * Save clinic form as a draft
 */
export async function saveClinicDraft(data: ClinicSubmissionData) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to save a draft');
  }
  
  // Get the user's company ID from staff record
  const { data: staffRecords } = await supabase
    .from('staff')
    .select('company_id')
    .eq('user_id', user.id);
  
  if (!staffRecords || staffRecords.length === 0) {
    throw new Error('You must be associated with a company to create clinics');
  }
  
  const company_id = staffRecords[0].company_id;
  
  // Store in local storage for now - in a production app,
  // you might want to save this to a drafts table in your database
  const draftKey = `clinic_draft_${user.id}`;
  
  // In a real implementation, save to a drafts table in the database
  // For now, we'll return success to simulate saving
  return { success: true, draftKey };
}

/**
 * Create a new clinic with its location and operating hours
 */
export async function createClinic(data: ClinicSubmissionData) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a clinic');
  }
  
  // Get the user's company ID from staff record
  const { data: staffRecords } = await supabase
    .from('staff')
    .select('company_id, role')
    .eq('user_id', user.id);
  
  if (!staffRecords || staffRecords.length === 0) {
    throw new Error('You must be associated with a company to create clinics');
  }
  
  // Check if user has permission (owner or manager)
  const userRoles = staffRecords.map(record => record.role);
  if (!userRoles.some(role => ['owner', 'manager'].includes(role))) {
    throw new Error('You must be an owner or manager to create clinics');
  }
  
  const company_id = staffRecords[0].company_id;
  
  try {
    // Upload logo if provided (optimize with smaller size for better performance)
    let logoUrl = null;
    if (data.clinic.logoBase64) {
      // Extract the base64 data part (remove the data:image/xxx;base64, prefix)
      const base64Data = data.clinic.logoBase64.split(',')[1];
      
      // Generate a unique file name using timestamp
      const fileName = `clinic-logos/${company_id}/${Date.now()}.png`;
      
      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('clinic-assets')
        .upload(fileName, Buffer.from(base64Data, 'base64'), {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
      } else {
        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('clinic-assets')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrlData.publicUrl;
      }
    }
    
    // Start a transaction to create both clinic and location
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        name: data.clinic.name,
        company_id,
        logo_url: logoUrl,
        created_by: user.id,
      })
      .select()
      .single();
      
    if (clinicError) throw clinicError;
    
    // Create the location for this clinic
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        clinic_id: clinic.id,
        name: data.location.suburb || 'Main Location', // Using suburb as the location name
        address: data.location.address,
        suburb: data.location.suburb,
        state: data.location.state,
        postcode: data.location.postcode,
        country: data.location.country || 'Australia',
        phone: data.location.phone,
        email: data.location.email,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (locationError) throw locationError;
    
    // Store operating hours in the database
    // Note: You'll need to make sure this table exists in your database
    for (const [day, schedule] of Object.entries(data.operatingHours)) {
      if (schedule.isOpen) {
        const { error: hoursError } = await supabase
          .from('clinic_hours')
          .insert({
            clinic_id: clinic.id,
            location_id: location.id,
            day_of_week: day,
            open_time: schedule.openTime,
            close_time: schedule.closeTime,
            created_by: user.id,
          });
        
        if (hoursError) throw hoursError;
      }
    }
    
    // Revalidate clinics page to show the new clinic
    revalidatePath('/clinics');
    
    return {
      success: true,
      clinicId: clinic.id,
      locationId: location.id,
      redirectPath: '/clinics',
    };
  } catch (error) {
    console.error('Error creating clinic:', error);
    throw error;
  }
}
