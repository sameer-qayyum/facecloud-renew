'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClinicFilters } from './clinic-filters';
import { MetricsDisplay } from '@/app/(protected)/clinics/components/metrics-display';
import { useClinicMetrics } from '@/lib/hooks/use-clinic-metrics';

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
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

export function ClinicCard({ clinic }: ClinicCardProps) {
  // Get metrics from our Zustand-based hook
  const { metrics, isLoading, error } = useClinicMetrics(clinic.id);
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-xl">{clinic.name}</CardTitle>
        <CardDescription>
          {clinic.location?.address || 'No address configured'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <ClinicFilters compact />
        
        <div className="grid grid-cols-2 gap-4">
          {isLoading || !metrics ? (
            <MetricsSkeleton />
          ) : (
            <>
              <MetricsDisplay
                title="Revenue"
                value={metrics.revenue}
                change={metrics.revenueChange}
                prefix="$"
              />
              
              <MetricsDisplay
                title="Bookings"
                value={metrics.bookingCount}
                change={metrics.bookingCountChange}
              />
            </>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-2">Error: {error}</p>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-muted/20 flex justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clinics/${clinic.id}`}>
            View Details
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clinics/${clinic.id}/appointments`}>
            Appointments
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </>
  );
}
