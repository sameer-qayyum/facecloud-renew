'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Label } from '@/components/ui/label';
import { FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}

interface BaseSelectorProps {
  clinics: Clinic[];
  label?: string;
  description?: string;
  disabled?: boolean;
  autoAssigned?: boolean;
  required?: boolean;
  urlParam?: boolean;
  className?: string;
}

interface SingleSelectProps extends BaseSelectorProps {
  multiSelect?: false;
  selectedClinicId?: string;
  onChange?: (clinicId: string) => void;
}

interface MultiSelectProps extends BaseSelectorProps {
  multiSelect: true;
  selectedClinicIds?: string[];
  onChange?: (clinicIds: string[]) => void;
}

type ClinicSelectorProps = SingleSelectProps | MultiSelectProps;

/**
 * Reusable clinic selector component
 * Can be used with form control or standalone with URL parameters
 * Supports both single-select (for rooms) and multi-select (for staff) modes
 */
export function ClinicSelector(props: ClinicSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Type guard function to check if props are multi-select
  const isMultiSelect = (props: ClinicSelectorProps): props is MultiSelectProps => {
    return props.multiSelect === true;
  };
  
  if (isMultiSelect(props)) {
    // TypeScript now knows this is MultiSelectProps
    return <MultiClinicSelector {...props} />;
  } else {
    // TypeScript now knows this is SingleSelectProps
    return <SingleClinicSelector {...props} />;
  }
}

// Component for single clinic selection (used for rooms)
function SingleClinicSelector({
  clinics,
  selectedClinicId,
  onChange,
  label = "Clinic",
  description,
  disabled = false,
  autoAssigned = false,
  required = false,
  urlParam = false,
  className
}: SingleSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(selectedClinicId || '');

  // Initialize from URL if using URL parameters
  useEffect(() => {
    if (urlParam) {
      const clinicId = searchParams.get('clinic_id') || '';
      setValue(clinicId || (clinics[0]?.id || ''));
    } else if (selectedClinicId) {
      setValue(selectedClinicId);
    }
  }, [urlParam, searchParams, selectedClinicId, clinics]);

  // Handle clinic change
  const handleClinicChange = (newValue: string) => {
    setValue(newValue);
    
    if (urlParam) {
      // Update URL if using URL parameters
      const params = new URLSearchParams(searchParams.toString());
      
      if (newValue === 'all') {
        params.delete('clinic_id');
      } else {
        params.set('clinic_id', newValue);
      }
      
      const newPath = window.location.pathname + '?' + params.toString();
      router.push(newPath);
    }
    
    // Call onChange handler if provided
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="clinic-selector" className="text-foreground mb-2 block">
          {label} {required && <span className="text-destructive">*</span>}
          {autoAssigned && <span className="ml-2 text-xs text-muted-foreground">(Auto-assigned)</span>}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={handleClinicChange}
        disabled={disabled || autoAssigned}
      >
        <SelectTrigger 
          id="clinic-selector" 
          className={cn("bg-background", autoAssigned && "opacity-90")}
        >
          <SelectValue placeholder="Select clinic" />
        </SelectTrigger>
        <SelectContent>
          {urlParam && <SelectItem value="all">All Clinics</SelectItem>}
          {clinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              {clinic.name}{clinic.location_name ? ` - ${clinic.location_name}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {description && (
        <FormDescription className="text-xs mt-1">
          {description}
        </FormDescription>
      )}
    </div>
  );
}

// Component for multi-clinic selection (used for staff)
function MultiClinicSelector({
  clinics,
  selectedClinicIds = [],
  onChange,
  label = "Clinics",
  description,
  disabled = false,
  autoAssigned = false,
  required = false,
  className
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedClinicIds);

  // Update internal state when props change
  useEffect(() => {
    setSelected(selectedClinicIds);
  }, [selectedClinicIds]);

  // Handle selecting a clinic
  const handleSelect = (clinicId: string) => {
    let updatedSelection: string[];
    
    if (selected.includes(clinicId)) {
      // Remove if already selected
      updatedSelection = selected.filter(id => id !== clinicId);
    } else {
      // Add if not already selected
      updatedSelection = [...selected, clinicId];
    }
    
    setSelected(updatedSelection);
    
    if (onChange) {
      onChange(updatedSelection);
    }
  };

  // Handle clearing all selections
  const handleClearAll = () => {
    setSelected([]);
    
    if (onChange) {
      onChange([]);
    }
  };

  // Get clinic name by ID for display
  const getClinicDisplayName = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    if (!clinic) return '';
    return clinic.location_name 
      ? `${clinic.name} - ${clinic.location_name}` 
      : clinic.name;
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="clinics-multiselect" className="text-foreground mb-2 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="clinics-multiselect"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-background",
              !selected.length && "text-muted-foreground"
            )}
          >
            {selected.length > 0 
              ? `${selected.length} clinic${selected.length > 1 ? 's' : ''} selected`
              : "Select clinics"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search clinics..." />
            <CommandEmpty>No clinic found.</CommandEmpty>
            
            <CommandGroup className="max-h-60">
              <ScrollArea className="h-[200px]">
                {clinics.map((clinic) => {
                  const isSelected = selected.includes(clinic.id);
                  return (
                    <CommandItem
                      key={clinic.id}
                      value={clinic.id}
                      onSelect={() => handleSelect(clinic.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>
                        {clinic.name}
                        {clinic.location_name && (
                          <span className="text-muted-foreground ml-2">
                            ({clinic.location_name})
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
            
            {selected.length > 0 && (
              <div className="flex items-center justify-between border-t p-2">
                <div className="flex flex-wrap gap-1 max-w-[85%]">
                  {selected.map((clinicId) => (
                    <Badge 
                      key={clinicId} 
                      variant="secondary"
                      className="flex items-center gap-1 max-w-full"
                    >
                      <span className="truncate">
                        {getClinicDisplayName(clinicId)}
                      </span>
                      <button
                        className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(clinicId);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {description && (
        <FormDescription className="text-xs mt-1">
          {description}
        </FormDescription>
      )}
    </div>
  );
}
