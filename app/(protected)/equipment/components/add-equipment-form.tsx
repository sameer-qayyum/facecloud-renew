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
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Equipment name must be at least 2 characters'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  clinicId: z.string().uuid('Please select a clinic'),
});

// Enhanced clinic interface with location
interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

export function AddEquipmentForm() {
  const router = useRouter();
  const supabase = createClient();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasSingleClinic, setHasSingleClinic] = useState(false);

  // Form setup with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });

  // Load clinics when component mounts
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
          // Get clinics with location info
          const { data: clinicsData } = await supabase
            .from('clinics')
            .select(`
              id, 
              name,
              locations (
                id,
                name
              )
            `)
            .eq('company_id', companyId)
            .eq('active', true)
            .order('name', { ascending: true });

          if (clinicsData) {
            // Process clinics to include location name
            const processedClinics = clinicsData.map(clinic => ({
              id: clinic.id,
              name: clinic.name,
              location_name: clinic.locations && 
                            Array.isArray(clinic.locations) && 
                            clinic.locations.length > 0 
                ? clinic.locations[0].name 
                : null
            }));
            
            setClinics(processedClinics);
            
            // If there's just one clinic, pre-select it
            if (processedClinics.length === 1) {
              setHasSingleClinic(true);
              form.setValue('clinicId', processedClinics[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching clinics:', error);
          toast.error('Failed to load clinics');
        }
      } catch (error) {
        console.error('Error in loadFormData:', error);
      }
    };

    loadFormData();
  }, [form, supabase]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      // Insert equipment record
      const { data, error } = await supabase
        .from('equipment')
        .insert({
          name: values.name,
          quantity: values.quantity,
          clinic_id: values.clinicId,
          active: true,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Show success UI
      setIsSaved(true);
      toast.success('Equipment added successfully');
      
      // Navigate back to equipment list after a delay
      setTimeout(() => {
        router.push('/equipment');
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating equipment:', error);
      toast.error(error.message || 'Failed to add equipment');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Select Clinic */}
        <Card className="border-muted bg-background">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Select Clinic</h3>
                <p className="text-sm text-muted-foreground">Choose which clinic this equipment belongs to</p>
              </div>
              
              <FormField
                control={form.control}
                name="clinicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic</FormLabel>
                    <Select 
                      disabled={isLoading || hasSingleClinic} 
                      onValueChange={field.onChange} 
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a clinic" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Equipment Details */}
        <Card className="border-muted bg-background">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Equipment Details</h3>
                <p className="text-sm text-muted-foreground">Enter information about the equipment</p>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter equipment name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newValue = Math.max(1, (field.value || 1) - 1);
                            field.onChange(newValue);
                          }}
                          disabled={field.value <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-center"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newValue = (field.value || 1) + 1;
                            field.onChange(newValue);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <div className="ml-2 flex gap-2">
                          {[5, 10, 25].map((quantity) => (
                            <Button
                              key={quantity}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs px-2"
                              onClick={() => field.onChange(quantity)}
                            >
                              {quantity}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set the number of equipment items available
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/equipment')}
            disabled={isLoading || isSaved}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          
          <Button type="submit" disabled={isLoading || isSaved}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Saved
              </>
            ) : (
              'Add Equipment'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
