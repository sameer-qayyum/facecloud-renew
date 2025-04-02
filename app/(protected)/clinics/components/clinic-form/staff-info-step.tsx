'use client';

import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface StaffInfoStepProps {
  addStaff: boolean;
  onToggleAddStaff: (value: boolean) => void;
}

export function StaffInfoStep({ addStaff, onToggleAddStaff }: StaffInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Staff Management</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Do you want to add staff to this clinic after creation?
        </p>
      </div>
      
      <div className="flex items-center space-x-3 p-4 border rounded-md">
        <Switch
          id="add-staff"
          checked={addStaff}
          onCheckedChange={onToggleAddStaff}
        />
        <Label htmlFor="add-staff" className="flex flex-col gap-1 cursor-pointer">
          <span>Add staff after clinic creation</span>
          <span className="text-sm text-muted-foreground">
            You'll be prompted to invite staff after the clinic is created
          </span>
        </Label>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Roles Available</CardTitle>
          <CardDescription>
            Once your clinic is created, you can assign these roles to staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="font-medium">Doctor</div>
            <div className="text-sm text-muted-foreground">Full clinical access</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="font-medium">Nurse</div>
            <div className="text-sm text-muted-foreground">Manage patient care</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="font-medium">Therapist</div>
            <div className="text-sm text-muted-foreground">Specialist treatments</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="font-medium">Manager</div>
            <div className="text-sm text-muted-foreground">Administrative control</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="font-medium">Admin</div>
            <div className="text-sm text-muted-foreground">Scheduling & bookings</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
