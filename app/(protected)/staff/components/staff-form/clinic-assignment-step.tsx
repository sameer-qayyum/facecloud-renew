'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Building2, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClinicAssignmentFormData {
  clinicId: string | null;
}

interface ClinicAssignmentStepProps {
  formData: ClinicAssignmentFormData;
  updateFormData: (data: Partial<ClinicAssignmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  clinics: { id: string; name: string; location_name?: string | null }[];
}

export function ClinicAssignmentStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  isLoading,
  clinics
}: ClinicAssignmentStepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form validation
  const validateForm = (): boolean => {
    setIsValidating(true);
    const newErrors: Record<string, string> = {};
    
    // No validation required for clinic assignment
    // It's valid to have no clinic assigned
    
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
        <h2 className="text-lg font-semibold mb-2">Clinic Assignment</h2>
        <p className="text-sm text-muted-foreground">
          Assign this staff member to a specific clinic
        </p>
      </div>
      
      {clinics.length === 0 ? (
        <Card className="border-dashed border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center text-yellow-700 dark:text-yellow-400">
              <Info className="h-4 w-4 mr-2" />
              No Clinics Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-yellow-700 dark:text-yellow-400">
              You don't have any active clinics yet. Please create a clinic first before assigning staff.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/clinics/add-clinic'}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-950/50"
            >
              <Building2 className="h-4 w-4 mr-2" /> 
              Add Your First Clinic
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <FormFieldWrapper error={isValidating ? errors.clinicId : undefined}>
          <Label htmlFor="clinicId" className="text-sm font-medium">
            Assigned Clinic
          </Label>
          <Select
            value={formData.clinicId || ""}
            onValueChange={(value) => updateFormData({ clinicId: value === "none" ? null : value })}
            disabled={isLoading}
          >
            <SelectTrigger id="clinicId" className="w-full">
              <SelectValue placeholder="Select a clinic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Specific Clinic (Access All)</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}{clinic.location_name ? ` - ${clinic.location_name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Leaving this unassigned will allow access to all clinics (based on role permissions)
          </p>
        </FormFieldWrapper>
      )}
      
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
