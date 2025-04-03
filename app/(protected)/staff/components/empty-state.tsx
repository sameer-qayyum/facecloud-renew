'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-lg text-center bg-muted/10">
      <Users className="h-12 w-12 text-primary/40 mb-4" />
      <h2 className="text-xl font-semibold">No staff members found</h2>
      <p className="text-muted-foreground mt-2 mb-6 max-w-md">
        You haven&apos;t added any staff members yet. Add staff members to manage your clinic team efficiently.
      </p>
      <Button asChild>
        <Link href="/staff/add-staff">
          Add Your First Staff Member
        </Link>
      </Button>
    </div>
  );
}
