import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "No treatment rooms found" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-lg bg-white/50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-primary opacity-80"
        >
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
          <path d="M12 12v6" />
          <path d="M9 15h6" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        {message}
      </h3>
      <p className="mt-2 text-center text-sm text-slate-600 max-w-xs">
        Treatment rooms help you manage where services are performed in your clinic.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link href="/rooms/add-room">
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment Room
        </Link>
      </Button>
    </div>
  );
}
