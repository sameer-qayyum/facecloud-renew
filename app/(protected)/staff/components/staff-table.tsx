'use client';

import React, { useState, useMemo, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronsUpDown, Edit, Trash2, Phone, Mail, 
  MoreHorizontal, X, ChevronRight, MapPin, Building, Check
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { softDeleteStaff } from '../actions';

// Staff member interface
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
  location_names: string[]; // Array of locations this staff is assigned to
  assignment_count: number; // Total number of assignments
}

interface StaffTableProps {
  staff: StaffMember[];
}

export function StaffTable({ staff }: StaffTableProps) {
  const router = useRouter();
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  
  // Memoize data to reduce re-renders
  const memoizedStaff = useMemo(() => staff, [staff]);
  
  // Handle staff deletion
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    
    setIsDeleting(true);
    try {
      await softDeleteStaff(staffToDelete);
      router.refresh();
    } catch (error) {
      console.error("Error deleting staff member:", error);
    } finally {
      setIsDeleting(false);
      setStaffToDelete(null);
    }
  };

  // Format role to be more readable
  const formatRole = useCallback((role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }, []);
  
  // Format location names for display
  const formatLocationsList = useCallback((locationNames: string[]) => {
    if (!locationNames || locationNames.length === 0) return "No locations";
    if (locationNames.length === 1) return locationNames[0];
    return `${locationNames[0]} +${locationNames.length - 1} more`;
  }, []);
  
  // Get initials from name
  const getInitials = useCallback((firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, []);
  
  // Get role color for badge
  const getRoleColor = useCallback((role: string) => {
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
  }, []);
  
  // Get a fallback image URL based on role
  const getFallbackImageUrl = useCallback((role: string) => {
    // Static images instead of dynamic Unsplash requests for better performance
    switch (role) {
      case 'doctor':
        return '/images/avatars/doctor.jpg';
      case 'nurse':
        return '/images/avatars/nurse.jpg';
      case 'therapist':
        return '/images/avatars/therapist.jpg';
      case 'manager':
        return '/images/avatars/manager.jpg';
      case 'admin':
        return '/images/avatars/admin.jpg';
      case 'owner':
        return '/images/avatars/owner.jpg';
      default:
        return '/images/avatars/default.jpg';
    }
  }, []);

  // Toggle selection for a row
  const toggleRowSelection = useCallback((id: string) => {
    startTransition(() => {
      setSelectedRows(prev => 
        prev.includes(id) 
          ? prev.filter(rowId => rowId !== id) 
          : [...prev, id]
      );
    });
  }, []);
  
  // Toggle expanded state for a row
  const toggleRowExpand = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    startTransition(() => {
      setExpandedRows(prev => 
        prev.includes(id) 
          ? prev.filter(rowId => rowId !== id) 
          : [...prev, id]
      );
    });
  }, []);

  const openStaffDetails = useCallback((staff: StaffMember) => {
    setSelectedStaff(staff);
  }, []);
  
  const toggleAllRows = useCallback(() => {
    if (selectedRows.length === memoizedStaff.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(memoizedStaff.map(s => s.id));
    }
  }, [memoizedStaff, selectedRows]);

  // Render mobile UI
  const mobileUI = useMemo(() => (
    <div className="md:hidden">
      <div className="relative flex items-center mb-3">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by client name, client ID or phone number"
            className="w-full h-10 pl-9 pr-4 py-2 bg-background border rounded-md text-sm"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 19L13 13M15 8C15 12.4183 11.4183 16 7 16C2.58172 16 -1 12.4183 -1 8C-1 3.58172 2.58172 0 7 0C11.4183 0 15 3.58172 15 8Z" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <Button variant="default" size="icon" className="ml-2 h-10 w-10 bg-primary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 12H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 17H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Button>
      </div>
    
      <div className="space-y-1 bg-background border rounded-md overflow-hidden">
        {memoizedStaff.map(staffMember => (
          <div key={staffMember.id} className="border-b last:border-b-0">
            {/* Header row - always visible */}
            <div 
              className="flex items-center px-4 py-3 justify-between cursor-pointer"
              onClick={(e) => toggleRowExpand(staffMember.id, e)}
            >
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedRows.includes(staffMember.id)}
                  onCheckedChange={() => toggleRowSelection(staffMember.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${staffMember.first_name}`}
                />
                <span className="font-medium text-primary">
                  {staffMember.first_name} {staffMember.last_name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                >
                  Active
                </Badge>
                
                {expandedRows.includes(staffMember.id) ? (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transform rotate-90 transition-transform" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transform transition-transform" />
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/staff/edit-staff?id=${staffMember.id}`);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Staff
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStaffToDelete(staffMember.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove Staff
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Expanded content */}
            {expandedRows.includes(staffMember.id) && (
              <div className="px-4 pb-4 space-y-4 border-t border-muted/40 bg-muted/5">
                {/* Phone */}
                <div className="pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Phone number</div>
                  <div className="text-sm font-medium">{staffMember.phone || "-"}</div>
                </div>
                
                {/* Email */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                  <a href={`mailto:${staffMember.email}`} className="text-sm font-medium text-primary">{staffMember.email}</a>
                </div>
                
                {/* Tags */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Tags</div>
                  <div className="text-sm">-</div>
                </div>
                
                {/* Status */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <Badge 
                    variant="secondary" 
                    className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                  >
                    Active
                  </Badge>
                </div>
                
                {/* Assigned Team */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Assigned Clinic</div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getFallbackImageUrl(staffMember.role)} />
                      <AvatarFallback>{staffMember.clinic_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{staffMember.clinic_name}</span>
                  </div>
                </div>
                
                {/* Locations */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Locations</div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      {staffMember.location_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span>{formatLocationsList(staffMember.location_names)}</span>
                          {staffMember.assignment_count > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {staffMember.assignment_count}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No locations</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  ), [memoizedStaff, selectedRows, expandedRows, toggleRowExpand, toggleRowSelection, getFallbackImageUrl]);

  // Render desktop UI
  const desktopUI = useMemo(() => (
    <div className="hidden md:block border rounded-lg bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedRows.length === memoizedStaff.length && memoizedStaff.length > 0}
                onCheckedChange={toggleAllRows}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Clinic</TableHead>
            <TableHead>Locations</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memoizedStaff.map(staffMember => (
            <TableRow key={staffMember.id}>
              <TableCell>
                <Checkbox 
                  checked={selectedRows.includes(staffMember.id)}
                  onCheckedChange={() => toggleRowSelection(staffMember.id)}
                  aria-label={`Select ${staffMember.first_name}`}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium text-primary">
                  {staffMember.first_name} {staffMember.last_name}
                </div>
              </TableCell>
              <TableCell>{staffMember.phone || "-"}</TableCell>
              <TableCell>{staffMember.email}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`border-2 ${getRoleColor(staffMember.role).replace('bg-', 'border-').replace('hover:bg-', 'text-')} bg-transparent`}
                >
                  {formatRole(staffMember.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100">
                  Active
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  {staffMember.clinic_name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {staffMember.assignment_count > 0 ? (
                    <div className="flex items-center">
                      <span>{formatLocationsList(staffMember.location_names)}</span>
                      {staffMember.assignment_count > 1 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {staffMember.assignment_count}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No locations</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => router.push(`/staff/edit-staff?id=${staffMember.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Staff
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive cursor-pointer"
                      onClick={() => setStaffToDelete(staffMember.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove Staff
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ), [memoizedStaff, selectedRows, toggleRowSelection, toggleAllRows, getRoleColor, formatRole]);

  return (
    <div className="space-y-4">
      {desktopUI}
      {mobileUI}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Remove Staff Member</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to remove this staff member? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStaff} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-lg text-white"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Mobile staff details drawer */}
      <Sheet open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage 
                  src={selectedStaff?.profile_picture || (selectedStaff ? getFallbackImageUrl(selectedStaff.role) : '')} 
                  alt={selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.last_name}` : ''} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {selectedStaff ? getInitials(selectedStaff.first_name, selectedStaff.last_name) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl text-left">
                  {selectedStaff?.first_name} {selectedStaff?.last_name}
                </SheetTitle>
                <Badge className={`${selectedStaff ? getRoleColor(selectedStaff.role) : ''} mt-2 shadow-sm`}>
                  {selectedStaff ? formatRole(selectedStaff.role) : ''}
                </Badge>
              </div>
            </div>
          </SheetHeader>
          
          {selectedStaff && (
            <div className="py-6 space-y-6">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium break-all">{selectedStaff.email}</p>
                  </div>
                </div>
                
                {selectedStaff.phone && (
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm font-medium">{selectedStaff.phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Assigned Clinic</p>
                    <p className="text-sm font-medium">{selectedStaff.clinic_name}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mt-4">
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Role: </span>
                  <span>{formatRole(selectedStaff.role)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Clinic: </span>
                  <span>{selectedStaff.clinic_name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Locations: </span>
                  <span>
                    {selectedStaff.location_names.length > 0 ? (
                      selectedStaff.location_names.join(', ')
                    ) : (
                      <span className="text-muted-foreground">No locations assigned</span>
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Status: </span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/staff/edit-staff?id=${selectedStaff.id}`)}
                  className="rounded-lg h-11"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit Staff
                </Button>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setStaffToDelete(selectedStaff.id);
                      setSelectedStaff(null);
                    }}
                    className="rounded-lg h-11"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Staff
                  </Button>
                </AlertDialogTrigger>
              </div>
            </div>
          )}
          
          <SheetFooter className="mt-6 flex justify-end border-t pt-4">
            <SheetClose asChild>
              <Button variant="secondary" className="rounded-lg">
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
