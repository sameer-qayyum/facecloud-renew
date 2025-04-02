'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@/utils/supabase/client';

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
  const [clinicCreated, setClinicCreated] = useState<{
    clinicId: string;
    locationId: string;
  } | null>(null);
  
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
  
  // Set up real-time subscription when a clinic is created
  useEffect(() => {
    if (!clinicCreated) return;
    
    const setupRealtimeSubscription = async () => {
      const supabase = createClient();
      
      // Subscribe to clinics table for real-time updates
      const clinicsSubscription = supabase
        .channel('clinics-updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'clinics',
            filter: `id=eq.${clinicCreated.clinicId}`
          }, 
          (payload) => {
            // Auto-refresh data or update UI as needed
            console.log('Clinic updated:', payload);
            router.refresh();
          }
        )
        .subscribe();
        
      // Subscribe to locations table for real-time updates  
      const locationsSubscription = supabase
        .channel('locations-updates')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'locations',
            filter: `id=eq.${clinicCreated.locationId}`
          },
          (payload) => {
            // Auto-refresh data or update UI as needed
            console.log('Location updated:', payload);
            router.refresh();
          }
        )
        .subscribe();
      
      // Subscribe to staff table for real-time updates
      const staffSubscription = supabase
        .channel('staff-updates')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'staff',
            filter: `clinic_id=eq.${clinicCreated.clinicId}`
          },
          (payload) => {
            // Auto-refresh data or update UI as needed
            console.log('Staff updated:', payload);
            router.refresh();
          }
        )
        .subscribe();
        
      // Clean up subscriptions when component unmounts
      return () => {
        supabase.removeChannel(clinicsSubscription);
        supabase.removeChannel(locationsSubscription);
        supabase.removeChannel(staffSubscription);
      };
    };
    
    setupRealtimeSubscription();
  }, [clinicCreated, router]);
  
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
  
  // Convert logo file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Submit the form
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare logo if it exists
      let logoBase64: string | undefined = undefined;
      if (formData.clinic.logo) {
        logoBase64 = await fileToBase64(formData.clinic.logo);
      }
      
      // Create submission data
      const submissionData: ClinicSubmissionData = {
        clinic: {
          name: formData.clinic.name,
          logoBase64,
        },
        location: {
          ...formData.location,
          ...formData.contact,
        },
        operatingHours: formData.operatingHours,
      };
      
      const result = await createClinic(submissionData);
      
      if (result.success) {
        // Store clinic and location IDs for real-time updates
        setClinicCreated({
          clinicId: result.clinicId,
          locationId: result.locationId
        });
        
        toast({
          title: "Clinic created!",
          description: "Your clinic has been created successfully.",
        });
        
        // Redirect to the new clinic page after a short delay
        // This gives time for the real-time subscription to initialize
        setTimeout(() => {
          router.push(result.redirectPath);
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast({
        title: "Error creating clinic",
        description: error.message || "There was a problem creating your clinic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="basic" onClick={() => goToStep('basic')}>
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="location" onClick={() => goToStep('location')}>
            Location
          </TabsTrigger>
          <TabsTrigger value="contact" onClick={() => goToStep('contact')}>
            Contact
          </TabsTrigger>
          <TabsTrigger value="hours" onClick={() => goToStep('hours')}>
            Hours
          </TabsTrigger>
          <TabsTrigger value="review" onClick={() => goToStep('review')}>
            Review
          </TabsTrigger>
        </TabsList>
        
        {/* Card with content */}
        <Card className="mt-4 border-t-0 rounded-t-none shadow-sm">
          <CardContent className="pt-6">
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
        </Card>
      </Tabs>
      
      {/* Navigation and submission buttons */}
      <div className="flex justify-between items-center mt-6">
        <div>
          {!isFirstStep() && (
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={saveDraft}
            disabled={isSubmitting || isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
          
          {isLastStep() ? (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating Clinic...
                </>
              ) : (
                'Create Clinic'
              )}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
