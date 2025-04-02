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
 * Format operating hours from form structure to database JSONB structure
 */
function formatOperatingHoursForDb(hours: OperatingHours): Record<string, string[]> {
  const dbFormat: Record<string, string[]> = {};
  
  // Map day names to database format
  const dayMapping: Record<string, string> = {
    'monday': 'mon',
    'tuesday': 'tue',
    'wednesday': 'wed',
    'thursday': 'thu',
    'friday': 'fri',
    'saturday': 'sat',
    'sunday': 'sun'
  };
  
  // Convert from our form format to the DB format
  Object.entries(hours).forEach(([day, schedule]) => {
    if (schedule.isOpen && schedule.openTime && schedule.closeTime) {
      const dbDay = dayMapping[day];
      dbFormat[dbDay] = [`${schedule.openTime}-${schedule.closeTime}`];
    }
  });
  
  return dbFormat;
}

/**
 * Save clinic form as a draft
 */
export async function saveClinicDraft(data: ClinicSubmissionData): Promise<{ success: boolean; draftKey: string }> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to save a draft');
  }
  
  // Get the user's company ID from company_owners record
  const { data: staffRecords } = await supabase
    .from('company_owners')
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
export async function createClinic(data: ClinicSubmissionData): Promise<{ success: boolean; clinicId: string; locationId: string; redirectPath: string }> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a clinic');
  }
  
  try {
    // Get the user's company through company_owners with debug logging
    console.log('Checking company ownership for user:', user.id);
    
    const { data: ownedCompanies, error: ownershipError } = await supabase
      .from('company_owners')
      .select('company_id, user_id')
      .eq('user_id', user.id)
      .limit(1);
    
    console.log('Company ownership query result:', ownedCompanies);
    console.log('Company ownership query error:', ownershipError);
    
    if (ownershipError) {
      console.error('Error fetching company ownership:', ownershipError);
      throw ownershipError;
    }
    
    if (!ownedCompanies || ownedCompanies.length === 0) {
      throw new Error('No company found. Please ensure your account is properly set up with a company.');
    }
    
    const company_id = ownedCompanies[0].company_id;
    
    // Upload logo if provided (optimize with smaller size for better performance)
    let logoUrl = null;
    if (data.clinic.logoBase64) {
      // Extract the base64 data part (remove the data:image/xxx;base64, prefix)
      const base64Data = data.clinic.logoBase64.split(',')[1];
      
      // Generate a unique file name using timestamp
      const fileName = `clinic-logos/${company_id}/${Date.now()}.png`;
      
      // Upload to storage bucket
      const { error: uploadError } = await supabase
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
    
    // 1. Create the clinic
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
    
    // 2. Create the location with operating hours in JSONB format
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        clinic_id: clinic.id,
        name: data.location.suburb || 'Main Location',
        address: data.location.address,
        suburb: data.location.suburb,
        state: data.location.state,
        postcode: data.location.postcode,
        country: data.location.country || 'Australia',
        phone: data.location.phone,
        email: data.location.email,
        opening_hours: formatOperatingHoursForDb(data.operatingHours),
        created_by: user.id,
      })
      .select()
      .single();
    
    if (locationError) throw locationError;
    
    // 3. Add current user as staff with owner role for this clinic
    const { error: staffError } = await supabase
      .from('staff')
      .insert({
        user_id: user.id,
        company_id,
        clinic_id: clinic.id,
        location_id: location.id,
        role: 'owner',
        created_by: user.id,
      });
    
    if (staffError) throw staffError;
    
    // Revalidate clinics page to show the new clinic
    revalidatePath('/clinics');
    
    return {
      success: true,
      clinicId: clinic.id,
      locationId: location.id,
      redirectPath: `/clinics/${clinic.id}`,
    };
  } catch (error) {
    console.error('Error creating clinic:', error);
    throw error;
  }
}
