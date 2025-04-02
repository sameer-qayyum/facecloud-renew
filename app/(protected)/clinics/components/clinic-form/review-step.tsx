'use client';

import { useEffect, useState } from 'react';
import { 
  Clinic,
  Location 
} from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Check, X, ImageIcon } from 'lucide-react';
import { OperatingHours } from './operating-hours-step';

interface ContactInfo {
  email: string;
  phone: string;
}

interface ReviewStepProps {
  data: {
    clinic: {
      name: string;
      logo?: File;
    };
    location: Partial<Location>;
    contact: ContactInfo;
    operatingHours: OperatingHours;
  };
}

export function ReviewStep({ data }: ReviewStepProps) {
  const { clinic, location, contact, operatingHours } = data;
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Generate logo preview if a logo file exists
  useEffect(() => {
    if (clinic.logo && clinic.logo.size > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(clinic.logo);
    } else {
      setLogoPreview(null);
    }
  }, [clinic.logo]);

  const formatAddress = () => {
    const { address, suburb, state, postcode } = location;
    const parts = [address, suburb, state, postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  // Format time for display (24h to 12h)
  const formatTime = (time?: string) => {
    if (!time) return 'Not set';
    
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    
    if (hourNum < 12) {
      return `${hourNum === 0 ? '12' : hourNum}:${minute} AM`;
    } else {
      return `${hourNum === 12 ? '12' : hourNum - 12}:${minute} PM`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Review Clinic Details</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Please review all the information before creating the clinic.
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Basic Info */}
        <Card className="overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b">
            <h4 className="text-sm font-medium">Basic Information</h4>
          </div>
          <CardContent className="p-3 text-sm">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Clinic Name:</span>
                <span className="col-span-2 font-medium">{clinic.name || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Clinic Logo:</span>
                <div className="col-span-2">
                  {logoPreview ? (
                    <div className="w-32 h-32 border rounded-md overflow-hidden">
                      <img 
                        src={logoPreview} 
                        alt="Clinic logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground">
                      <ImageIcon className="h-4 w-4 mr-1.5" />
                      <span className="text-sm">No logo uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Location Info */}
        <Card className="overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b">
            <h4 className="text-sm font-medium">Location Information</h4>
          </div>
          <CardContent className="p-3 text-sm">
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Address:</span>
                <span className="col-span-2 font-medium">{location.address || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Suburb:</span>
                <span className="col-span-2 font-medium">{location.suburb || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">State:</span>
                <span className="col-span-2 font-medium">{location.state || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Postcode:</span>
                <span className="col-span-2 font-medium">{location.postcode || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Country:</span>
                <span className="col-span-2 font-medium">{location.country || 'Australia'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b">
            <h4 className="text-sm font-medium">Contact Information</h4>
          </div>
          <CardContent className="p-3 text-sm">
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Phone:</span>
                <span className="col-span-2 font-medium">{contact.phone || 'Not specified'}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground">Email:</span>
                <span className="col-span-2 font-medium">{contact.email || 'Not specified'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Operating Hours */}
        <Card className="overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b">
            <h4 className="text-sm font-medium">Operating Hours</h4>
          </div>
          <CardContent className="p-3 text-sm">
            <div className="space-y-1">
              {Object.entries(operatingHours).map(([day, schedule]) => (
                <div key={day} className="grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground capitalize">{day}:</span>
                  <span className="col-span-2 font-medium">
                    {schedule.isOpen ? (
                      <span>
                        {formatTime(schedule.openTime)} - {formatTime(schedule.closeTime)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Closed</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Required fields warning */}
        {(!clinic.name || 
          !location.suburb || 
          !location.address || 
          !location.state || 
          !location.postcode || 
          !contact.email || 
          !contact.phone ||
          !Object.values(operatingHours).some(day => day.isOpen)) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-700">
                  All required fields must be completed before creating the clinic.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
