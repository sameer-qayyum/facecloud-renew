import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import StaffPageContent from './components/staff-page-content';
import StaffSkeleton from './components/staff-skeleton';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Button asChild>
          <Link href="/staff/add-staff">Add Staff Member</Link>
        </Button>
      </div>
      
      <Suspense fallback={<StaffSkeleton />}>
        <StaffPageContent />
      </Suspense>
    </div>
  );
}
