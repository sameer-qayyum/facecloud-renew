import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AddRoomForm from '../components/add-room-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Add Room | FaceCloud',
  description: 'Add a new treatment room to your clinic',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function AddRoomPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Treatment Room</h1>
        <p className="text-sm text-muted-foreground">Add a new treatment room to your clinic and configure its details</p>
      </div>
      
      <Card className="shadow-sm border-muted">
        <CardHeader className="bg-card/50 pb-6">
          <CardTitle className="text-lg text-primary">Room Details</CardTitle>
          <CardDescription>
            Complete the form below to add a new room to your clinic
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Suspense fallback={<FormSkeleton />}>
            <AddRoomForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Name field skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Clinic selector skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Room type selector skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Notes field skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      {/* Button skeleton */}
      <div className="pt-4">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
