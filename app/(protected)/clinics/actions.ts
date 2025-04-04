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
      try {
        // Extract the MIME type and base64 data
        const [mimeTypeData, base64Data] = data.clinic.logoBase64.split(',');
        const mimeType = mimeTypeData.match(/:(.*?);/)?.[1] || 'image/jpeg'; // Default to JPEG if can't detect
        
        // Determine file extension from MIME type
        const fileExtension = mimeType.split('/')[1] || 'jpg';
        
        // Generate a unique file name using timestamp with proper extension
        const fileName = `clinic-logos/${company_id}/${Date.now()}.${fileExtension}`;
        
        console.log('Uploading image with MIME type:', mimeType);
        console.log('File path:', fileName);
        
        // Upload to storage bucket
        const { error: uploadError } = await supabase
          .storage
          .from('clinic-assets')
          .upload(fileName, Buffer.from(base64Data, 'base64'), {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: true // Set to true to overwrite if needed
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
          console.log('Logo uploaded successfully at:', logoUrl);
        }
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
    
    // 1. Create the clinic with basic info
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        name: data.clinic.name,
        company_id: company_id,
        logo_url: logoUrl,
        active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, name, company_id')
      .single();
    
    console.log('Clinic creation result:', clinic);
    console.log('Clinic creation error:', clinicError);
    
    if (clinicError) {
      console.error('Error creating clinic:', clinicError);
      throw clinicError;
    }
    
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
    
    // 3. Add current user as staff with owner role for this clinic (updated for new data model)
    // This minimal staff creation is needed for clinic ownership, but other staff management
    // should be done through the staff actions file
    
    // First, check if the user already has a staff record for this company
    const { data: existingStaff, error: existingStaffError } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single();
    
    let staffId;
    
    if (existingStaffError && existingStaffError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      throw existingStaffError;
    }
    
    // If staff record doesn't exist for this company, create it
    if (!existingStaff) {
      const { data: newStaff, error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: user.id,
          company_id,
          created_by: user.id,
        })
        .select('id')
        .single();
      
      if (staffError) throw staffError;
      staffId = newStaff.id;
    } else {
      staffId = existingStaff.id;
    }
    
    // Create staff assignment for this location with owner role
    const { error: assignmentError } = await supabase
      .from('staff_assignments')
      .insert({
        staff_id: staffId,
        location_id: location.id,
        role: 'owner',
        primary_location: true,
        created_by: user.id,
      });
    
    if (assignmentError) throw assignmentError;
    
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

/**
 * Update a clinic's active status
 */
export async function updateClinicStatus(clinicId: string, active: boolean): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Update the clinic status
    const { error } = await supabase
      .from('clinics')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', clinicId);
    
    if (error) throw error;
    
    // Revalidate the clinics page to show updated status
    revalidatePath('/clinics');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating clinic status:', error);
    throw error;
  }
}

/**
 * Soft delete a clinic
 */
export async function softDeleteClinic(clinicId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Soft delete the clinic
    const { error } = await supabase
      .from('clinics')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', clinicId);
    
    if (error) throw error;
    
    // Revalidate the clinics page to show updated status
    revalidatePath('/clinics');
    
    return { success: true };
  } catch (error) {
    console.error('Error soft deleting clinic:', error);
    throw error;
  }
}

/**
 * Update clinic details and location information
 */
export async function updateClinic(clinicId: string, data: ClinicSubmissionData): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Upload logo if provided (optimize with smaller size for better performance)
    let logoUrl = null;
    if (data.clinic.logoBase64) {
      try {
        // Extract the MIME type and base64 data
        const [mimeTypeData, base64Data] = data.clinic.logoBase64.split(',');
        const mimeType = mimeTypeData.match(/:(.*?);/)?.[1] || 'image/jpeg'; // Default to JPEG if can't detect
        
        // Determine file extension from MIME type
        const fileExtension = mimeType.split('/')[1] || 'jpg';
        
        // Get company ID for the logo path
        const { data: clinicData, error: clinicDataError } = await supabase
          .from('clinics')
          .select('company_id')
          .eq('id', clinicId)
          .single();
        
        if (clinicDataError || !clinicData) {
          console.error('Error getting clinic data:', clinicDataError);
          throw new Error('Failed to get clinic data for logo upload');
        }
        
        // Generate a unique file name using timestamp with proper extension
        const fileName = `clinic-logos/${clinicData.company_id}/${Date.now()}.${fileExtension}`;
        
        console.log('Uploading image with MIME type:', mimeType);
        console.log('File path:', fileName);
        
        // Upload to storage bucket
        const { error: uploadError } = await supabase
          .storage
          .from('clinic-assets')
          .upload(fileName, Buffer.from(base64Data, 'base64'), {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: true // Override existing logo
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
          console.log('Logo uploaded successfully at:', logoUrl);
        }
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
    
    // 1. Update the clinic details
    const clinicUpdate: any = {
      name: data.clinic.name,
      updated_at: new Date().toISOString()
    };
    
    // Only add logo_url if a new logo was uploaded
    if (logoUrl) {
      clinicUpdate.logo_url = logoUrl;
    }
    
    const { error: clinicError } = await supabase
      .from('clinics')
      .update(clinicUpdate)
      .eq('id', clinicId);
    
    if (clinicError) throw clinicError;
    
    // 2. Update the location with operating hours
    const { error: locationError } = await supabase
      .from('locations')
      .update({
        name: data.location.suburb || 'Main Location',
        address: data.location.address,
        suburb: data.location.suburb,
        state: data.location.state,
        postcode: data.location.postcode,
        country: data.location.country || 'Australia',
        phone: data.location.phone,
        email: data.location.email,
        opening_hours: formatOperatingHoursForDb(data.operatingHours),
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', clinicId);
    
    if (locationError) throw locationError;
    
    // Revalidate paths
    revalidatePath('/clinics');
    revalidatePath(`/clinics/${clinicId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating clinic:', error);
    throw error;
  }
}
