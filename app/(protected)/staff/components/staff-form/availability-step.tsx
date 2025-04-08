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
import { Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define day keys as a type to ensure type safety
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// Days of the week for staff availability
const DAYS = [
  { key: 'mon' as DayKey, label: 'Monday', shortLabel: 'Mon' },
  { key: 'tue' as DayKey, label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wed' as DayKey, label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thu' as DayKey, label: 'Thursday', shortLabel: 'Thu' },
  { key: 'fri' as DayKey, label: 'Friday', shortLabel: 'Fri' },
  { key: 'sat' as DayKey, label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sun' as DayKey, label: 'Sunday', shortLabel: 'Sun' }
] as const;

// Hours for the dropdown selections (30-minute intervals)
const HOURS = [];
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0');
  HOURS.push(`${hour}:00`);
  HOURS.push(`${hour}:30`);
}

// Define availability for a specific day
const dayScheduleSchema = z.object({
  isAvailable: z.boolean(),
  slots: z.array(z.object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required")
  })).min(1, "At least one time slot is required when available").optional()
});

// Define the validation schema for staff availability
const availabilitySchema = z.object({
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
  sun: dayScheduleSchema
}).refine(
  (data) => {
    // Verify that all available days have valid slots
    return Object.entries(data).every(([_, day]) => 
      !day.isAvailable || (day.slots && day.slots.length > 0)
    );
  },
  {
    message: "All available days must have at least one time slot",
    path: ["mon"], // This is just a hack to show the error somewhere
  }
);

// Define the type based on the schema
type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

// Helper type for form field paths
type AvailabilityFormPath = 
  | DayKey 
  | `${DayKey}.isAvailable` 
  | `${DayKey}.slots`;

// Type for a single time slot
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Type for a single day's schedule
export interface DaySchedule {
  isAvailable: boolean;
  slots?: TimeSlot[];
}

// Type for all availability
export interface StaffAvailability {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

interface AvailabilityStepProps {
  data: StaffAvailability;
  onChange: (values: StaffAvailability) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function AvailabilityStep({ data, onChange, onNext, onBack, isLoading }: AvailabilityStepProps) {
  const [activeDay, setActiveDay] = useState<DayKey>('mon');
  const [timeSlots, setTimeSlots] = useState<Record<DayKey, TimeSlot[]>>({
    mon: data.mon.slots || [],
    tue: data.tue.slots || [],
    wed: data.wed.slots || [],
    thu: data.thu.slots || [],
    fri: data.fri.slots || [],
    sat: data.sat.slots || [],
    sun: data.sun.slots || []
  });
  
  // Create form with initial values
  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      mon: data.mon || { isAvailable: false, slots: [] },
      tue: data.tue || { isAvailable: false, slots: [] },
      wed: data.wed || { isAvailable: false, slots: [] },
      thu: data.thu || { isAvailable: false, slots: [] },
      fri: data.fri || { isAvailable: false, slots: [] },
      sat: data.sat || { isAvailable: false, slots: [] },
      sun: data.sun || { isAvailable: false, slots: [] }
    },
  });
  
  // Set up form change handler
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values) {
        onChange(values as StaffAvailability);
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
  const setStandardHours = () => {
    const allDays: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const standardSlots = [{ startTime: '09:00', endTime: '17:00' }];
    
    allDays.forEach(day => {
      form.setValue(`${day}.isAvailable` as AvailabilityFormPath, true);
      form.setValue(`${day}.slots` as any, standardSlots);
      setTimeSlots(prev => ({
        ...prev,
        [day]: standardSlots
      }));
    });
  };

  // Add a new time slot for the active day
  const addTimeSlot = () => {
    const newSlot = { startTime: '09:00', endTime: '17:00' };
    const updatedSlots = [...timeSlots[activeDay], newSlot];
    
    setTimeSlots(prev => ({
      ...prev,
      [activeDay]: updatedSlots
    }));
    
    form.setValue(`${activeDay}.slots` as any, updatedSlots);
  };

  // Remove a time slot for the active day
  const removeTimeSlot = (index: number) => {
    const updatedSlots = [...timeSlots[activeDay]];
    updatedSlots.splice(index, 1);
    
    setTimeSlots(prev => ({
      ...prev,
      [activeDay]: updatedSlots
    }));
    
    form.setValue(`${activeDay}.slots` as any, updatedSlots);
  };

  // Update a time slot for the active day
  const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updatedSlots = [...timeSlots[activeDay]];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value
    };
    
    setTimeSlots(prev => ({
      ...prev,
      [activeDay]: updatedSlots
    }));
    
    form.setValue(`${activeDay}.slots` as any, updatedSlots);
  };

  // Copy availability from one day to another
  const copyFromDay = (sourceDay: DayKey) => {
    const source = form.getValues(sourceDay as any);
    form.setValue(`${activeDay}.isAvailable` as AvailabilityFormPath, source.isAvailable);
    form.setValue(`${activeDay}.slots` as any, source.slots ? [...source.slots] : []);
    
    setTimeSlots(prev => ({
      ...prev,
      [activeDay]: source.slots ? [...source.slots] : []
    }));
  };

  // Get active day slots
  const activeDaySlots = timeSlots[activeDay] || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium">Staff Availability</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Set when this staff member is available to work.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Quick presets */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
            <Info className="h-4 w-4 mr-1.5" />
            Quick Setup
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              className="h-7 text-xs bg-white"
              onClick={setStandardHours}
            >
              Set Standard Hours (9AM-5PM)
            </Button>
          </div>
        </div>

        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day selector */}
            <div className="bg-muted/30 rounded-lg border p-3 h-fit">
              <h4 className="text-sm font-medium mb-2">Days</h4>
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const isActive = activeDay === day.key;
                  const formValues = form.getValues();
                  const isAvailable = formValues[day.key]?.isAvailable;
                  
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => handleDayClick(day.key)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md text-sm",
                        isActive && "bg-primary text-primary-foreground",
                        !isActive && isAvailable && "bg-primary/10",
                        !isActive && !isAvailable && "text-muted-foreground"
                      )}
                    >
                      <span>{day.label}</span>
                      {isAvailable && !isActive && (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Copy from day */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Copy From</h4>
                <Select
                  onValueChange={(value) => copyFromDay(value as DayKey)}
                  disabled={!activeDay}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.key} value={day.key} disabled={day.key === activeDay}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Day configuration */}
            <div className="bg-white rounded-lg border p-3 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">{DAYS.find(d => d.key === activeDay)?.label || 'Day'} Schedule</h4>
                <FormField
                  control={form.control}
                  name={`${activeDay}.isAvailable` as const}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormLabel className="text-xs">Available</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch(`${activeDay}.isAvailable`) && (
                <div className="space-y-3">
                  <ScrollArea className={cn(
                    "h-auto max-h-60 overflow-auto pr-3",
                    activeDaySlots.length > 3 && "h-60"
                  )}>
                    {activeDaySlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Select
                          value={slot.startTime}
                          onValueChange={(value) => updateTimeSlot(index, 'startTime', value)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((hour) => (
                              <SelectItem key={`start-${hour}`} value={hour}>
                                {formatHour(hour)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs">to</span>
                        <Select
                          value={slot.endTime}
                          onValueChange={(value) => updateTimeSlot(index, 'endTime', value)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((hour) => (
                              <SelectItem key={`end-${hour}`} value={hour}>
                                {formatHour(hour)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => removeTimeSlot(index)}
                          disabled={activeDaySlots.length <= 1}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addTimeSlot}
                  >
                    + Add Time Slot
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            // Validate before proceeding
            form.trigger().then((isValid) => {
              if (isValid) onNext();
            });
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
