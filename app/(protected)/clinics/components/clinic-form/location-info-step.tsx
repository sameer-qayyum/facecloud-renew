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

type StateType = (typeof STATES)[number]['value'];

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
    state?: StateType;
    postcode?: string;
    country?: string;
  };
  onChange: (values: LocationInfoFormValues) => void;
}

export function LocationInfoStep({ data, onChange }: LocationInfoStepProps) {
  // Create form with initial values
  const form = useForm({
    resolver: zodResolver(locationInfoSchema),
    defaultValues: {
      suburb: data.suburb || '',
      address: data.address || '',
      state: (data.state || 'NSW') as StateType,
      postcode: data.postcode || '',
      country: data.country || 'Australia',
    },
    mode: "onChange",
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.suburb && values.address && values.state && values.postcode) {
        onChange(form.getValues() as LocationInfoFormValues);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Enter the location information for this clinic.
      </div>
      
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="suburb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suburb</FormLabel>
                <FormControl>
                  <Input placeholder="Melbourne" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="3000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input disabled {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
