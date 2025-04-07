'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

interface Clinic {
  id: string;
  name: string;
}

interface ClinicSelectorProps {
  clinics: Clinic[];
}

// Component that uses search params
function ClinicSelectorContent({ clinics }: ClinicSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  
  // Initialize with clinicId from URL query parameter, or 'all' as default
  useEffect(() => {
    const clinicId = searchParams.get('clinicId');
    if (clinicId) {
      // Find the matching clinic name
      const clinic = clinics.find(c => c.id === clinicId);
      if (clinic) {
        setValue(clinic.id);
      }
    }
  }, [searchParams, clinics]);
  
  // Update URL when a clinic is selected
  const handleClinicSelect = (clinicId: string) => {
    // Ultra-fast store update first
    setValue(clinicId);
    setOpen(false);
    
    // Then update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    if (clinicId === 'all') {
      params.delete('clinicId');
    } else {
      params.set('clinicId', clinicId);
    }
    
    // Navigate with the current pathname but updated query parameters
    const pathname = window.location.pathname;
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? clinics.find((clinic) => clinic.id === value)?.name || "All Clinics"
            : "All Clinics"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search clinic..." />
          <CommandEmpty>No clinic found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value="all"
              onSelect={() => handleClinicSelect('all')}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              All Clinics
            </CommandItem>
            
            {clinics.map((clinic) => (
              <CommandItem
                key={clinic.id}
                value={clinic.id}
                onSelect={() => handleClinicSelect(clinic.id)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === clinic.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {clinic.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Wrap in Suspense boundary for Next.js 15 optimization
export function ClinicSelector(props: ClinicSelectorProps) {
  return (
    <Suspense fallback={
      <Skeleton className="h-10 w-full rounded-md" />
    }>
      <ClinicSelectorContent {...props} />
    </Suspense>
  );
}
