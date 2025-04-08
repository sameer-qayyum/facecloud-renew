import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RoomsPageContent from './components/rooms-page-content';
import RoomsSkeleton from './components/rooms-skeleton';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function RoomsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Treatment Rooms</h1>
        <Button asChild>
          <Link href="/rooms/add-room">Add Room</Link>
        </Button>
      </div>
      
      <Suspense fallback={<RoomsSkeleton />}>
        <RoomsPageContent />
      </Suspense>
    </div>
  );
}