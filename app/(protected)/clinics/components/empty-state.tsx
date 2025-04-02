'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-lg text-center bg-muted/10">
      <Building2 className="h-12 w-12 text-primary/40 mb-4" />
      <h2 className="text-xl font-semibold">No clinics found</h2>
      <p className="text-muted-foreground mt-2 mb-6 max-w-md">
        You haven&apos;t added any clinics yet. Create your first clinic to start managing appointments and staff.
      </p>
      <Button asChild>
        <Link href="/clinics/add-clinic">
          Add Your First Clinic
        </Link>
      </Button>
    </div>
  );
}
