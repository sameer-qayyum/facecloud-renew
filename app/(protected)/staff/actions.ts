'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { z } from 'zod';

// Staff form schema
const staffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin']),
  clinicId: z.string().optional(),
  active: z.boolean().default(true),
  profilePicture: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

/**
 * Create a new staff member
 */
export async function createStaff(formData: StaffFormValues) {
  const supabase = await createClient();
  
  // Get current user for audit trail
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to create staff members.' };
  }
  
  try {
    // Validate form data
    const validatedData = staffFormSchema.parse(formData);
    
    // Get user's company ID from their staff record
    const { data: staffData } = await supabase
      .from('staff')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();
    
    if (!staffData) {
      return { error: 'Company information not found' };
    }
    
    // Check if user with the email already exists in auth.users
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', validatedData.email)
      .maybeSingle();
    
    let userId: string;
    
    if (existingUsers) {
      // Use existing user
      userId = existingUsers.id;
    } else {
      // Using inviteUserByEmail to create user and send invitation in one step
      const adminClient = createAdminClient();
      
      // This will create a user, trigger the handle_user_signup function, and send an invitation
      // The database trigger will automatically create the user_profile entry
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?onboard=true`;
      console.log('Sending invitation with redirectTo:', inviteUrl);
      
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        validatedData.email,
        {
          redirectTo: inviteUrl,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            role: validatedData.role,
            invited_by: user.id,
            company_id: staffData.company_id,
            clinic_id: validatedData.clinicId || null,
            phone: validatedData.phone,
            profile_picture: validatedData.profilePicture
          }
        }
      );

      if (inviteError || !inviteData?.user) {
        console.error('Invitation error:', inviteError);
        return { error: `Failed to invite user: ${inviteError?.message}` };
      }
      
      userId = inviteData.user.id;
      
      // No need to manually create user_profile - the database trigger does this for us
    }
    
    // If clinic is specified, get its locations
    let locations = [];
    if (validatedData.clinicId) {
      const { data: clinicLocations, error: locationsError } = await supabase
        .from('locations')
        .select('id')
        .eq('clinic_id', validatedData.clinicId);
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        return { error: `Failed to fetch clinic locations: ${locationsError.message}` };
      }
      
      locations = clinicLocations || [];
    }
    
    // Create staff records - one for each location if clinic has locations
    let staffRecords = [];
    let newStaff = null;
    
    if (locations.length > 0) {
      // Create multiple staff records, one for each location
      const staffInserts = locations.map(location => ({
        user_id: userId,
        company_id: staffData.company_id,
        clinic_id: validatedData.clinicId,
        location_id: location.id,
        role: validatedData.role,
        active: validatedData.active,
        created_by: user.id,
      }));
      
      const { data: insertedStaff, error: bulkInsertError } = await supabase
        .from('staff')
        .insert(staffInserts)
        .select();
      
      if (bulkInsertError) {
        return { error: `Failed to create staff records: ${bulkInsertError.message}` };
      }
      
      staffRecords = insertedStaff || [];
      newStaff = staffRecords[0]; // Use the first record as the primary
    } else {
      // No locations or no clinic specified, create a single staff record without location
      const { data: singleStaff, error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: userId,
          company_id: staffData.company_id,
          clinic_id: validatedData.clinicId || null,
          location_id: null,
          role: validatedData.role,
          active: validatedData.active,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (staffError) {
        return { error: `Failed to create staff record: ${staffError.message}` };
      }
      
      newStaff = singleStaff;
      staffRecords = [singleStaff];
    }
    
    // Revalidate staff page to reflect the changes
    revalidatePath('/staff');
    
    return { 
      data: newStaff, 
      allRecords: staffRecords.length > 1 ? staffRecords : undefined,
      success: true 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Validation error', details: error.errors };
    }
    return { error: 'Failed to create staff member. Please try again.' };
  }
}

/**
 * Update an existing staff member
 */
export async function updateStaff(staffId: string, formData: StaffFormValues) {
  const supabase = await createClient();
  
  // Get current user for auth check
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to update staff members.' };
  }
  
  try {
    // Validate form data
    const validatedData = staffFormSchema.parse(formData);
    
    // Get the staff record to update
    const { data: staffData, error: fetchError } = await supabase
      .from('staff')
      .select('user_id, company_id')
      .eq('id', staffId)
      .single();
    
    if (fetchError || !staffData) {
      return { error: 'Staff member not found' };
    }
    
    // Check user authorization (only company owners and managers can edit staff)
    const { data: userRole } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', staffData.company_id)
      .eq('active', true)
      .single();
    
    if (!userRole || !['owner', 'manager'].includes(userRole.role)) {
      return { error: 'Unauthorized. Only owners and managers can update staff members.' };
    }
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        profile_picture: validatedData.profilePicture,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffData.user_id);
    
    if (profileError) {
      return { error: `Failed to update user profile: ${profileError.message}` };
    }
    
    // Update staff record
    const { data: updatedStaff, error: staffError } = await supabase
      .from('staff')
      .update({
        clinic_id: validatedData.clinicId || null,
        role: validatedData.role,
        active: validatedData.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)
      .select()
      .single();
    
    if (staffError) {
      return { error: `Failed to update staff record: ${staffError.message}` };
    }
    
    // Revalidate staff page to reflect the changes
    revalidatePath('/staff');
    
    return { data: updatedStaff, success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Validation error', details: error.errors };
    }
    return { error: 'Failed to update staff member. Please try again.' };
  }
}

/**
 * Soft delete a staff member (mark as inactive)
 */
export async function softDeleteStaff(staffId: string) {
  const supabase = await createClient();
  
  // Get current user for auth check
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to delete staff members.' };
  }
  
  try {
    // Get the staff record to delete
    const { data: staffData, error: fetchError } = await supabase
      .from('staff')
      .select('company_id')
      .eq('id', staffId)
      .single();
    
    if (fetchError || !staffData) {
      return { error: 'Staff member not found' };
    }
    
    // Check user authorization (only company owners and managers can delete staff)
    const { data: userRole } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', staffData.company_id)
      .eq('active', true)
      .single();
    
    if (!userRole || !['owner', 'manager'].includes(userRole.role)) {
      return { error: 'Unauthorized. Only owners and managers can delete staff members.' };
    }
    
    // Soft delete the staff member (mark as inactive)
    const { error: deleteError } = await supabase
      .from('staff')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId);
    
    if (deleteError) {
      return { error: `Failed to delete staff member: ${deleteError.message}` };
    }
    
    // Revalidate staff page to reflect the changes
    revalidatePath('/staff');
    
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete staff member. Please try again.' };
  }
}

/**
 * Get a staff member by ID
 */
export async function getStaffById(staffId: string) {
  const supabase = await createClient();
  
  // Get current user for auth check
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to view staff members.' };
  }
  
  try {
    const { data: staffData, error } = await supabase
      .from('staff')
      .select(`
        id, 
        user_id,
        company_id,
        clinic_id,
        location_id,
        role,
        active,
        created_at,
        updated_at,
        user_profiles:user_id(
          first_name,
          last_name,
          email,
          phone,
          profile_picture
        ),
        clinics:clinic_id(
          name
        )
      `)
      .eq('id', staffId)
      .single();
    
    if (error) {
      return { error: `Failed to fetch staff member: ${error.message}` };
    }
    
    if (!staffData) {
      return { error: 'Staff member not found' };
    }
    
    // Format the staff data
    const formattedStaff = {
      id: staffData.id,
      user_id: staffData.user_id,
      company_id: staffData.company_id,
      clinic_id: staffData.clinic_id,
      location_id: staffData.location_id,
      role: staffData.role,
      active: staffData.active,
      created_at: staffData.created_at,
      updated_at: staffData.updated_at,
      first_name: (staffData as any).user_profiles?.first_name || '',
      last_name: (staffData as any).user_profiles?.last_name || '',
      email: (staffData as any).user_profiles?.email || '',
      phone: (staffData as any).user_profiles?.phone || '',
      profile_picture: (staffData as any).user_profiles?.profile_picture || '',
      clinic_name: (staffData as any).clinics?.name || 'No Clinic Assigned',
    };
    
    return { data: formattedStaff, success: true };
  } catch (error) {
    return { error: 'Failed to fetch staff member. Please try again.' };
  }
}

/**
 * Get clinics for a company
 */
export async function getCompanyClinics() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to view clinics.' };
  }
  
  try {
    // Get user's company ID
    const { data: staffData } = await supabase
      .from('staff')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();
    
    if (!staffData) {
      return { error: 'Company information not found' };
    }
    
    // Get clinics for the company
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('company_id', staffData.company_id)
      .eq('active', true)
      .order('name', { ascending: true });
    
    if (error) {
      return { error: `Failed to fetch clinics: ${error.message}` };
    }
    
    return { data: clinics, success: true };
  } catch (error) {
    return { error: 'Failed to fetch clinics. Please try again.' };
  }
}

/**
 * Resend invitation to a staff member
 */
export async function resendStaffInvitation(staffId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  // Get current user for audit trail
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized. Please sign in to resend invitations.' };
  }
  
  try {
    // Get staff member details
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        user_id,
        company_id,
        clinic_id,
        role,
        user_profiles!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', staffId)
      .single();
    
    if (staffError || !staffData) {
      return { error: 'Staff member not found' };
    }
    
    // Send magic link invitation email using admin API
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      (staffData.user_profiles as any).email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?onboard=true`,
        data: {
          invited_by: user.id,
          role: staffData.role,
          staff_id: staffData.id
        }
      }
    );

    if (inviteError) {
      console.error('Invitation error:', inviteError);
      return { error: `Failed to send invitation: ${inviteError.message}` };
    }
    
    // Update staff record to track invitation resent
    await supabase
      .from('staff')
      .update({
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', staffId);
    
    return { success: true };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return { error: 'Failed to resend invitation. Please try again.' };
  }
}
