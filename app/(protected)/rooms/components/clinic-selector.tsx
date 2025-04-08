'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
  const currentClinicId = searchParams.get('clinic_id') || 'all';
  
  const [selectedClinic, setSelectedClinic] = useState<string>(currentClinicId);
  
  useEffect(() => {
    // Update the URL when the clinic selection changes
    if (selectedClinic === 'all') {
      router.push('/rooms');
    } else {
      router.push(`/rooms?clinic_id=${selectedClinic}`);
    }
  }, [selectedClinic, router]);
  
  return (
    <div className="flex items-center space-x-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="clinic-selector">Filter by Clinic</Label>
        <Select
          value={selectedClinic}
          onValueChange={setSelectedClinic}
        >
          <SelectTrigger className="w-[240px]" id="clinic-selector">
            <SelectValue placeholder="Select a clinic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
