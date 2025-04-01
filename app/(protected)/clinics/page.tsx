import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import ClinicsPageContent from './components/clinics-page-content';
import ClinicsSkeleton from './components/clinics-skeleton';
import { ClinicFilters } from './components/clinic-filters';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function ClinicsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Clinics</h1>
        <Button asChild>
          <Link href="/clinics/new">Add a Clinic</Link>
        </Button>
      </div>
      
      {/* Global filters for all clinic cards */}
      
      
      <Suspense fallback={<ClinicsSkeleton />}>
        <ClinicsPageContent />
      </Suspense>
    </div>
  );
}
