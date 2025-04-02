'use client';

import { useEffect, useState } from 'react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

// Define day keys as a type to ensure type safety
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Days of the week for the operating hours
const DAYS = [
  { key: 'monday' as DayKey, label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday' as DayKey, label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday' as DayKey, label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday' as DayKey, label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday' as DayKey, label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday' as DayKey, label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday' as DayKey, label: 'Sunday', shortLabel: 'Sun' }
] as const;

// Hours for the dropdown selections (24-hour format)
const HOURS = Array.from({ length: 24 }, (_, i) => 
  i.toString().padStart(2, '0') + ':00'
);

// Define operating hours for a specific day
const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().min(1, "Opening time is required").optional(),
  closeTime: z.string().min(1, "Closing time is required").optional(),
});

// Define the validation schema for operating hours
const operatingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
}).refine(
  (data) => {
    // Verify at least one day is open
    return Object.values(data).some(day => day.isOpen);
  },
  {
    message: "At least one day must be open",
    path: ["monday"], // This is just a hack to show the error somewhere
  }
).refine(
  (data) => {
    // Verify that all open days have valid times
    return Object.values(data).every(day => 
      !day.isOpen || (day.openTime && day.closeTime)
    );
  },
  {
    message: "All open days must have opening and closing times",
    path: ["monday"], // This is just a hack to show the error somewhere
  }
);

// Define the type based on the schema
type OperatingHoursFormValues = z.infer<typeof operatingHoursSchema>;

// Helper type for form field paths
type OperatingHoursFormPath = 
  | DayKey 
  | `${DayKey}.isOpen` 
  | `${DayKey}.openTime` 
  | `${DayKey}.closeTime`;

// Type for a single day's schedule
export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

// Type for all operating hours
export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface OperatingHoursStepProps {
  data: OperatingHours;
  onChange: (values: OperatingHours) => void;
}

export function OperatingHoursStep({ data, onChange }: OperatingHoursStepProps) {
  const [activeDay, setActiveDay] = useState<DayKey>('monday');
  
  // Create form with initial values
  const form = useForm<OperatingHoursFormValues>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: {
      monday: data.monday || { isOpen: false },
      tuesday: data.tuesday || { isOpen: false },
      wednesday: data.wednesday || { isOpen: false },
      thursday: data.thursday || { isOpen: false },
      friday: data.friday || { isOpen: false },
      saturday: data.saturday || { isOpen: false },
      sunday: data.sunday || { isOpen: false },
    },
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values) {
        onChange(values as OperatingHours);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  
  // Format hours for display
  const formatHour = (hour: string) => {
    const [hourPart, minutePart] = hour.split(':');
    const hourNum = parseInt(hourPart, 10);
    if (hourNum < 12) {
      return `${hourNum === 0 ? '12' : hourNum}:${minutePart} AM`;
    } else {
      return `${hourNum === 12 ? '12' : hourNum - 12}:${minutePart} PM`;
    }
  };

  // Handle day click
  const handleDayClick = (day: DayKey) => {
    setActiveDay(day);
  };

  // Set all weekdays (Mon-Fri) to the same hours
  const setWeekdayHours = (openTime: string, closeTime: string) => {
    const weekdays: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    weekdays.forEach(day => {
      form.setValue(`${day}.isOpen` as OperatingHoursFormPath, true);
      form.setValue(`${day}.openTime` as OperatingHoursFormPath, openTime);
      form.setValue(`${day}.closeTime` as OperatingHoursFormPath, closeTime);
    });
  };

  // Set weekend (Sat-Sun) to the same hours
  const setWeekendHours = (openTime: string, closeTime: string) => {
    const weekend: DayKey[] = ['saturday', 'sunday'];
    weekend.forEach(day => {
      form.setValue(`${day}.isOpen` as OperatingHoursFormPath, true);
      form.setValue(`${day}.openTime` as OperatingHoursFormPath, openTime);
      form.setValue(`${day}.closeTime` as OperatingHoursFormPath, closeTime);
    });
  };

  // Copy hours from one day to another
  const copyFromDay = (sourceDay: DayKey) => {
    const source = form.getValues(sourceDay as any);
    form.setValue(`${activeDay}.isOpen` as OperatingHoursFormPath, source.isOpen);
    form.setValue(`${activeDay}.openTime` as OperatingHoursFormPath, source.openTime);
    form.setValue(`${activeDay}.closeTime` as OperatingHoursFormPath, source.closeTime);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Operating Hours</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Set when this clinic is open for business.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Quick presets */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            Quick Hours Setup
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-blue-600 mb-1.5">Standard Hours (Mon-Fri)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWeekdayHours('09:00', '17:00')}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  9am-5pm
                </button>
                <button
                  type="button"
                  onClick={() => setWeekdayHours('08:00', '16:00')}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  8am-4pm
                </button>
                <button
                  type="button"
                  onClick={() => setWeekdayHours('10:00', '18:00')}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  10am-6pm
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-600 mb-1.5">Weekend Hours</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWeekendHours('10:00', '15:00')}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  10am-3pm
                </button>
                <button
                  type="button"
                  onClick={() => setWeekendHours('09:00', '12:00')}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  9am-12pm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('saturday.isOpen' as OperatingHoursFormPath, false);
                    form.setValue('sunday.isOpen' as OperatingHoursFormPath, false);
                  }}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Closed
                </button>
              </div>
            </div>
          </div>
        </div>
      
        {/* Day selection - horizontal tabs */}
        <div className="relative w-full">
          <ScrollArea className="w-full pb-2">
            <div className="flex gap-1 py-1 px-0.5">
              {DAYS.map((day) => {
                const isOpenValue = form.watch(`${day.key}.isOpen` as OperatingHoursFormPath);
                return (
                  <button
                    key={day.key}
                    type="button"
                    className={cn(
                      "flex-shrink-0 px-2 sm:px-4 py-2 text-[11px] sm:text-sm font-medium rounded-full transition-colors",
                      "min-w-[42px] sm:min-w-auto touch-manipulation",
                      activeDay === day.key
                        ? "bg-blue-600 text-white"
                        : isOpenValue
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    )}
                    onClick={() => handleDayClick(day.key)}
                  >
                    {day.shortLabel}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        <Form {...form}>
          {/* Hours settings - one panel shown at a time */}
          <div className="space-y-4">
            {DAYS.map((day) => (
              <div 
                key={day.key}
                className={`${activeDay === day.key ? 'block' : 'hidden'} bg-slate-50 p-3 sm:p-4 rounded-lg border`}
              >
                <div className="flex justify-between items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <h4 className="font-medium text-slate-700 mr-2">{day.label}</h4>
                    <div className="text-xs py-0.5 px-2 rounded-full bg-slate-200 text-slate-700">
                      {day.shortLabel}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name={`${day.key}.isOpen` as OperatingHoursFormPath}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className={cn(
                          "text-sm m-0",
                          field.value ? "text-green-600" : "text-red-600"
                        )}>
                          {field.value ? "Open" : "Closed"}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={checked => {
                              field.onChange(checked);
                              if (!checked) {
                                // Clear times when closed
                                form.setValue(`${day.key}.openTime` as OperatingHoursFormPath, undefined);
                                form.setValue(`${day.key}.closeTime` as OperatingHoursFormPath, undefined);
                              }
                            }}
                            className={cn(
                              field.value ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mb-4">
                  {day.key !== 'monday' && (
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
                      <div className="text-xs text-slate-500 mt-0.5">Copy hours from:</div>
                      <ScrollArea className="w-full sm:w-auto">
                        <div className="flex gap-1.5">
                          {DAYS.filter(d => d.key !== day.key).map(d => (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => copyFromDay(d.key)}
                              className="text-xs bg-white px-2 py-1 rounded-full border hover:bg-slate-100 transition-colors flex-shrink-0"
                            >
                              {d.shortLabel}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                
                {form.watch(`${day.key}.isOpen` as OperatingHoursFormPath) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`${day.key}.openTime` as OperatingHoursFormPath}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-700">Opens</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOURS.map((hour) => (
                                <SelectItem key={`${day.key}-open-${hour}`} value={hour}>
                                  {formatHour(hour)}
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
                      name={`${day.key}.closeTime` as OperatingHoursFormPath}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-700">Closes</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOURS.map((hour) => (
                                <SelectItem key={`${day.key}-close-${hour}`} value={hour}>
                                  {formatHour(hour)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {/* Global form error message */}
            {form.formState.errors.monday?.message && (
              <p className="text-sm text-red-500 mt-2">{form.formState.errors.monday.message}</p>
            )}
          </div>
        </Form>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-amber-700">
            <strong>Note:</strong> At least one day must be open and have valid operating hours. 
            You can quickly set standard hours using the presets above.
          </p>
        </div>
      </div>
    </div>
  );
}
