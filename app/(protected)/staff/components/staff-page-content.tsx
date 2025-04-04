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

interface LocationInfo {
  id: string;
  name: string;
  clinic: {
    id: string;
    name: string;
  }
}

interface StaffAssignment {
  location_id: string;
  role: 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';
  primary_location: boolean;
  location: LocationInfo;
}

interface StaffMember {
  id: string;
  user_id: string;
  company_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  user_profiles: UserProfile;
  staff_assignments: StaffAssignment[];
}

interface ProcessedStaffMember {
  id: string;
  user_id: string;
  company_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture: string;
  role: 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';
  clinic_id: string | null;
  location_id: string | null;
  clinic_name: string;
  location_names: string[];
  assignment_count: number;
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
  
  // Get the user's company_id from their staff record or company_owners
  let company_id: string | null = null;
  
  // First check staff records
  const { data: staffRecords } = await supabase
    .from('staff')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('active', true);
    
  console.log('User staff records:', staffRecords);
  
  if (staffRecords && staffRecords.length > 0) {
    company_id = staffRecords[0].company_id;
  } else {
    // If no staff records, check company_owners
    const { data: companyOwners } = await supabase
      .from('company_owners')
      .select('company_id')
      .eq('user_id', user.id);
      
    console.log('User company ownership:', companyOwners);
    
    if (companyOwners && companyOwners.length > 0) {
      company_id = companyOwners[0].company_id;
    }
  }
  
  // User has no company association
  if (!company_id) {
    console.log('No company association found');
    return <EmptyState />;
  }
  
  console.log('Using company_id:', company_id);
  
  try {
    // Fetch all clinics for this company for the clinic selector
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('company_id', company_id)
      .eq('active', true)
      .order('name', { ascending: true });
    
    // Now fetch staff members for this company with the new data model
    const { data: staffMembers, error } = await supabase
      .from('staff')
      .select(`
        id, 
        user_id,
        company_id,
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
        staff_assignments(
          location_id,
          role,
          primary_location,
          location:locations(
            id,
            name,
            clinic:clinics(
              id,
              name
            )
          )
        )
      `)
      .eq('company_id', company_id)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    console.log('Staff query result:', staffMembers);
    console.log('Staff query error:', error);
    
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
      console.log('No staff found for company:', company_id);
      return <EmptyState />;
    }
    
    // Process the staff data to include user profiles and primary assignment
    const processedStaff: ProcessedStaffMember[] = (staffMembers as any[]).map(staff => {
      // Get primary assignment or first assignment or default values
      let primaryAssignment = staff.staff_assignments?.find((a: any) => a.primary_location) 
        || (staff.staff_assignments?.length > 0 ? staff.staff_assignments[0] : null);
      
      // Get all location names for this staff member
      const locationNames = staff.staff_assignments?.map((assignment: any) => 
        assignment.location?.name
      ).filter(Boolean) || [];
      
      return {
        id: staff.id,
        user_id: staff.user_id,
        company_id: staff.company_id,
        active: staff.active,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
        first_name: staff.user_profiles?.first_name || '',
        last_name: staff.user_profiles?.last_name || '',
        email: staff.user_profiles?.email || '',
        phone: staff.user_profiles?.phone || '',
        profile_picture: staff.user_profiles?.profile_picture || '',
        // Use primary assignment data or defaults
        role: primaryAssignment?.role || 'admin',
        location_id: primaryAssignment?.location_id || null,
        clinic_id: primaryAssignment?.location?.clinic?.id || null,
        clinic_name: primaryAssignment?.location?.clinic?.name || 'No Clinic Assigned',
        // Add all location assignments
        location_names: locationNames,
        assignment_count: staff.staff_assignments?.length || 0
      };
    });
    
    console.log('Processed staff data:', processedStaff);
    
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
