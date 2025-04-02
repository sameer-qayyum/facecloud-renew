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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the validation schema
const contactInfoSchema = z.object({
  phone: z.string()
    .min(1, "Phone number is required")
    .refine(val => /^(\+\d{1,3})?\s?\(?0?\d{1,4}\)?\s?\d{5,10}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

// Define the type based on the schema
type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

interface ContactInfoStepProps {
  data: {
    phone: string;
    email: string;
  };
  onChange: (values: { phone: string; email: string }) => void;
}

export function ContactInfoStep({ data, onChange }: ContactInfoStepProps) {
  // Create form with initial values
  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone: data.phone || '',
      email: data.email || '',
    },
    mode: "onChange",
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.phone && values.email) {
        onChange({
          phone: values.phone,
          email: values.email,
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Contact Information</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Enter the contact details for this clinic.
        </p>
      </div>
      
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Phone Number*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter clinic phone number" 
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Email Address*</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="Enter clinic email address" 
                    {...field} 
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            * Required fields
          </p>
        </div>
      </Form>
    </div>
  );
}
