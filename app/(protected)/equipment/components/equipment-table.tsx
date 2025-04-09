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
import { toggleEquipmentAvailability } from '../actions';

interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

interface Equipment {
  id: string;
  name: string;
  quantity: number;
  active: boolean;
  created_at: string;
  clinic: Clinic;
}

interface EquipmentTableProps {
  equipment: Equipment[];
}

export function EquipmentTable({ equipment: initialEquipment }: EquipmentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicFilter = searchParams.get('clinic_id');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isToggling, setIsToggling] = useState<string | null>(null);
  
  // Filter equipment based on clinic and search query
  const filteredEquipment = initialEquipment
    .filter(item => !clinicFilter || clinicFilter === 'all' || item.clinic.id === clinicFilter)
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.clinic.location_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const handleEditEquipment = (equipmentId: string) => {
    router.push(`/equipment/edit-equipment/${equipmentId}`);
  };
  
  const handleToggleAvailability = async (equipmentId: string) => {
    setIsToggling(equipmentId);
    try {
      await toggleEquipmentAvailability(equipmentId);
    } catch (error) {
      console.error('Error toggling equipment availability:', error);
    } finally {
      setIsToggling(null);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>
              Manage the equipment in your clinic
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search" 
              placeholder="Search equipment..."
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
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No equipment found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((item) => (
                <TableRow key={item.id} className="border-b">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.clinic.name}</TableCell>
                  <TableCell>{item.clinic.location_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "default" : "destructive"} className={item.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {item.active ? "Available" : "Unavailable"}
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
                        <DropdownMenuItem onClick={() => handleEditEquipment(item.id)}>
                          <FileEdit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleAvailability(item.id)}
                          disabled={isToggling === item.id}
                        >
                          {item.active ? (
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
