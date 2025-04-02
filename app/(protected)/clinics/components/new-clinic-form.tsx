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

// Define the form data interface
interface ClinicFormData {
  clinic: {
    name: string;
    logo?: File;
  };
  location: Partial<Location>;
  contact: ContactInfo;
  operatingHours: OperatingHours;
}

// Define the data used for form submission - must match ClinicSubmissionData in actions.ts
interface ClinicSubmissionData {
  clinic: {
    name: string;
    logoBase64?: string;
  };
  location: Partial<Location> & { email: string; phone: string }; // This includes contact info
  operatingHours: OperatingHours;
}

// Define the steps of the form
const STEPS = ['basic', 'location', 'contact', 'hours', 'review'];

export function NewClinicForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>({
    clinic: {
      name: '',
    },
    location: {
      country: 'Australia',
      suburb: '',
      address: '',
      state: undefined,
      postcode: '',
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
    },
  });

  // Update clinic data
  const updateClinicData = (data: { name: string; logo?: File }) => {
    setFormData(prev => ({
      ...prev,
      clinic: {
        ...prev.clinic,
        ...data,
      },
    }));
  };

  // Update location data
  const updateLocationData = (data: Partial<Location>) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...data,
      },
    }));
  };

  // Update contact data
  const updateContactData = (data: Partial<ContactInfo>) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        ...data,
      },
    }));
  };

  // Update operating hours data
  const updateOperatingHours = (data: OperatingHours) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: data,
    }));
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!formData.clinic.name;
      case 1: // Location
        return !!(
          formData.location.suburb && 
          formData.location.address && 
          formData.location.state && 
          formData.location.postcode
        );
      case 2: // Contact
        return !!(formData.contact.email && formData.contact.phone);
      case 3: // Operating Hours
        return Object.values(formData.operatingHours).some(day => 
          day.isOpen && day.openTime && day.closeTime
        );
      default:
        return true;
    }
  };

  // Handle next step navigation
  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step navigation
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const dataToSubmit = await prepareDataForSubmission();
      const result = await saveClinicDraft(dataToSubmit);
      toast({
        title: "Draft saved",
        description: "Your clinic draft has been saved. You can continue editing later.",
      });
    } catch (error) {
      toast({
        title: "Failed to save draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Prepare data for submission
  const prepareDataForSubmission = async (): Promise<ClinicSubmissionData> => {
    // Merge contact info into location
    const locationWithContact = {
      ...formData.location,
      email: formData.contact.email,
      phone: formData.contact.phone,
    };

    // Convert logo to base64 if it exists
    let logoBase64: string | undefined = undefined;
    if (formData.clinic.logo) {
      logoBase64 = await fileToBase64(formData.clinic.logo);
    }

    return {
      clinic: {
        name: formData.clinic.name,
        logoBase64,
      },
      location: locationWithContact,
      operatingHours: formData.operatingHours,
    };
  };

  // Check if all required fields are filled
  const canSubmit = (): boolean => {
    return !!(
      formData.clinic.name &&
      formData.location.suburb &&
      formData.location.address &&
      formData.location.state &&
      formData.location.postcode &&
      formData.contact.email &&
      formData.contact.phone &&
      Object.values(formData.operatingHours).some(day => 
        day.isOpen && day.openTime && day.closeTime
      )
    );
  };

  // Submit form
  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields before creating the clinic.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const dataToSubmit = await prepareDataForSubmission();
      const result = await createClinic(dataToSubmit);
      toast({
        title: "Clinic created",
        description: "Your new clinic has been successfully created.",
      });
      router.push(`/clinics/${result.clinicId}`);
    } catch (error) {
      toast({
        title: "Failed to create clinic",
        description: "There was an error creating your clinic. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <Tabs 
        value={STEPS[currentStep]} 
        className="w-full"
        onValueChange={(value) => {
          const index = STEPS.indexOf(value);
          if (index >= 0) {
            setCurrentStep(index);
          }
        }}
      >
        <TabsList className="w-full grid grid-cols-5 px-2 py-1">
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
                  onChange={updateOperatingHours} 
                />
              </TabsContent>

              <TabsContent value="review" className="mt-0">
                <ReviewStep 
                  data={formData} 
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-4 pt-3 border-t">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={saving || submitting}
                  size="sm"
                  className="h-9"
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                size="sm"
                className="h-9"
              >
                {saving ? <LoadingSpinner className="mr-1" size="sm" /> : null}
                Save Draft
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={saving || submitting}
                  size="sm"
                  className="h-9"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !canSubmit()}
                  className="gap-1 h-9"
                  size="sm"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : null}
                  Create Clinic
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}
