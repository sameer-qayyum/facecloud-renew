'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClinicFilters } from './clinic-filters';
import { MetricsDisplay } from '@/app/(protected)/clinics/components/metrics-display';
import { useClinicMetrics } from '@/lib/hooks/use-clinic-metrics';
import { softDeleteClinic, updateClinicStatus } from '../actions';

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
  logo_url?: string | null;
}

interface ClinicCardProps {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoError, setLogoError] = useState(false);
  // Get metrics from our Zustand-based hook
  const { metrics, isLoading, error } = useClinicMetrics(clinic.id);
  
  // Use the location data from metrics or fall back to the clinic's location
  const locationData = metrics?.clinic?.location || clinic.location;
  
  // Handle clinic deletion with optimistic UI update
  const handleDeleteClinic = async () => {
    try {
      setIsDeleting(true);
      await softDeleteClinic(clinic.id);
      // Force refresh to show updated list
      router.refresh();
    } catch (error) {
      console.error("Error deleting clinic:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle completing draft clinic setup
  const handleActivateClinic = async () => {
    try {
      await updateClinicStatus(clinic.id, true);
      router.refresh();
    } catch (error) {
      console.error("Error activating clinic:", error);
    }
  };
  
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
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
              {!logoError && clinic.logo_url ? (
                <img 
                  src={clinic.logo_url} 
                  alt={`${clinic.name} logo`} 
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <span className="font-semibold text-primary">
                    {clinic.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <CardTitle className="text-xl">{metrics?.clinic?.name || clinic.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={clinic.active ? "default" : "destructive"} className={clinic.active ? "bg-green-500 hover:bg-green-600" : ""}>
              {clinic.active ? 'Active' : 'Draft'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/clinics/add-clinic?id=${clinic.id}`} className="flex items-center gap-2 w-full cursor-pointer">
                    <Edit className="h-4 w-4" /> Edit Clinic
                  </Link>
                </DropdownMenuItem>
                {!clinic.active && (
                  <DropdownMenuItem asChild>
                    <Button variant="default" size="sm" className="w-full text-left" onClick={handleActivateClinic}>
                      <Check className="h-4 w-4" /> Complete Setup
                    </Button>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem asChild>
                      <Button variant="destructive" size="sm" className="w-full text-left" disabled={isDeleting}>
                        <Trash2 className="h-4 w-4" /> Delete Clinic
                      </Button>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Clinic</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      Are you sure you want to delete this clinic?
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteClinic}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
          
          {clinic.active ? (
            <Button size="sm" asChild>
              <Link href={`/clinics/${clinic.id}/dashboard`}>
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" asChild>
              <Link href={`/clinics/${clinic.id}/setup`}>
                Complete Setup
              </Link>
            </Button>
          )}
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
