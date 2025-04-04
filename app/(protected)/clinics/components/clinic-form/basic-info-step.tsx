'use client';

import { useEffect, useState } from 'react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Define the validation schema
const basicInfoSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  logo: z
    .instanceof(File)
    .refine(
      (file) => file.size === 0 || file.size <= MAX_FILE_SIZE,
      'File size must be less than 2MB'
    )
    .refine(
      (file) => file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp files are accepted'
    )
    .optional(),
});

// Define the type based on the schema
type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoStepProps {
  data: {
    name?: string;
    logo?: File;
    logoUrl?: string;
  };
  onChange: (values: { name: string; logo?: File }) => void;
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(data.logoUrl || null);
  
  // Create form with initial values
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: data.name || '',
      logo: data.logo,
    },
    mode: "onChange",
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.name) {
        onChange({
          name: values.name,
          logo: values.logo,
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  // Generate preview when a logo is selected
  useEffect(() => {
    const logoFile = form.watch('logo');
    if (logoFile && logoFile.size > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(logoFile);
    } else if (!logoFile && !data.logoUrl) {
      // Only clear the preview if we don't have a logoUrl from the server
      setLogoPreview(null);
    } else if (!logoFile && data.logoUrl) {
      // If there's no file but we have a logoUrl, use that
      setLogoPreview(data.logoUrl);
    }
  }, [form.watch('logo'), data.logoUrl]);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('logo', file, { shouldValidate: true });
    }
  };
  
  // Clear the logo
  const clearLogo = () => {
    form.setValue('logo', undefined, { shouldValidate: true });
    setLogoPreview(null);
    // Make sure we also clear in the parent component
    onChange({
      name: form.getValues('name'),
      logo: undefined
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Basic Information</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Enter the basic details for your clinic.
        </p>
      </div>
      
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Clinic Name*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter clinic name" 
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
            name="logo"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel className="text-sm">Clinic Logo</FormLabel>
                <FormDescription className="text-xs">
                  Upload your clinic's logo (optional). Supported formats: JPG, PNG, WebP. Max size: 2MB.
                </FormDescription>
                
                <div className="mt-2">
                  {logoPreview ? (
                    <div className="relative w-48 h-48 rounded-md overflow-hidden border">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-7 h-7"
                        onClick={clearLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 text-center w-48 h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <div className="text-xs">No logo uploaded</div>
                      <label>
                        <Button
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1.5" />
                          {data.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={handleFileChange}
                          {...field}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground mt-2">
            * Required field
          </p>
        </div>
      </Form>
    </div>
  );
}
