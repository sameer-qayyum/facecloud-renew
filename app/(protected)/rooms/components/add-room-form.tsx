'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  roomTypeId: z.string().uuid('Please select a valid room type'),
  clinicId: z.string().uuid('Please select a clinic'),
  notes: z.string().optional(),
});

// Enhanced clinic interface with location
interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

export default function AddRoomForm() {
  const router = useRouter();
  const supabase = createClient();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [roomTypes, setRoomTypes] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasSingleClinic, setHasSingleClinic] = useState(false);

  // Form setup with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      notes: '',
    },
  });

  // Load clinics and room types when component mounts
  useEffect(() => {
    const loadFormData = async () => {
      try {
        // Fetch user's company info
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Get company ID from staff or company_owners table
        let companyId = null;

        const { data: staffRecords } = await supabase
          .from('staff')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('active', true);

        if (staffRecords && staffRecords.length > 0) {
          companyId = staffRecords[0].company_id;
        } else {
          const { data: companyOwners } = await supabase
            .from('company_owners')
            .select('company_id')
            .eq('user_id', user.id);

          if (companyOwners && companyOwners.length > 0) {
            companyId = companyOwners[0].company_id;
          }
        }

        if (!companyId) return;

        try {
          // First get all clinics - using the same pattern as in staff/actions.ts
          const { data: clinicsData } = await supabase
            .from('clinics')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('active', true)
            .order('name', { ascending: true });
          
          console.log('Clinics data:', clinicsData);
          
          if (clinicsData && clinicsData.length > 0) {
            // Get locations for each clinic using same pattern as staff actions
            // This ensures ultra lightning fast performance
            const locationPromises = clinicsData.map(clinic => 
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
            const processedClinics = clinicsData.map(clinic => ({
              id: clinic.id,
              name: clinic.name,
              location_name: locationMap[clinic.id]
            }));
            
            console.log('Processed clinics with locations:', processedClinics);
            setClinics(processedClinics);
            
            // Auto-assign clinic if there's only one
            if (processedClinics.length === 1) {
              setHasSingleClinic(true);
              form.setValue('clinicId', processedClinics[0].id);
              
              // Load room types for this clinic
              await loadRoomTypes(processedClinics[0].id);
            }
          } else {
            setClinics([]);
            toast.warning('No clinics found. Please create a clinic first.');
          }
        } catch (locationError) {
          console.error('Error loading location data:', locationError);
          
          // Fallback to just clinics without locations if the location query fails
          try {
            const { data: fallbackClinicsData } = await supabase
              .from('clinics')
              .select('id, name')
              .eq('company_id', companyId)
              .eq('active', true)
              .order('name');
            
            if (fallbackClinicsData) {
              const simpleClinics = fallbackClinicsData.map(clinic => ({
                id: clinic.id,
                name: clinic.name,
                location_name: null
              }));
              
              setClinics(simpleClinics);
              
              if (simpleClinics.length === 1) {
                setHasSingleClinic(true);
                form.setValue('clinicId', simpleClinics[0].id);
                await loadRoomTypes(simpleClinics[0].id);
              }
            }
          } catch (fallbackError) {
            console.error('Error in fallback clinic loading:', fallbackError);
            setClinics([]);
            toast.error('Failed to load clinics');
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Failed to load clinics and room types');
      }
    };

    loadFormData();
  }, [form]);

  // Handle clinic change to load appropriate room types
  const handleClinicChange = async (clinicId: string) => {
    await loadRoomTypes(clinicId);
  };

  // Separated room types loading logic for reuse
  const loadRoomTypes = async (clinicId: string) => {
    try {
      const { data: roomTypesData } = await supabase
        .from('room_types')
        .select('id, name, description')
        .eq('clinic_id', clinicId)
        .eq('active', true)
        .order('name');

      if (roomTypesData && roomTypesData.length > 0) {
        setRoomTypes(roomTypesData);

        // Auto-select room type if there's only one
        if (roomTypesData.length === 1) {
          form.setValue('roomTypeId', roomTypesData[0].id);
        } else {
          // Reset room type when clinic changes (if there are multiple options)
          form.setValue('roomTypeId', ''); 
        }
      } else {
        // No room types found
        setRoomTypes([]);
        form.setValue('roomTypeId', '');
        toast.warning('No room types found for this clinic. Please create a room type first.');
      }
    } catch (error) {
      console.error('Error loading room types:', error);
      toast.error('Failed to load room types for this clinic');
      setRoomTypes([]);
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Insert new room
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: values.name,
          clinic_id: values.clinicId,
          room_type_id: values.roomTypeId,
          active: true
        })
        .select();

      if (error) throw error;

      setIsSaved(true);
      toast.success('Room added successfully!');

      // Navigate back to rooms list after brief delay to show success
      setTimeout(() => {
        router.push('/rooms');
        router.refresh(); // Refresh the page to show the new room
      }, 1000);

    } catch (error: any) {
      console.error('Error adding room:', error);
      toast.error(error.message || 'Failed to add room');
      setIsLoading(false);
    }
  };

  // Handle cancel/back button
  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleCancel}
        >
          <ArrowLeft size={16} />
          <span>Back to Rooms</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="clinicId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-foreground">
                        Clinic <span className="text-destructive">*</span>
                        {hasSingleClinic && <span className="ml-2 text-xs text-muted-foreground">(Auto-assigned)</span>}
                      </FormLabel>
                      <Select
                        disabled={isLoading || hasSingleClinic}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleClinicChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "w-full bg-background",
                            hasSingleClinic && "opacity-90"
                          )}>
                            <SelectValue placeholder="Select clinic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clinics.map((clinic) => (
                            <SelectItem key={clinic.id} value={clinic.id}>
                              {clinic.name}{clinic.location_name ? ` - ${clinic.location_name}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        {hasSingleClinic
                          ? "You only have one clinic available"
                          : "Select which clinic this room belongs to"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Room Type <span className="text-destructive">*</span>
                        {roomTypes.length === 1 && <span className="ml-2 text-xs text-muted-foreground">(Auto-assigned)</span>}
                      </FormLabel>
                      <Select
                        disabled={isLoading || !form.getValues('clinicId') || roomTypes.length === 0 || roomTypes.length === 1}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "w-full bg-background",
                            roomTypes.length === 1 && "opacity-90"
                          )}>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        {roomTypes.length === 0
                          ? "Please select a clinic first"
                          : roomTypes.length === 1
                            ? "Only one room type available"
                            : "Select the type of treatment room"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Room Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Treatment Room 1"
                          className="bg-background"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter a unique name for this room
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional information about this room"
                          className="resize-none bg-background"
                          style={{ minHeight: '80px', maxHeight: '120px' }}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2 pb-4 sticky bottom-0 bg-background border-t mt-4 sm:static sm:border-0 sm:bg-transparent sm:mt-2">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSaved}
              className={cn(
                "min-w-[120px]",
                isSaved ? "bg-green-600 hover:bg-green-700" : ""
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                'Add Room'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
