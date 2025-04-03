'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface FormFieldWrapperProps {
  children: React.ReactNode;
  error?: string;
}

/**
 * Optimized form field wrapper component
 * Memoized for better performance and consistent styling
 */
export const FormFieldWrapper = React.memo(function FormFieldWrapper({
  children,
  error
}: FormFieldWrapperProps) {
  return (
    <div className="space-y-2">
      {children}
      
      {error && (
        <Alert variant="destructive" className="py-2 px-3 mt-1">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
});
