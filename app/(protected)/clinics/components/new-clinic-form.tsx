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
import { createClinic, saveClinicDraft, updateClinic } from '../actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createClient } from '@/utils/supabase/client';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  name?: string;
}

// Define the form data interface
interface ClinicFormData {
  clinic: {
    name: string;
    logo?: File;
    logoUrl?: string;
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
  location: LocationFormData & { email: string; phone: string };
  operatingHours: OperatingHours;
}

// Define the steps of the form
const STEPS = ['basic', 'location', 'contact', 'hours', 'review'];

// Type declaration for day schedule
type DaySchedule = {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
};

// Convert database opening hours format to form format
const parseOpeningHoursFromDb = (dbHours: Record<string, string[]>): OperatingHours => {
  const defaultHours: OperatingHours = {
    monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
  };

  if (!dbHours) return defaultHours;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result = { ...defaultHours };

  days.forEach(day => {
    if (dbHours[day] && Array.isArray(dbHours[day])) {
      if (dbHours[day].length >= 2) {
        result[day as keyof OperatingHours] = {
          isOpen: true,
          openTime: dbHours[day][0],
          closeTime: dbHours[day][1]
        };
      } else {
        result[day as keyof OperatingHours] = {
          isOpen: false,
          openTime: result[day as keyof OperatingHours].openTime || '09:00',
          closeTime: result[day as keyof OperatingHours].closeTime || '17:00'
        };
      }
    }
  });

  return result;
};

interface NewClinicFormProps {
  clinicId?: string | null;
}

interface ClinicTemplate {
  id: string;
  name: string;
  logo_url?: string | null;
  location_name?: string | null;
}

export function NewClinicForm({ clinicId }: NewClinicFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<string>(STEPS[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!!clinicId);
  const [clinicCreated, setClinicCreated] = useState<{
    clinicId: string;
    locationId: string;
  } | null>(null);
  const [clinicTemplates, setClinicTemplates] = useState<ClinicTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const isEditMode = !!clinicId;
  
  // Initialize form data
  const [formData, setFormData] = useState<ClinicFormData>({
    clinic: {
      name: '',
      logoUrl: '',
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
      saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
      sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    }
  });

  // Load existing clinic data if in edit mode - ultra-fast loading
  useEffect(() => {
    const loadClinicData = async () => {
      if (!clinicId) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Parallel fetching for ultra-fast loading
        const [clinicResponse, locationResponse] = await Promise.all([
          supabase.from('clinics').select('*').eq('id', clinicId).single(),
          supabase.from('locations').select('*').eq('clinic_id', clinicId).maybeSingle()
        ]);
          
        if (clinicResponse.error) throw clinicResponse.error;
        if (locationResponse.error) throw locationResponse.error;
        
        const clinicData = clinicResponse.data;
        const locationData = locationResponse.data;
        
        // Populate form data with fetched data
        setFormData({
          clinic: {
            name: clinicData.name || '',
            logoUrl: clinicData.logo_url || '',
          },
          location: {
            name: locationData?.name || '',
            suburb: locationData?.suburb || '',
            address: locationData?.address || '',
            state: locationData?.state as any || undefined,
            postcode: locationData?.postcode || '',
            country: locationData?.country || 'Australia',
          },
          contact: {
            email: locationData?.email || '',
            phone: locationData?.phone || '',
          },
          operatingHours: locationData?.opening_hours 
            ? parseOpeningHoursFromDb(locationData.opening_hours)
            : formData.operatingHours,
        });
      } catch (error) {
        console.error('Error loading clinic data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clinic data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClinicData();
  }, [clinicId, toast]);

  // Load existing clinics for templates
  useEffect(() => {
    // Don't load templates if we're in edit mode
    if (isEditMode) return;
    
    const loadClinics = async () => {
      try {
        const supabase = createClient();
        
        // First get all clinics
        const { data: clinics, error } = await supabase
          .from('clinics')
          .select('id, name, logo_url')
          .eq('active', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (clinics && clinics.length > 0) {
          // Get the first location for each clinic
          const locationPromises = clinics.map(clinic => 
            supabase
              .from('locations')
              .select('name')
              .eq('clinic_id', clinic.id)
              .maybeSingle()
              .then(({ data }) => ({ 
                clinicId: clinic.id, 
                locationName: data?.name || null 
              }))
          );
          
          const locationResults = await Promise.all(locationPromises);
          
          // Create a map of clinic ID to location name
          const locationMap = locationResults.reduce((map, item) => {
            map[item.clinicId] = item.locationName;
            return map;
          }, {} as Record<string, string | null>);
          
          // Merge clinic and location data
          const clinicsWithLocations = clinics.map(clinic => ({
            ...clinic,
            location_name: locationMap[clinic.id]
          }));
          
          setClinicTemplates(clinicsWithLocations);
        }
      } catch (error) {
        console.error('Error loading clinic templates:', error);
      }
    };
    
    loadClinics();
  }, [isEditMode]);

  // Load template data when a template is selected
  const handleTemplateSelection = async (templateId: string) => {
    if (!templateId || templateId === "none") {
      setSelectedTemplateId("");
      return;
    }
    
    setSelectedTemplateId(templateId);
    setIsLoadingTemplate(true);
    
    try {
      const supabase = createClient();
      
      // Parallel fetching for ultra-fast template loading
      const [clinicResponse, locationResponse] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', templateId).single(),
        supabase.from('locations').select('*').eq('clinic_id', templateId).maybeSingle()
      ]);
        
      if (clinicResponse.error) throw clinicResponse.error;
      if (locationResponse.error) throw locationResponse.error;
      
      const clinicData = clinicResponse.data;
      const locationData = locationResponse.data;
      
      // Populate form data with template data, but keep location and contact empty
      setFormData({
        clinic: {
          name: '', // Don't copy name
          logoUrl: clinicData.logo_url || '',
        },
        location: {
          name: '',
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
        operatingHours: locationData?.opening_hours 
          ? parseOpeningHoursFromDb(locationData.opening_hours)
          : formData.operatingHours,
      });
      
      toast({
        title: 'Template Applied',
        description: `Applied settings from "${clinicData.name}"`,
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clinic template',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Update clinic data
  const updateClinicData = (data: Partial<Clinic>) => {
    setFormData(prev => ({
      ...prev,
      clinic: {
        ...prev.clinic,
        ...data,
      },
    }));
  };
  
  // Update location data
  const updateLocationData = (data: Partial<LocationFormData>) => {
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
  
  // Update operating hours
  const updateOperatingHours = (hours: OperatingHours) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: hours,
    }));
  };
  
  // Handle form navigation
  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };
  
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      
      // Convert form data to submission format
      const submissionData: ClinicSubmissionData = {
        clinic: {
          name: formData.clinic.name,
        },
        location: {
          ...formData.location,
          email: formData.contact.email,
          phone: formData.contact.phone,
        },
        operatingHours: formData.operatingHours,
      };
      
      // Convert logo to base64 if present
      if (formData.clinic.logo) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.clinic.logo);
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            submissionData.clinic.logoBase64 = reader.result as string;
            resolve();
          };
          reader.onerror = () => {
            reject('Error reading file');
          };
        });
      }
      
      // Save draft
      const result = await saveClinicDraft(submissionData);
      
      if (result.success) {
        toast({
          title: "Draft saved!",
          description: "Your clinic draft has been saved. You can continue editing later.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Convert form data to submission format
      const submissionData: ClinicSubmissionData = {
        clinic: {
          name: formData.clinic.name,
        },
        location: {
          ...formData.location,
          email: formData.contact.email,
          phone: formData.contact.phone,
        },
        operatingHours: formData.operatingHours,
      };
      
      // Convert logo to base64 if present
      if (formData.clinic.logo) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.clinic.logo);
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            submissionData.clinic.logoBase64 = reader.result as string;
            resolve();
          };
          reader.onerror = () => {
            reject('Error reading file');
          };
        });
      }
      
      if (isEditMode && clinicId) {
        const result = await updateClinic(clinicId, submissionData);
        if (result.success) {
          toast({
            title: "Clinic updated!",
            description: "Your clinic has been updated successfully.",
          });

          // Go back to clinics page for ultra-fast navigation
          router.push('/clinics');
          router.refresh();
        }
      } else {
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
          
          // Redirect to the new clinic page
          router.push(`/clinics/${result.clinicId}/dashboard`);
          router.refresh();
        }
      }
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create clinic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set up real-time subscription when a clinic is created
  useEffect(() => {
    if (!clinicCreated) return;
    
    let subscription: any;
    
    const setupRealtimeSubscription = async () => {
      const supabase = createClient();
      
      // Set up a subscription to listen for updates to the location
      subscription = supabase
        .channel('location-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'locations',
            filter: `id=eq.${clinicCreated.locationId}`,
          },
          (payload) => {
            console.log('Location updated:', payload);
            
            // If the location has been updated with geolocation, redirect to clinic page
            if (payload.new && payload.new.latitude && payload.new.longitude) {
              router.push(`/clinics/${clinicCreated.clinicId}/dashboard`);
              
              toast({
                title: "Location geocoded",
                description: "Your clinic's location has been geocoded successfully.",
              });
              
              // Unsubscribe after redirect
              subscription?.unsubscribe();
            }
          }
        )
        .subscribe();
    };
    
    setupRealtimeSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [clinicCreated, router]);

  // Loading state for edit mode
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8 animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Loading clinic data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0 sm:p-0">
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid grid-cols-5 bg-muted rounded-none h-auto">
            {STEPS.map((step, index) => (
              <TabsTrigger
                key={step}
                value={step}
                onClick={() => setCurrentStep(step)}
                className="py-3 data-[state=active]:bg-background rounded-none text-xs capitalize"
                disabled={isSubmitting}
              >
                <span className="font-semibold text-sm mr-2">{index + 1}.</span>
                {step}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="p-6">
            {!isEditMode && clinicTemplates.length > 0 && (
              <div className="mb-6 p-4 border rounded-md bg-muted/20">
                <h3 className="text-base font-medium mb-2">Template from Existing Clinic</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You can start with a blank form or use an existing clinic as a template.
                  This will copy the logo and operating hours, but not location or contact information.
                </p>
                <div className="flex items-center gap-3">
                  <Select 
                    disabled={isLoadingTemplate} 
                    value={selectedTemplateId} 
                    onValueChange={handleTemplateSelection}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a clinic as template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Start Fresh</SelectItem>
                      <SelectGroup>
                        {clinicTemplates.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>
                            {clinic.name}{clinic.location_name ? ` - ${clinic.location_name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isLoadingTemplate && <LoadingSpinner className="h-5 w-5 animate-spin" />}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="basic" className="p-0 mt-0">
                  <BasicInfoStep 
                    data={{
                      name: formData.clinic.name,
                      logo: formData.clinic.logo,
                      logoUrl: formData.clinic.logoUrl,
                    }}
                    onChange={(values) => {
                      setFormData({
                        ...formData,
                        clinic: {
                          ...formData.clinic,
                          name: values.name,
                          logo: values.logo,
                        }
                      });
                    }}
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
                  <ReviewStep data={formData} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-between mt-6">
              {currentStep !== STEPS[0] ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}
              
              {currentStep === STEPS[STEPS.length - 1] ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating Clinic...' : 'Creating Clinic...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Clinic' : 'Create Clinic'
                  )}
                </Button>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Draft'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
