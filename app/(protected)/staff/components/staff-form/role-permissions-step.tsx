'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Shield,
  Users,
  Stethoscope,
  HeartPulse,
  Wand2,
  ClipboardList
} from 'lucide-react';
import { StaffRole } from '../new-staff-form';

interface RoleDescriptions {
  [key: string]: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
}

const roleDescriptions: RoleDescriptions = {
  'owner': {
    title: 'Owner',
    description: 'Full access to all features and settings including billing and staff management.',
    icon: <Shield className="h-4 w-4" />
  },
  'manager': {
    title: 'Manager',
    description: 'Can manage bookings, patients, and staff. Cannot access billing or company settings.',
    icon: <Users className="h-4 w-4" />
  },
  'doctor': {
    title: 'Doctor',
    description: 'Can access patient records, create treatment plans, and manage their own schedule.',
    icon: <Stethoscope className="h-4 w-4" />
  },
  'nurse': {
    title: 'Nurse',
    description: 'Can view patient records, assist with treatments, and manage their own schedule.',
    icon: <HeartPulse className="h-4 w-4" />
  },
  'therapist': {
    title: 'Therapist',
    description: 'Can perform treatments, view assigned patient records, and manage their schedule.',
    icon: <Wand2 className="h-4 w-4" />
  },
  'admin': {
    title: 'Admin',
    description: 'Front desk staff who can manage appointments and basic patient information.',
    icon: <ClipboardList className="h-4 w-4" />
  }
};

interface RolePermissionsFormData {
  role: StaffRole;
}

interface RolePermissionsStepProps {
  formData: RolePermissionsFormData;
  updateFormData: (data: Partial<RolePermissionsFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function RolePermissionsStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  isLoading
}: RolePermissionsStepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form validation
  const validateForm = (): boolean => {
    setIsValidating(true);
    const newErrors: Record<string, string> = {};
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
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
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Role & Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Define what this staff member can do in your clinic
        </p>
      </div>
      
      <FormFieldWrapper error={isValidating ? errors.role : undefined}>
        <Label className="text-sm font-medium mb-2 block">
          Staff Role <span className="text-destructive">*</span>
        </Label>
        
        <RadioGroup
          value={formData.role}
          onValueChange={(value) => updateFormData({ role: value as StaffRole })}
          className="space-y-3"
          disabled={isLoading}
        >
          {Object.entries(roleDescriptions).map(([role, { title, description, icon }]) => (
            <div
              key={role}
              className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors ${
                formData.role === role
                  ? 'bg-primary/5 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => updateFormData({ role: role as StaffRole })}
            >
              <RadioGroupItem value={role} id={`role-${role}`} className="mt-1" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{icon}</span>
                  <Label
                    htmlFor={`role-${role}`}
                    className="font-medium cursor-pointer"
                  >
                    {title}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </FormFieldWrapper>
      
      {/* Navigation Buttons */}
      <div className="pt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        
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
