'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { User, Upload, X } from 'lucide-react';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';

interface BasicInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: File;
  profilePictureUrl?: string;
}

interface BasicInfoStepProps {
  formData: BasicInfoFormData;
  updateFormData: (data: Partial<BasicInfoFormData>) => void;
  onNext: () => void;
  isLoading: boolean;
}

export function BasicInfoStep({
  formData,
  updateFormData,
  onNext,
  isLoading
}: BasicInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form validation
  const validateForm = (): boolean => {
    setIsValidating(true);
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Australian phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle continuing to the next step
  const handleContinue = () => {
    if (validateForm()) {
      onNext();
    }
  };
  
  // Handle file upload for profile picture
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Update form data with the selected file
      updateFormData({
        profilePicture: file,
        profilePictureUrl: URL.createObjectURL(file)
      });
    }
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Remove the selected profile picture
  const removeProfilePicture = () => {
    updateFormData({
      profilePicture: undefined,
      profilePictureUrl: undefined
    });
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Enter the basic details for this staff member
        </p>
      </div>
      
      {/* Profile Picture */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {formData.profilePictureUrl ? (
              <AvatarImage src={formData.profilePictureUrl} alt="Profile picture" />
            ) : (
              <AvatarFallback className="bg-primary/10">
                <User className="h-12 w-12 text-primary/40" />
              </AvatarFallback>
            )}
          </Avatar>
          
          {formData.profilePictureUrl && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              onClick={removeProfilePicture}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove profile picture</span>
            </Button>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileUpload}
          className="mt-2"
        >
          <Upload className="h-4 w-4 mr-2" />
          {formData.profilePictureUrl ? 'Change Picture' : 'Upload Picture'}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-1">
          Recommended: Square image, at least 300x300px
        </p>
      </div>
      
      {/* First Name */}
      <FormFieldWrapper error={isValidating ? errors.firstName : undefined}>
        <Label htmlFor="firstName" className="text-sm font-medium">
          First Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firstName"
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={(e) => updateFormData({ firstName: e.target.value })}
          className={errors.firstName ? 'border-destructive' : ''}
          disabled={isLoading}
        />
      </FormFieldWrapper>
      
      {/* Last Name */}
      <FormFieldWrapper error={isValidating ? errors.lastName : undefined}>
        <Label htmlFor="lastName" className="text-sm font-medium">
          Last Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lastName"
          placeholder="Enter last name"
          value={formData.lastName}
          onChange={(e) => updateFormData({ lastName: e.target.value })}
          className={errors.lastName ? 'border-destructive' : ''}
          disabled={isLoading}
        />
      </FormFieldWrapper>
      
      {/* Email */}
      <FormFieldWrapper error={isValidating ? errors.email : undefined}>
        <Label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          This email will be used for login access
        </p>
      </FormFieldWrapper>
      
      {/* Phone */}
      <FormFieldWrapper error={isValidating ? errors.phone : undefined}>
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone
        </Label>
        <Input
          id="phone"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
          className={errors.phone ? 'border-destructive' : ''}
          disabled={isLoading}
        />
      </FormFieldWrapper>
      
      {/* Continue Button */}
      <div className="pt-4 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </div>
  );
}
