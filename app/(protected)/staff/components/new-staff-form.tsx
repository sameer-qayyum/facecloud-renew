'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';

// Import the form steps with the correct paths
import { 
  BasicInfoStep 
} from './staff-form/basic-info-step';
import { 
  ClinicAssignmentStep 
} from './staff-form/clinic-assignment-step';
import { 
  RolePermissionsStep 
} from './staff-form/role-permissions-step';
import { 
  ReviewStep 
} from './staff-form/review-step';
import { 
  createStaff, 
  updateStaff, 
  getStaffById,
  getCompanyClinics
} from '../actions';

// Define staff roles
export type StaffRole = 'owner' | 'manager' | 'doctor' | 'nurse' | 'therapist' | 'admin';

// Define the form data interface
export interface StaffFormData {
  basicInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePicture?: File;
    profilePictureUrl?: string;
  };
  clinicAssignment: {
    clinicId: string | null;
  };
  rolePermissions: {
    role: StaffRole;
  };
}

// Define the data used for form submission
export interface StaffSubmissionData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clinicId: string | null;
  role: StaffRole;
  profilePictureBase64?: string;
  active: boolean;
}

// Define the steps of the form
const STEPS = ['basic', 'clinic', 'role', 'review'];

interface NewStaffFormProps {
  staffId?: string | null;
}

// Loading spinner component for ultra-fast visual feedback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function NewStaffForm({ staffId }: NewStaffFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  // Track the current step
  const [currentStep, setCurrentStep] = useState<string>(STEPS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  
  // Track loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(!!staffId);
  
  // Track the available clinics
  const [availableClinics, setAvailableClinics] = useState<{id: string, name: string}[]>([]);
  
  // Track if we should skip the clinic assignment step
  const [skipClinicStep, setSkipClinicStep] = useState<boolean>(false);
  
  // Form data state
  const [formData, setFormData] = useState<StaffFormData>({
    basicInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    clinicAssignment: {
      clinicId: null,
    },
    rolePermissions: {
      role: 'nurse',
    }
  });
  
  // If in edit mode, fetch the staff data
  useEffect(() => {
    async function fetchStaffData() {
      if (!staffId) return;
      
      try {
        setIsLoadingInitial(true);
        
        const response = await getStaffById(staffId);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (response.data) {
          const staff = response.data;
          
          // Populate form data from staff record
          setFormData({
            basicInfo: {
              firstName: staff.first_name,
              lastName: staff.last_name,
              email: staff.email,
              phone: staff.phone || '',
              profilePictureUrl: staff.profile_picture || undefined
            },
            clinicAssignment: {
              clinicId: staff.clinic_id,
            },
            rolePermissions: {
              role: staff.role as StaffRole,
            }
          });
        }
      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load staff data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingInitial(false);
      }
    }
    
    // Fetch available clinics
    async function fetchClinics() {
      try {
        const response = await getCompanyClinics();
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (response.data) {
          const clinics = response.data;
          setAvailableClinics(clinics);
          
          // If there's only one clinic, auto-assign it and skip the clinic step
          if (clinics.length === 1 && !staffId) {
            setFormData(prev => ({
              ...prev,
              clinicAssignment: {
                ...prev.clinicAssignment,
                clinicId: clinics[0].id
              }
            }));
            setSkipClinicStep(true);
          }
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load clinics. You can still proceed, but clinic assignment will be limited.',
          variant: 'default'
        });
      }
    }
    
    fetchStaffData();
    fetchClinics();
  }, [staffId, toast]);
  
  // Update the current step index when the step changes
  useEffect(() => {
    const index = STEPS.indexOf(currentStep);
    setCurrentStepIndex(index >= 0 ? index : 0);
  }, [currentStep]);
  
  // Navigate to the next step
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      // If the next step is the clinic step and we should skip it, go to the role step
      if (skipClinicStep && STEPS[nextIndex] === 'clinic') {
        setCurrentStep(STEPS[nextIndex + 1]);
      } else {
        setCurrentStep(STEPS[nextIndex]);
      }
    }
  };
  
  // Navigate to the previous step
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      // If the previous step is the clinic step and we should skip it, go to the basic step
      if (skipClinicStep && STEPS[prevIndex] === 'clinic') {
        setCurrentStep(STEPS[prevIndex - 1]);
      } else {
        setCurrentStep(STEPS[prevIndex]);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (draft: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Prepare the submission data
      const submissionData: StaffSubmissionData = {
        firstName: formData.basicInfo.firstName,
        lastName: formData.basicInfo.lastName,
        email: formData.basicInfo.email,
        phone: formData.basicInfo.phone,
        clinicId: formData.clinicAssignment.clinicId,
        role: formData.rolePermissions.role,
        active: !draft
      };
      
      // If there's a new profile picture, convert it to base64
      if (formData.basicInfo.profilePicture) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.basicInfo.profilePicture);
        
        submissionData.profilePictureBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
        });
      }
      
      let response;
      
      // If in edit mode, update the staff
      if (staffId) {
        response = await updateStaff(staffId, submissionData);
      } else {
        // Otherwise create a new staff
        response = await createStaff(submissionData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      toast({
        title: staffId ? 'Staff Updated' : 'Staff Added',
        description: staffId 
          ? 'The staff member has been updated successfully.'
          : 'The staff member has been added successfully.',
        variant: 'default'
      });
      
      // Navigate back to the staff list
      router.push('/staff');
      router.refresh();
      
    } catch (error) {
      console.error('Error submitting staff form:', error);
      toast({
        title: 'Error',
        description: `Failed to ${staffId ? 'update' : 'add'} staff member. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update form data
  const updateFormData = (
    section: keyof StaffFormData,
    data: Partial<StaffFormData[keyof StaffFormData]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };
  
  // If still loading initial data, show a spinner
  if (isLoadingInitial) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Progress Tabs */}
      <Tabs 
        defaultValue={currentStep} 
        value={currentStep}
        className="w-full mb-6"
        onValueChange={(value) => setCurrentStep(value)}
      >
        <TabsList className="flex w-full rounded-none h-14 p-1">
          <TabsTrigger
            value="basic"
            className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
            disabled={isLoading}
          >
            <span className="font-medium">1.</span> Basic Info
          </TabsTrigger>
          
          {/* Only show clinic assignment step if there are multiple clinics */}
          {!skipClinicStep && (
            <TabsTrigger
              value="clinic"
              className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
              disabled={isLoading}
            >
              <span className="font-medium">2.</span> Clinic
            </TabsTrigger>
          )}
          
          <TabsTrigger
            value="role"
            className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
            disabled={isLoading}
          >
            <span className="font-medium">{skipClinicStep ? '2' : '3'}.</span> Role
          </TabsTrigger>
          
          <TabsTrigger
            value="review"
            className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
            disabled={isLoading}
          >
            <span className="font-medium">{skipClinicStep ? '3' : '4'}.</span> Review
          </TabsTrigger>
        </TabsList>
        
        {/* Form Content */}
        <Card className="border mt-6">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="basic" className="mt-0">
                  <BasicInfoStep 
                    formData={formData.basicInfo}
                    updateFormData={(data) => updateFormData('basicInfo', data)}
                    onNext={goToNextStep}
                    isLoading={isLoading}
                  />
                </TabsContent>
                
                <TabsContent value="clinic" className="mt-0">
                  <ClinicAssignmentStep 
                    formData={formData.clinicAssignment}
                    updateFormData={(data) => updateFormData('clinicAssignment', data)}
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    isLoading={isLoading}
                    clinics={availableClinics}
                  />
                </TabsContent>
                
                <TabsContent value="role" className="mt-0">
                  <RolePermissionsStep 
                    formData={formData.rolePermissions}
                    updateFormData={(data) => updateFormData('rolePermissions', data)}
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    isLoading={isLoading}
                  />
                </TabsContent>
                
                <TabsContent value="review" className="mt-0">
                  <ReviewStep 
                    formData={formData}
                    clinics={availableClinics}
                    onSubmit={handleSubmit}
                    onBack={goToPreviousStep}
                    isLoading={isLoading}
                    isEditMode={!!staffId}
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
