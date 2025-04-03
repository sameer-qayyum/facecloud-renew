'use client';

import { useState, useEffect } from 'react';
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

interface Clinic {
  id: string;
  name: string;
}

interface ClinicSelectorProps {
  clinics: Clinic[];
}

export function ClinicSelector({ clinics }: ClinicSelectorProps) {
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
    } else {
      setValue('all');
    }
  }, [searchParams, clinics]);
  
  const handleSelectClinic = (clinicId: string) => {
    setValue(clinicId);
    setOpen(false);
    
    // Update URL with the selected clinic
    if (clinicId === 'all') {
      // Remove clinicId from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('clinicId');
      router.push(`/staff?${params.toString()}`);
    } else {
      // Add clinicId to URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('clinicId', clinicId);
      router.push(`/staff?${params.toString()}`);
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-64 justify-between"
        >
          {value === 'all' 
            ? 'All Clinics' 
            : clinics.find(clinic => clinic.id === value)?.name || "Select Clinic"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-64 p-0">
        <Command>
          <CommandInput placeholder="Search clinic..." />
          <CommandEmpty>No clinic found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="all"
              value="all"
              onSelect={() => handleSelectClinic('all')}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === 'all' ? "opacity-100" : "opacity-0"
                )}
              />
              All Clinics
            </CommandItem>
            {clinics.map((clinic) => (
              <CommandItem
                key={clinic.id}
                value={clinic.id}
                onSelect={() => handleSelectClinic(clinic.id)}
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
