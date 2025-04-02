import { NewClinicForm } from '../components/new-clinic-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Clinic | FaceCloud',
  description: 'Add a new clinic to your FaceCloud network',
};

export default function AddClinicPage() {
  return (
    <div className="w-full px-2 sm:px-4 md:max-w-2xl mx-auto py-3 sm:py-4">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Add New Clinic</h1>
        <p className="text-sm text-muted-foreground">
          Add a new clinic to your network and configure its details
        </p>
      </div>
      
      <NewClinicForm />
    </div>
  );
}
