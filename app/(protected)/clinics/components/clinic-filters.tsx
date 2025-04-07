'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClinicStore, type TimeFrame } from '@/lib/stores/clinic-store';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicFiltersProps {
  compact?: boolean;
}

// Component that uses searchParams
function ClinicFiltersContent({ compact = false }: ClinicFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get the current timeframe from URL or default to 'month'
  const currentTimeframe = (searchParams.get('timeframe') as TimeFrame) || 'month';
  
  // Use Zustand store instead of URL params for better performance
  const { timeframe, setTimeframe } = useClinicStore();
  
  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    // Update the store (fast local update)
    setTimeframe(value as TimeFrame);
    
    // Update URL (for sharing/bookmarking) without full page refresh
    const params = new URLSearchParams(searchParams);
    params.set('timeframe', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  return (
    <Tabs value={timeframe} onValueChange={handleTimeframeChange} className={compact ? 'w-auto' : 'w-full'}>
      <TabsList className={compact ? 'grid grid-cols-4 h-8' : 'grid grid-cols-4'}>
        <TabsTrigger value="day" className={compact ? 'text-xs py-1' : ''}>Day</TabsTrigger>
        <TabsTrigger value="week" className={compact ? 'text-xs py-1' : ''}>Week</TabsTrigger>
        <TabsTrigger value="month" className={compact ? 'text-xs py-1' : ''}>Month</TabsTrigger>
        <TabsTrigger value="year" className={compact ? 'text-xs py-1' : ''}>Year</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// Wrap in Suspense boundary for Next.js 15 optimization
export function ClinicFilters(props: ClinicFiltersProps) {
  return (
    <Suspense fallback={
      <div className="w-full">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    }>
      <ClinicFiltersContent {...props} />
    </Suspense>
  );
}
