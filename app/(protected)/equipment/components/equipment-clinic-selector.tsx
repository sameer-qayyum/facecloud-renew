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
  location_name?: string | null;
}

interface EquipmentClinicSelectorProps {
  clinics: Clinic[];
}

export function EquipmentClinicSelector({ clinics }: EquipmentClinicSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentClinicId = searchParams.get('clinic_id') || 'all';
  
  const [selectedClinic, setSelectedClinic] = useState<string>(currentClinicId);
  
  useEffect(() => {
    // Update the URL when the clinic selection changes
    // IMPORTANT: Use /equipment route explicitly to prevent redirection
    if (selectedClinic === 'all') {
      router.push('/equipment');
    } else {
      router.push(`/equipment?clinic_id=${selectedClinic}`);
    }
  }, [selectedClinic, router]);
  
  return (
    <div className="flex items-center space-x-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="equipment-clinic-selector">Filter by Clinic</Label>
        <Select
          value={selectedClinic}
          onValueChange={setSelectedClinic}
        >
          <SelectTrigger className="w-[240px]" id="equipment-clinic-selector">
            <SelectValue placeholder="Select a clinic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}{clinic.location_name ? ` - ${clinic.location_name}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
