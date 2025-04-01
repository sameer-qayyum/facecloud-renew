'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClinicStore, type TimeFrame } from '@/lib/stores/clinic-store';

interface ClinicFiltersProps {
  compact?: boolean;
}

export function ClinicFilters({ compact = false }: ClinicFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get the current timeframe from URL or default to 'month'
  const currentTimeframe = (searchParams.get('timeframe') as TimeFrame) || 'month';
  
  // Use Zustand store instead of URL params for better performance
  const { timeframe, setTimeframe } = useClinicStore();
  
  const handleTimeframeChange = (value: TimeFrame) => {
    setTimeframe(value);
  };

  return (
    <div className={compact ? "" : "mb-6"}>
      <Tabs 
        value={timeframe} 
        onValueChange={(v) => handleTimeframeChange(v as TimeFrame)}
        className={compact ? "w-full" : "w-full sm:w-auto"}
      >
        <TabsList className={compact ? "grid grid-cols-4 w-full" : "grid grid-cols-4 sm:grid-cols-4"}>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
