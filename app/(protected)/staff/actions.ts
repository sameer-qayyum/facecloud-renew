'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
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
      // Create new user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        email_confirm: true,
      });
      
      if (authError || !authUser.user) {
        return { error: `Failed to create user: ${authError?.message}` };
      }
      
      userId = authUser.user.id;
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          profile_picture: validatedData.profilePicture,
        });
      
      if (profileError) {
        return { error: `Failed to create user profile: ${profileError.message}` };
      }
    }
    
    // Create staff record
    const { data: newStaff, error: staffError } = await supabase
      .from('staff')
      .insert({
        user_id: userId,
        company_id: staffData.company_id,
        clinic_id: validatedData.clinicId || null,
        role: validatedData.role,
        active: validatedData.active,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (staffError) {
      return { error: `Failed to create staff record: ${staffError.message}` };
    }
    
    // Revalidate staff page to reflect the changes
    revalidatePath('/staff');
    
    return { data: newStaff, success: true };
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
