'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NewStaffForm } from '../components/new-staff-form';

// Client component that handles the form display and user interaction
export default function AddStaffContent({ initialClinics = [] }) {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('id');
  const isEditMode = !!staffId;
  
  // Ultra-fast title switching without page reload
  const pageTitle = isEditMode ? 'Edit Staff Member' : 'Add New Staff Member';
  const pageDescription = isEditMode 
    ? 'Edit staff member details and information'
    : 'Add a new staff member to your team and configure their details';
  
  // Set the document title for browser tab (ultra-fast)
  useEffect(() => {
    document.title = isEditMode 
      ? 'Edit Staff Member | FaceCloud' 
      : 'Add Staff Member | FaceCloud';
  }, [isEditMode]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Only show this if we're in the page route, not in the server component header */}
      {isEditMode && (
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      )}
      
      {isEditMode ? (
        <NewStaffForm staffId={staffId} initialClinics={initialClinics} />
      ) : (
        <NewStaffForm initialClinics={initialClinics} />
      )}
    </div>
  );
}
