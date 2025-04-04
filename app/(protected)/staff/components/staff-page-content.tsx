'use server';

import { createClient } from '@/utils/supabase/server';
import { StaffTable } from '@/app/(protected)/staff/components/staff-table';
import { EmptyState } from '@/app/(protected)/staff/components/empty-state';
import { ClinicSelector } from '@/app/(protected)/staff/components/clinic-selector';

// Define types for the staff data structure
interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

interface ClinicInfo {
  name: string;
}

interface StaffMember {
  id: string;
  user_id: string;
  company_id: string;
  clinic_id: string | null;
  location_id: string | null;
  role: 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';
  active: boolean;
  created_at: string;
  updated_at: string;
  user_profiles: UserProfile;
  clinics: ClinicInfo | null;
}

interface ProcessedStaffMember {
  id: string;
  user_id: string;
  company_id: string;
  clinic_id: string | null;
  location_id: string | null;
  role: 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';
  active: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture: string;
  clinic_name: string;
}

// Loading skeleton for staff table
const StaffTableSkeleton = () => (
  <div className="space-y-4">
    <div className="h-10 w-full bg-muted rounded animate-pulse" />
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
      ))}
    </div>
  </div>
);

export default async function StaffPageContent() {
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
    // Fetch all clinics for this company for the clinic selector
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('company_id', company_id)
      .eq('active', true)
      .order('name', { ascending: true });
    
    // Now fetch staff members for this company
    const { data: staffMembers, error } = await supabase
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
        user_profiles!user_id(
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
      .eq('company_id', company_id)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      const errorMessage = `Error fetching staff: ${error.message}`;
      console.error(errorMessage);
      
      return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Unable to load staff</h3>
          <p>We encountered a problem loading your staff data. Please try again or contact support if the issue persists.</p>
        </div>
      );
    }
    
    if (!staffMembers || staffMembers.length === 0) {
      return <EmptyState />;
    }
    
    // Process the staff data to include user profiles
    const processedStaff: ProcessedStaffMember[] = (staffMembers as any[]).map(staff => ({
      id: staff.id,
      user_id: staff.user_id,
      company_id: staff.company_id,
      clinic_id: staff.clinic_id,
      location_id: staff.location_id,
      role: staff.role,
      active: staff.active,
      created_at: staff.created_at,
      updated_at: staff.updated_at,
      first_name: staff.user_profiles?.first_name || '',
      last_name: staff.user_profiles?.last_name || '',
      email: staff.user_profiles?.email || '',
      phone: staff.user_profiles?.phone || '',
      profile_picture: staff.user_profiles?.profile_picture || '',
      clinic_name: staff.clinics?.name || 'No Clinic Assigned'
    }));
    
    return (
      <div className="space-y-6">
        {clinics && clinics.length > 1 && (
          <div>
            {/* Clinic filter UI goes here */}
          </div>
        )}
        
        <StaffTable staff={processedStaff} />
      </div>
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Unable to load staff</h3>
        <p>We encountered an unexpected problem. Please try again or contact support if the issue persists.</p>
      </div>
    );
  }
}
