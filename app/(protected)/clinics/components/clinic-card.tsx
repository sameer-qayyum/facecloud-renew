'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClinicFilters } from './clinic-filters';
import { MetricsDisplay } from '@/app/(protected)/clinics/components/metrics-display';
import { useClinicMetrics } from '@/lib/hooks/use-clinic-metrics';

// Define the interfaces here to match our new schema
interface Location {
  id: string;
  name: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface Clinic {
  id: string;
  name: string;
  company_id: string;
  created_by: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  location: Location | null;
}

interface ClinicCardProps {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  // Get metrics from our Zustand-based hook
  const { metrics, isLoading, error } = useClinicMetrics(clinic.id);
  
  // Use the location data from metrics or fall back to the clinic's location
  const locationData = metrics?.clinic?.location || clinic.location;
  
  // Format the address correctly based on available fields
  const formatAddress = (loc: Location | null) => {
    if (!loc?.address) return 'No address configured';
    
    let formattedAddress = loc.address;
    if (loc.suburb) formattedAddress += `, ${loc.suburb}`;
    if (loc.state) formattedAddress += ` ${loc.state}`;
    if (loc.postcode) formattedAddress += ` ${loc.postcode}`;
    if (loc.country) formattedAddress += `, ${loc.country}`;
    
    return formattedAddress;
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-xl">{metrics?.clinic?.name || clinic.name}</CardTitle>
        <CardDescription>
          {formatAddress(locationData)}
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
      </CardContent>
      
      <CardFooter className="bg-muted/10 border-t p-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clinics/${clinic.id}/details`}>
              View Details
            </Link>
          </Button>
          
          <Button size="sm" asChild>
            <Link href={`/clinics/${clinic.id}/dashboard`}>
              Open Dashboard
            </Link>
          </Button>
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
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-32" />
      </div>
    </>
  );
}
