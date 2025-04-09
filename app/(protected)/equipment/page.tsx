import { Suspense } from 'react';
import EquipmentPageContent from './components/equipment-page-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function EquipmentPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">
            Manage your clinic equipment inventory
          </p>
        </div>
        <Link href="/equipment/add-equipment">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Equipment
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<EquipmentPageSkeleton />}>
        <EquipmentPageContent />
      </Suspense>
    </div>
  );
}

function EquipmentPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[300px]" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}