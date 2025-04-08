'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AvailabilityStep 
} from './staff-form/availability-step';
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

// Define available form steps
const STEPS = ['basic', 'clinic', 'role', 'availability', 'review'] as const;
export type StaffFormStep = typeof STEPS[number];

// Define the form data interface
export interface StaffFormData {
  basicInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    ahpraNumber?: string;
    profilePicture?: File;
    profilePictureUrl?: string;
  };
  clinicAssignment: {
    clinicId: string | null;
  };
  rolePermissions: {
    role: StaffRole;
  };
  availability: {
    mon: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    tue: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    wed: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    thu: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    fri: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    sat: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
    sun: { isAvailable: boolean; slots?: { startTime: string; endTime: string }[] };
  };
}

// Define the data to be submitted to the server, matching the server-side schema
interface StaffSubmissionData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ahpraNumber?: string;
  role: StaffRole;
  clinicId?: string | null;
  active: boolean;
  profilePictureBase64?: string;
  profilePictureUrl?: string;
  availability: StaffFormData['availability'];
}

interface NewStaffFormProps {
  staffId?: string | null;
  initialClinics?: any[];
}

const defaultFormData: StaffFormData = {
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
  },
  availability: {
    mon: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    tue: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    wed: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    thu: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    fri: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    sat: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    },
    sun: {
      isAvailable: false,
      slots: [{ startTime: '09:00', endTime: '17:00' }]
    }
  }
};

// Get form data and current step from session storage for ultra-fast resuming
const initializeFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      // Get form data
      const savedState = sessionStorage.getItem('staff-form-state');
      // Get current step
      const savedStep = sessionStorage.getItem('staff-form-step');
      
      let initialFormData = defaultFormData;
      let initialStep: StaffFormStep = 'basic';
      
      if (savedState) {
        initialFormData = JSON.parse(savedState);
      }
      
      // Validate saved step is a valid step before using it
      if (savedStep && STEPS.includes(savedStep as StaffFormStep)) {
        initialStep = savedStep as StaffFormStep;
      }
      
      return { initialFormData, initialStep };
    } catch (error) {
      // Silent error handling for ultra-fast performance
    }
  }
  return { initialFormData: defaultFormData, initialStep: 'basic' as const };
};

export function NewStaffForm({ staffId, initialClinics = [] }: NewStaffFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  // Initialize both form data and current step in one go
  const { initialFormData, initialStep } = initializeFromStorage();
  
  // Form data state with retrieved data
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  
  // Store the actual File object separately as it can't be serialized
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  
  // Current step with retrieved step - ensure proper typing
  const [currentStep, setCurrentStep] = useState<StaffFormStep>(initialStep);
  
  // Safe step setter that validates the step is valid
  const safeSetCurrentStep = (step: unknown) => {
    if (typeof step === 'string' && STEPS.includes(step as StaffFormStep)) {
      setCurrentStep(step as StaffFormStep);
    }
  };

  // Track the current step index
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(STEPS.indexOf(initialStep));
  
  // Track loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(!!staffId);
  
  // Track the available clinics
  const [availableClinics, setAvailableClinics] = useState<any[]>(initialClinics || []);
  
  // Track if we should skip the clinic assignment step
  const [skipClinicStep, setSkipClinicStep] = useState<boolean>(false);
  
  // Track if form has been modified to prevent unnecessary saves
  const [formModified, setFormModified] = useState(false);
  
  // Track if form has been submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Ultra-optimized sessionStorage save that's completely decoupled from input handling
  useEffect(() => {
    if (!formModified) return;

    // Only save on a 2-second cooldown to prioritize typing performance
    const saveTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && 
          (formData.basicInfo.firstName || formData.basicInfo.lastName || formData.basicInfo.email)) {
        try {
          // Create a serializable version of form data without File objects
          const serializableFormData = {
            ...formData,
            basicInfo: {
              ...formData.basicInfo,
              // Don't try to serialize File objects - they can't be properly restored
              profilePicture: undefined,
              // Keep profilePictureUrl if we have it, for displaying the image
            }
          };
          
          sessionStorage.setItem('staff-form-state', JSON.stringify(serializableFormData));
        } catch (error) {
          // Silent catch
        }
        setFormModified(false);
      }
    }, 2000);
    
    return () => clearTimeout(saveTimer);
  }, [formData, formModified]);

  // Save current step to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Validate the currentStep is a valid step before saving
      if (typeof currentStep === 'string' && STEPS.includes(currentStep as StaffFormStep)) {
        sessionStorage.setItem('staff-form-step', currentStep);
      }
    }
  }, [currentStep]);

  // Clear saved form state
  const clearSavedFormState = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('staff-form-state');
      sessionStorage.removeItem('staff-form-step');
    }
  }, []);

  // Clear all saved form data when component unmounts if form was submitted
  useEffect(() => {
    return () => {
      if (formSubmitted) {
        clearSavedFormState();
      }
    };
  }, [formSubmitted, clearSavedFormState]);

  // Lightning-fast synchronous form updates with no delay
  const updateFormData = (
    section: keyof StaffFormData,
    data: Partial<StaffFormData[keyof StaffFormData]>
  ) => {
    // Special handling for profile pictures, which need separate storage
    if (section === 'basicInfo' && 'profilePicture' in data) {
      // If this is a file upload, store it in the separate state
      if (data.profilePicture instanceof File) {
        setProfilePictureFile(data.profilePicture);
        
        // Create a preview URL for display purposes
        const url = URL.createObjectURL(data.profilePicture);
        data = {
          ...data,
          profilePictureUrl: url
        };
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
    
    // Mark form as modified to trigger a save on cooldown
    setFormModified(true);
  };

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
            },
            availability: {
              // Parse availability data from the staff_assignment record
              // If no availability data exists, use default values
              mon: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              tue: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              wed: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              thu: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              fri: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              sat: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              },
              sun: {
                isAvailable: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }]
              }
            }
          });
            
          // If staff record has availability data, parse it
          if (staff.staff_availability || (staff as any).staff_availability) {
            try {
              const availability = JSON.parse((staff as any).staff_availability);
              if (availability) {
                // Update form data with availability
                setFormData(prev => ({
                  ...prev,
                  availability: {
                    mon: {
                      isAvailable: availability.mon?.length > 0,
                      slots: availability.mon?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    tue: {
                      isAvailable: availability.tue?.length > 0,
                      slots: availability.tue?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    wed: {
                      isAvailable: availability.wed?.length > 0,
                      slots: availability.wed?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    thu: {
                      isAvailable: availability.thu?.length > 0,
                      slots: availability.thu?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    fri: {
                      isAvailable: availability.fri?.length > 0,
                      slots: availability.fri?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    sat: {
                      isAvailable: availability.sat?.length > 0,
                      slots: availability.sat?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    },
                    sun: {
                      isAvailable: availability.sun?.length > 0,
                      slots: availability.sun?.map((slot: string) => {
                        const [startTime, endTime] = slot.split('-');
                        return {
                          startTime: `${startTime}:00`,
                          endTime: `${endTime}:00`
                        };
                      }) || [{ startTime: '09:00', endTime: '17:00' }]
                    }
                  }
                }));
              }
            } catch (error) {
              console.error('Error parsing staff availability:', error);
            }
          }
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
  
  // On each step, update state and check/run validations
  const handleStepChange = async (direction: 'next' | 'back' | number) => {
    if (direction === 'next') {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        // Check if we're on the role step and should skip clinic step
        if (STEPS[currentStepIndex] === 'role' && skipClinicStep) {
          setCurrentStepIndex(nextIndex + 1);
          safeSetCurrentStep(STEPS[nextIndex + 1]);
        } else {
          setCurrentStepIndex(nextIndex);
          safeSetCurrentStep(STEPS[nextIndex]);
        }
      }
    } else if (direction === 'back') {
      // Handle going back
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        // Check if we're coming back from availability and should skip clinic
        if (STEPS[currentStepIndex] === 'availability' && skipClinicStep) {
          setCurrentStepIndex(prevIndex - 1);
          safeSetCurrentStep(STEPS[prevIndex - 1]);
        } else {
          setCurrentStepIndex(prevIndex);
          safeSetCurrentStep(STEPS[prevIndex]);
        }
      }
    } else if (typeof direction === 'number') {
      // Jump to a specific step by index
      if (direction >= 0 && direction < STEPS.length) {
        setCurrentStepIndex(direction);
        safeSetCurrentStep(STEPS[direction]);
      }
    }
  };
  
  // Navigate to the next step
  const goToNextStep = () => {
    handleStepChange('next');
  };
  
  // Navigate to the previous step
  const goToPreviousStep = () => {
    handleStepChange('back');
  };
  
  // Only fetch clinics if not provided as initialClinics
  useEffect(() => {
    let isMounted = true;
    
    const fetchClinics = async () => {
      if (availableClinics.length === 0 && !initialClinics?.length) {
        try {
          const result = await getCompanyClinics();
          if (isMounted && result.data) {
            setAvailableClinics(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch clinics:', error);
        }
      }
    };

    fetchClinics();
    
    return () => {
      isMounted = false;
    };
  }, [availableClinics.length, initialClinics]);
  
  // Handle form submission
  const handleSubmit = async (draft: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Prepare submission data
      const submissionData: StaffSubmissionData = {
        firstName: formData.basicInfo.firstName.trim(),
        lastName: formData.basicInfo.lastName.trim(),
        email: formData.basicInfo.email.trim(),
        phone: formData.basicInfo.phone?.trim(),
        ahpraNumber: formData.basicInfo.ahpraNumber?.trim(),
        role: formData.rolePermissions.role,
        clinicId: formData.clinicAssignment.clinicId,
        availability: formData.availability,
        active: !draft // If it's a draft, it's not active
      };
      
      // Handle profile picture if available - use the separate state that maintains the File interface
      if (profilePictureFile instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(profilePictureFile);
        
        submissionData.profilePictureBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Server code extracts the data from the prefix, so ensure we're sending the right format
            resolve(base64data); 
          };
        });
      } else if (formData.basicInfo.profilePictureUrl) {
        // If we have a URL but not a File, the user didn't change the profile picture
        submissionData.profilePictureUrl = formData.basicInfo.profilePictureUrl;
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
      
      // Clear saved form state on successful submission
      clearSavedFormState();
      setFormSubmitted(true);
      
      // Show success message
      toast({
        title: staffId ? 'Staff Updated' : 'Staff Added',
        description: `${formData.basicInfo.firstName} ${formData.basicInfo.lastName} has been ${staffId ? 'updated' : 'added'} to your organization.`,
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
  
  // If still loading initial data, show a spinner
  if (isLoadingInitial) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
        onValueChange={(value) => safeSetCurrentStep(value)}
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
            value="availability"
            className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
            disabled={isLoading}
          >
            <span className="font-medium">{skipClinicStep ? '3' : '4'}.</span> Availability
          </TabsTrigger>
          
          <TabsTrigger
            value="review"
            className="flex-1 rounded-sm data-[state=active]:bg-background h-full"
            disabled={isLoading}
          >
            <span className="font-medium">{skipClinicStep ? '4' : '5'}.</span> Review
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
                
                <TabsContent value="availability" className="mt-0">
                  <AvailabilityStep 
                    data={formData.availability}
                    onChange={(data) => updateFormData('availability', data)}
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
