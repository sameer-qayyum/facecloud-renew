'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-background">
      <div className="mb-4 p-3 rounded-full bg-muted">
        <Plus className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-medium">No Equipment Found</h3>
      <p className="mb-4 text-sm text-muted-foreground max-w-md">
        {message}
      </p>
      <Button onClick={() => router.push('/equipment/add-equipment')}>
        Add New Equipment
      </Button>
    </div>
  );
}
