'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClinicFilters } from './clinic-filters';
import { MetricsDisplay } from '@/app/(protected)/clinics/components/metrics-display';
import { useClinicMetrics } from '@/lib/hooks/use-clinic-metrics';
import { ClinicLocation } from '@/lib/stores/clinic-store';

interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

interface Clinic {
  id: string;
  name: string;
  created_at: string;
  location: Location | null;
}

interface ClinicCardProps {
  clinic: Clinic;
}

// REMOVE_PLACEHOLDER_DATA: Delete this entire temporary locations map once RLS is fixed
// This was only a temporary solution during development
const TEMP_LOCATIONS: Record<string, Location> = {
  'a0c025ff-c3f7-4ba0-8e22-c94b3040a19b': {
    id: '3e2f8f28-1b82-4382-9c08-880b79b3be06',
    name: 'Double Bay',
    address: '242 Silverwater, Double Bay, 2000',
    phone: '02111111',
    email: 'info@doublebay.com'
  }
  // Add more clinics here if needed
};

export function ClinicCard({ clinic }: ClinicCardProps) {
  // Get metrics from our Zustand-based hook
  const { metrics, isLoading, error } = useClinicMetrics(clinic.id);
  
  // REMOVE_PLACEHOLDER_DATA: Delete these debugging logs once everything is working properly
  useEffect(() => {
    if (metrics) {
      console.log(`Clinic ${clinic.id} - Metrics data:`, metrics);
      console.log(`Clinic ${clinic.id} - Location from metrics:`, metrics.clinic?.location);
      console.log(`Clinic ${clinic.id} - Passed location:`, clinic.location);
    }
  }, [metrics, clinic.id, clinic.location]);
  
  // REMOVE_PLACEHOLDER_DATA: Simplify this to just "metrics?.clinic?.location || clinic.location"
  // once RLS policy is fixed and deployed to production
  const locationData = metrics?.clinic?.location || TEMP_LOCATIONS[clinic.id] || clinic.location;
  
  // REMOVE_PLACEHOLDER_DATA: Delete this debugging log once everything is confirmed working
  useEffect(() => {
    console.log(`Clinic ${clinic.id} - Final location data used:`, locationData);
  }, [clinic.id, locationData]);
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-xl">{metrics?.clinic?.name || clinic.name}</CardTitle>
        <CardDescription>
          {locationData?.address || 'No address configured'}
        </CardDescription>
        {locationData?.name && (
          <div className="text-xs text-muted-foreground">{locationData.name}</div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <ClinicFilters compact />
        
        <div className="grid grid-cols-2 gap-4">
          {isLoading || !metrics ? (
            <MetricsSkeleton />
          ) : (
            <>
              {/* ADD_REAL_DATA: Replace with actual revenue data from your appointments/transactions database
                  Current implementation uses random mock data. To implement real data:
                  1. Create a new API endpoint that aggregates actual transaction/appointment data
                  2. Ensure the query is optimized with proper indexes for ultra-fast response
                  3. Add caching mechanisms to prevent recalculating frequently */}
              <MetricsDisplay
                title="Revenue"
                value={metrics.revenue}
                change={metrics.revenueChange}
                prefix="$"
              />
              
              {/* ADD_REAL_DATA: Replace with actual appointment count from your appointments table
                  Current implementation uses random mock data. To implement real data:
                  1. Create a query that counts appointments/bookings filtered by clinic and date range
                  2. Use time-based partitioning if appointment volume is high for better performance
                  3. Consider pre-aggregating counts for common time periods (day/week/month/year) */}
              <MetricsDisplay
                title="Bookings"
                value={metrics.bookingCount}
                change={metrics.bookingCountChange}
              />
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/10 border-t p-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          
          <Link href={`/clinics/${clinic.id}/dashboard`} passHref>
            <Button size="sm">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </>
  );
}
