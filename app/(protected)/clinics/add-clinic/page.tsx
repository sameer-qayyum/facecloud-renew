'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { NewClinicForm } from '../components/new-clinic-form';
import { Loader2 } from 'lucide-react';

// Client component with search params
function AddEditClinicContent() {
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('id');
  const isEditMode = !!clinicId;
  
  // Ultra-fast title switching without page reload
  const pageTitle = isEditMode ? 'Edit Clinic' : 'Add New Clinic';
  const pageDescription = isEditMode 
    ? 'Edit your clinic details and information'
    : 'Add a new clinic to your network and configure its details';
  
  // Set the document title for browser tab (ultra-fast)
  useEffect(() => {
    document.title = isEditMode 
      ? 'Edit Clinic | FaceCloud' 
      : 'Add Clinic | FaceCloud';
  }, [isEditMode]);

  return (
    <div className="w-full px-2 sm:px-4 md:max-w-2xl mx-auto py-3 sm:py-4">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-2">{pageDescription}
        </p>
      </div>
      
      {clinicId ? (
        <NewClinicForm clinicId={clinicId} />
      ) : (
        <NewClinicForm />
      )}
    </div>
  );
}

// Wrap the client component with search params in Suspense
export default function AddEditClinicPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-2 sm:px-4 md:max-w-2xl mx-auto py-3 sm:py-4">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Loading Clinic Form</h1>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your form...</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    }>
      <AddEditClinicContent />
    </Suspense>
  );
}
