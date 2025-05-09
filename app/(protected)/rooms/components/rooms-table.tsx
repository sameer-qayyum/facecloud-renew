'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, FileEdit, Trash2, XCircle, CheckCircle } from 'lucide-react';
import { toggleRoomAvailability } from '../actions';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
}

interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

interface Room {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  room_type: RoomType;
  clinic: Clinic;
}

interface RoomsTableProps {
  rooms: Room[];
}

export function RoomsTable({ rooms: initialRooms }: RoomsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicFilter = searchParams.get('clinic_id');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isToggling, setIsToggling] = useState<string | null>(null);
  
  // Filter rooms based on clinic and search query
  const filteredRooms = initialRooms
    .filter(room => !clinicFilter || clinicFilter === 'all' || room.clinic.id === clinicFilter)
    .filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.room_type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.clinic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const handleEditRoom = (roomId: string) => {
    router.push(`/rooms/edit-room/${roomId}`);
  };
  
  const handleToggleAvailability = async (roomId: string) => {
    setIsToggling(roomId);
    try {
      await toggleRoomAvailability(roomId);
    } catch (error) {
      console.error('Error toggling room availability:', error);
    } finally {
      setIsToggling(null);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Treatment Rooms</CardTitle>
            <CardDescription>
              Manage the treatment rooms in your clinic
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search" 
              placeholder="Search rooms..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No rooms found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id} className="border-b">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{room.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {room.room_type.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{room.clinic.name}</TableCell>
                  <TableCell>{room.clinic.location_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={room.active ? "default" : "destructive"} className={room.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {room.active ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRoom(room.id)}>
                          <FileEdit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleAvailability(room.id)}
                          disabled={isToggling === room.id}
                        >
                          {room.active ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-amber-500" />
                              <span>Mark Unavailable</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              <span>Mark Available</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
