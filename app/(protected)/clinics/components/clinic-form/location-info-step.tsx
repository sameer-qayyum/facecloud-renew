'use client';

import { useEffect } from 'react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Australian states
const STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
] as const;

// Define the validation schema
const locationInfoSchema = z.object({
  suburb: z.string().min(1, "Suburb is required"),
  address: z.string().min(1, "Address is required"),
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']),
  postcode: z.string()
    .min(1, "Postcode is required")
    .refine(val => /^\d{4}$/.test(val), {
      message: "Please enter a valid 4-digit postcode",
    }),
  country: z.string().default('Australia'),
});

// Define the type based on the schema
type LocationInfoFormValues = z.infer<typeof locationInfoSchema>;

interface LocationInfoStepProps {
  data: {
    suburb?: string;
    address?: string;
    state?: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT';
    postcode?: string;
    country?: string;
  };
  onChange: (values: LocationInfoFormValues) => void;
}

export function LocationInfoStep({ data, onChange }: LocationInfoStepProps) {
  // Create form with initial values
  const form = useForm<LocationInfoFormValues>({
    resolver: zodResolver(locationInfoSchema),
    defaultValues: {
      suburb: data.suburb || '',
      address: data.address || '',
      state: data.state || undefined,
      postcode: data.postcode || '',
      country: data.country || 'Australia',
    },
    mode: "onChange",
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.suburb && values.address && values.state && values.postcode) {
        onChange(values as LocationInfoFormValues);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Location Information</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Enter the physical location details for this clinic.
        </p>
      </div>
      
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Street Address*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter street address" 
                    {...field} 
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="suburb"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Suburb*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter suburb" 
                    {...field} 
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">State*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Postcode*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter postcode" 
                      {...field} 
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            * Required fields. The suburb will be used as the location name.
          </p>
        </div>
      </Form>
    </div>
  );
}
