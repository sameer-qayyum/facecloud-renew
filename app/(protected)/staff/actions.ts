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
  ahpraNumber: z.string().optional(),
  role: z.enum(['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin']),
  clinicId: z.string().optional(),
  active: z.boolean().default(true),
  profilePicture: z.string().optional(),
  profilePictureBase64: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

/**
 * Create a new staff member with support for the new staff assignments model
 */
export async function createStaff(formData: StaffFormValues) {
  const supabase = await createClient();
  const adminClient = await createAdminClient();
  
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
      return { error: 'You must be associated with a company to create staff members.' };
    }
    
    let userId: string;
    
    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', validatedData.email)
      .maybeSingle();
    
    if (existingUser) {
      // User exists
      userId = existingUser.id;
    } else {
      // Process profile picture (if provided) before sending invitation
      let profilePictureUrl = '';
      if (validatedData.profilePictureBase64) {
        try {
          // Extract the file data and type from the base64 string
          const base64Str = validatedData.profilePictureBase64;
          const typeMatch = base64Str.match(/^data:([^;]+);base64,/);
          
          if (typeMatch) {
            const mimeType = typeMatch[1];
            const extension = mimeType.split('/')[1] || 'jpg';
            const base64Data = base64Str.replace(/^data:[^;]+;base64,/, '');
            
            // Generate a unique filename
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${extension}`;
            
            // Upload to storage using admin client
            const { error: uploadError } = await adminClient.storage
              .from('profile-pictures')
              .upload(fileName, Buffer.from(base64Data, 'base64'), {
                contentType: mimeType,
                upsert: true
              });
            
            if (!uploadError) {
              // Get public URL for the image
              const { data: publicUrlData } = adminClient.storage
                .from('profile-pictures')
                .getPublicUrl(fileName);
              
              profilePictureUrl = publicUrlData?.publicUrl || '';
              console.log('Uploaded profile picture:', profilePictureUrl);
            }
          }
        } catch (error) {
          console.error('Failed to process profile picture:', error);
          // Continue without profile picture
        }
      }
      
      // User doesn't exist, create a new one with invitation
      const { data: newUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        validatedData.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?onboard=true`,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            phone: validatedData.phone || '',
            ahpra_number: validatedData.ahpraNumber || '',
            profile_picture: profilePictureUrl, // Pass the uploaded URL
          },
        }
      );
      
      if (inviteError || !newUser?.user) {
        return { error: 'Error inviting user: ' + inviteError?.message };
      }
      
      // The user profile will be created by the database trigger
      // using the metadata passed in the invitation
      userId = newUser.user.id;
    }

    // Check if the staff record already exists for this company/user
    const { data: existingStaff, error: existingStaffError } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', staffData.company_id)
      .maybeSingle();
    
    let staffId: string;
    
    if (existingStaffError && existingStaffError.code !== 'PGRST116') {
      // Real error (not just "no rows returned")
      return { error: 'Error checking existing staff: ' + existingStaffError.message };
    }
    
    if (!existingStaff) {
      // Create staff record if it doesn't exist - use admin client to bypass RLS
      const { data: newStaff, error: staffError } = await adminClient
        .from('staff')
        .insert({
          user_id: userId,
          company_id: staffData.company_id,
          active: validatedData.active,
          created_by: user.id,
        })
        .select('id')
        .single();
      
      if (staffError || !newStaff) {
        return { error: 'Error creating staff record: ' + staffError?.message };
      }
      
      staffId = newStaff.id;
    } else {
      staffId = existingStaff.id;
    }
    
    // Now create the assignment for the specified location (clinic)
    if (validatedData.clinicId) {
      // Get the location ID for this clinic (assuming main location)
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('clinic_id', validatedData.clinicId)
        .single();
      
      if (locationError || !locationData) {
        return { error: 'Error finding location for clinic: ' + locationError?.message };
      }
      
      // Create the staff assignment - use admin client to bypass RLS
      const { error: assignmentError } = await adminClient
        .from('staff_assignments')
        .insert({
          staff_id: staffId,
          location_id: locationData.id,
          role: validatedData.role,
          primary_location: true, // First assignment is primary by default
          created_by: user.id,
        });
      
      if (assignmentError) {
        return { error: 'Error creating staff assignment: ' + assignmentError.message };
      }
    }
    
    // If role is owner, ensure they have a company_owners record
    if (validatedData.role === 'owner') {
      // First check if the record already exists to avoid errors
      const { data: existingOwner } = await supabase
        .from('company_owners')
        .select('id')
        .eq('company_id', staffData.company_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      // Only insert if it doesn't exist yet
      if (!existingOwner) {
        const { error: ownerError } = await supabase
          .from('company_owners')
          .insert({
            company_id: staffData.company_id,
            user_id: userId,
            created_by: user.id,
          });
        
        if (ownerError) {
          return { error: 'Error adding company owner: ' + ownerError.message };
        }
      }
    }
    
    // Revalidate pages
    revalidatePath('/staff');
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Validation error', details: error.format() };
    }
    return { error: 'An unexpected error occurred' };
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
    
    // Get the first location for each clinic
    const locationPromises = clinics.map(clinic => 
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
    const clinicsWithLocations = clinics.map(clinic => ({
      ...clinic,
      location_name: locationMap[clinic.id]
    }));
    
    return { data: clinicsWithLocations, success: true };
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
