'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { StaffFormData, StaffRole } from '../new-staff-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Building2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';

interface ReviewStepProps {
  formData: StaffFormData;
  clinics: { id: string; name: string }[];
  onSubmit: (draft?: boolean) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  isEditMode: boolean;
}

// Role icon mapping
const getRoleIcon = (role: StaffRole) => {
  switch (role) {
    case 'owner':
      return <Shield className="h-4 w-4" />;
    case 'manager':
      return <User className="h-4 w-4" />;
    case 'doctor':
      return <Icons.stethoscope className="h-4 w-4" />;
    case 'nurse':
      return <Icons.heart className="h-4 w-4" />;
    case 'therapist':
      return <Icons.sparkles className="h-4 w-4" />;
    case 'admin':
      return <Icons.clipboard className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

// Format role for display
const formatRole = (role: string): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Get role-specific badge color
const getRoleBadgeClass = (role: StaffRole): string => {
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

// Get initials for avatar fallback
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const dayNames = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday'
};

export function ReviewStep({
  formData,
  clinics,
  onSubmit,
  onBack,
  isLoading,
  isEditMode
}: ReviewStepProps) {
  // Find clinic name from clinic ID
  const getClinicName = (clinicId: string | null): string => {
    if (!clinicId) return 'All Clinics (Unrestricted)';
    const clinic = clinics.find(c => c.id === clinicId);
    return clinic ? clinic.name : 'Unknown Clinic';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Review Information</h2>
        <p className="text-sm text-muted-foreground">
          Please review the staff member information before saving
        </p>
      </div>
      
      {/* Profile Preview */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/10">
        <Avatar className="h-16 w-16">
          {formData.basicInfo.profilePictureUrl ? (
            <AvatarImage src={formData.basicInfo.profilePictureUrl} alt="Profile picture" />
          ) : (
            <AvatarFallback className="bg-primary/10">
              {getInitials(formData.basicInfo.firstName, formData.basicInfo.lastName)}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div>
          <h3 className="text-lg font-medium">{formData.basicInfo.firstName} {formData.basicInfo.lastName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getRoleBadgeClass(formData.rolePermissions.role)}>
              {formatRole(formData.rolePermissions.role)}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Information Sections */}
      <div className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm break-all">{formData.basicInfo.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm">{formData.basicInfo.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Role and Clinic */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Assignment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Assigned Clinic</p>
                <p className="text-sm">{getClinicName(formData.clinicAssignment.clinicId)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm">{formatRole(formData.rolePermissions.role)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Staff Availability */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Staff Availability</h3>
            </div>
            
            {Object.entries(formData.availability).map(([day, dayData]) => {
              const dayKey = day as keyof typeof dayNames;
              const isAvailable = dayData.isAvailable;
              
              return (
                <div key={day} className="py-2 border-b last:border-b-0">
                  <div className="flex items-center">
                    <span className="font-medium w-32">{dayNames[dayKey]}</span>
                    {isAvailable ? (
                      <div className="flex-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Available
                        </Badge>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {dayData.slots?.map((slot, index) => (
                            <Badge 
                              key={index}
                              variant="secondary" 
                              className="text-xs"
                            >
                              {slot.startTime} - {slot.endTime}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        Not Available
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          
          {!isEditMode && (
            <Button
              variant="secondary"
              onClick={() => onSubmit(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save as Draft
            </Button>
          )}
        </div>
        
        <Button
          onClick={() => onSubmit(false)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditMode ? 'Update Staff Member' : 'Add Staff Member'}
        </Button>
      </div>
    </div>
  );
}
