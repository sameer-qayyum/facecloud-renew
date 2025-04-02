'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NewClinicForm } from '../components/new-clinic-form';

export default function AddEditClinicPage() {
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
        <p className="text-sm text-muted-foreground">
          {pageDescription}
        </p>
      </div>
      
      {isEditMode ? (
        <NewClinicForm clinicId={clinicId} />
      ) : (
        <NewClinicForm />
      )}
    </div>
  );
}
