'use client';

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClinicsSkeleton() {
  // Create an array to display 3 skeleton cards
  const skeletons = Array.from({ length: 3 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="mb-6">
        <Tabs defaultValue="month" className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 sm:grid-cols-4 opacity-70">
            <TabsTrigger value="day" disabled>Day</TabsTrigger>
            <TabsTrigger value="week" disabled>Week</TabsTrigger>
            <TabsTrigger value="month" disabled>Month</TabsTrigger>
            <TabsTrigger value="year" disabled>Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-start">
                <Skeleton className="h-8 w-40" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-muted/20 flex justify-between">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
