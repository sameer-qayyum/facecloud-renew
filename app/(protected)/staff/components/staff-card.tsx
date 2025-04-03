'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
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
import { softDeleteStaff } from '../actions';

// Define the interfaces for staff
interface StaffMember {
  id: string;
  user_id: string;
  company_id: string;
  clinic_id: string | null;
  location_id: string | null;
  role: 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';
  active: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture: string | null;
  clinic_name: string;
}

interface StaffCardProps {
  staff: StaffMember;
}

export function StaffCard({ staff }: StaffCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle staff deletion with optimistic UI update
  const handleDeleteStaff = async () => {
    try {
      setIsDeleting(true);
      await softDeleteStaff(staff.id);
      // Force refresh to show updated list
      router.refresh();
    } catch (error) {
      console.error("Error deleting staff member:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format role for display with proper capitalization
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    const firstInitial = staff.first_name ? staff.first_name[0] : '';
    const lastInitial = staff.last_name ? staff.last_name[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };
  
  // Get a role-specific color for the role badge
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'manager':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'doctor':
        return 'bg-green-500 hover:bg-green-600';
      case 'nurse':
        return 'bg-teal-500 hover:bg-teal-600';
      case 'therapist':
        return 'bg-indigo-500 hover:bg-indigo-600';
      case 'admin':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return '';
    }
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-4 items-center w-full">
            <Avatar className="h-12 w-12">
              <AvatarImage src={staff.profile_picture || ''} alt={`${staff.first_name} ${staff.last_name}`} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{staff.first_name} {staff.last_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleColor(staff.role)}>
                  {formatRole(staff.role)}
                </Badge>
                {staff.clinic_id && (
                  <CardDescription className="truncate">
                    {staff.clinic_name}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
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
                <Link href={`/staff/edit-staff?id=${staff.id}`} className="flex items-center gap-2 w-full cursor-pointer">
                  <Edit className="h-4 w-4" /> Edit Staff
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem asChild>
                    <Button variant="destructive" size="sm" className="w-full text-left" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" /> Remove Staff
                    </Button>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogDescription>
                    Are you sure you want to remove {staff.first_name} {staff.last_name} from your staff? This action cannot be undone.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStaff}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {staff.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
              <p className="text-sm break-all">{staff.email}</p>
            </div>
          </div>
        )}
        
        {staff.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
              <p className="text-sm">{staff.phone}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Assigned Clinic</p>
            <p className="text-sm">{staff.clinic_name}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/10 border-t p-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/staff/${staff.id}/details`}>
              View Details
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/staff/edit-staff?id=${staff.id}`}>
              Edit Staff
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
