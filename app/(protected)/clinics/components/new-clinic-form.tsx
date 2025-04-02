'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clinic,
  Location
} from '@/lib/types';
import { BasicInfoStep } from './clinic-form/basic-info-step';
import { LocationInfoStep } from './clinic-form/location-info-step';
import { ContactInfoStep } from './clinic-form/contact-info-step';
import { OperatingHoursStep, OperatingHours } from './clinic-form/operating-hours-step';
import { ReviewStep } from './clinic-form/review-step';
import { createClinic, saveClinicDraft } from '../actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Define contact info interface
interface ContactInfo {
  email: string;
  phone: string;
}

// Define location form data interface with correct state enum
interface LocationFormData {
  suburb?: string;
  address?: string;
  state?: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT';
  postcode?: string;
  country?: string;
}

// Define the form data interface
interface ClinicFormData {
  clinic: {
    name: string;
    logo?: File;
  };
  location: LocationFormData;
  contact: ContactInfo;
  operatingHours: OperatingHours;
}

// Define the data used for form submission - must match ClinicSubmissionData in actions.ts
interface ClinicSubmissionData {
  clinic: {
    name: string;
    logoBase64?: string;
  };
  location: LocationFormData & { email: string; phone: string }; // This includes contact info
  operatingHours: OperatingHours;
}

// Define the steps of the form
const STEPS = ['basic', 'location', 'contact', 'hours', 'review'];

export function NewClinicForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<string>(STEPS[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Initialize form data
  const [formData, setFormData] = useState<ClinicFormData>({
    clinic: {
      name: '',
    },
    location: {
      suburb: '',
      address: '',
      state: undefined,
      postcode: '',
      country: 'Australia',
    },
    contact: {
      email: '',
      phone: '',
    },
    operatingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      saturday: { isOpen: false },
      sunday: { isOpen: false },
    }
  });
  
  // Update clinic data
  const updateClinicData = (data: Partial<Clinic>) => {
    setFormData(prev => ({
      ...prev,
      clinic: {
        ...prev.clinic,
        ...data,
      }
    }));
  };
  
  // Update location data
  const updateLocationData = (data: LocationFormData) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...data,
      }
    }));
  };
  
  // Update contact data
  const updateContactData = (data: ContactInfo) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        ...data,
      }
    }));
  };
  
  // Update operating hours data
  const updateOperatingHoursData = (data: OperatingHours) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: data,
    }));
  };
  
  // Navigate to the next step
  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };
  
  // Navigate to the previous step
  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };
  
  // Go directly to a step
  const goToStep = (step: string) => {
    if (STEPS.includes(step)) {
      setCurrentStep(step);
    }
  };
  
  // Check if we're on the first step
  const isFirstStep = () => {
    return currentStep === STEPS[0];
  };
  
  // Check if we're on the last step
  const isLastStep = () => {
    return currentStep === STEPS[STEPS.length - 1];
  };

  // Save the form data as a draft
  const saveDraft = async () => {
    setIsSaving(true);

    try {
      // In a real app, you would do something with the draft data here
      // For now, we'll just simulate a successful save
      await saveClinicDraft({
        clinic: {
          name: formData.clinic.name,
        },
        location: {
          ...formData.location,
          ...formData.contact
        },
        operatingHours: formData.operatingHours,
      });
      
      toast({
        title: "Draft saved",
        description: "Your clinic draft has been saved successfully."
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error saving draft",
        description: "There was a problem saving your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Convert logo to base64 if present (for API submission)
      let logoBase64: string | undefined = undefined;
      
      if (formData.clinic.logo && formData.clinic.logo.size > 0) {
        const reader = new FileReader();
        logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.clinic.logo as File);
        });
      }
      
      // Prepare submission data
      const submissionData: ClinicSubmissionData = {
        clinic: {
          name: formData.clinic.name,
          logoBase64,
        },
        location: {
          ...formData.location,
          ...formData.contact
        },
        operatingHours: formData.operatingHours,
      };
      
      // Submit the data
      const result = await createClinic(submissionData);
      
      if (result.success) {
        toast({
          title: "Clinic created",
          description: "Your clinic has been created successfully."
        });
        
        // Redirect to the clinics page
        router.push('/clinics');
        router.refresh();
      } else {
        throw new Error('Failed to create clinic');
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
      toast({
        title: "Error creating clinic",
        description: "There was a problem creating your clinic. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid grid-cols-5 bg-muted/50 p-1">
            <TabsTrigger value="basic" className="text-xs sm:text-sm py-1.5">Basic</TabsTrigger>
            <TabsTrigger value="location" className="text-xs sm:text-sm py-1.5">Location</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm py-1.5">Contact</TabsTrigger>
            <TabsTrigger value="hours" className="text-xs sm:text-sm py-1.5">Hours</TabsTrigger>
            <TabsTrigger value="review" className="text-xs sm:text-sm py-1.5">Review</TabsTrigger>
          </TabsList>
          
          <CardContent className="p-3 sm:p-4">
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
                    data={formData.clinic} 
                    onChange={updateClinicData} 
                  />
                </TabsContent>

                <TabsContent value="location" className="mt-0">
                  <LocationInfoStep 
                    data={formData.location} 
                    onChange={updateLocationData} 
                  />
                </TabsContent>

                <TabsContent value="contact" className="mt-0">
                  <ContactInfoStep 
                    data={formData.contact} 
                    onChange={updateContactData} 
                  />
                </TabsContent>

                <TabsContent value="hours" className="mt-0">
                  <OperatingHoursStep 
                    data={formData.operatingHours} 
                    onChange={updateOperatingHoursData} 
                  />
                </TabsContent>

                <TabsContent value="review" className="mt-0">
                  <ReviewStep data={formData} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </CardContent>
          
          <div className="p-3 sm:p-4 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex gap-2">
              {!isFirstStep() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={isSubmitting || isSaving}
                  className="flex-1 sm:flex-auto"
                >
                  Previous
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={saveDraft}
                disabled={isSubmitting || isSaving}
                className="flex-1 sm:flex-auto"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
            </div>
            
            <div className="w-full sm:w-auto">
              {isLastStep() ? (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSaving}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    'Create Clinic'
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="w-full"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
