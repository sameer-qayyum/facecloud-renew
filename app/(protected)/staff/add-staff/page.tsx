// Server Component for Add Staff page
import { Suspense } from 'react';
import { getCompanyClinics } from '../actions';
import { Card } from '@/components/ui/card';
import AddStaffContent from './add-staff-content';

export const metadata = {
  title: 'Add Staff | FaceCloud',
  description: 'Add a new staff member to your organization',
};

// This is a pure Server Component - can be async
export default async function AddStaffPage() {
  // Fetch clinic data directly - don't use unstable_cache since 
  // the underlying function uses cookies which can't be cached
  const clinicsResult = await getCompanyClinics();
  const clinics = clinicsResult.data || [];
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add New Staff</h1>
        <p className="text-sm text-muted-foreground">Add a new staff member to your organization</p>
      </div>
      
      <Suspense fallback={
        <Card className="p-6">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </Card>
      }>
        <AddStaffContent initialClinics={clinics} />
      </Suspense>
    </div>
  );
}
