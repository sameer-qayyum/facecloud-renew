'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

interface FormActionsProps {
  isLoading?: boolean;
  isSaved?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  backRoute?: string;
  backLabel?: string;
  showBackButton?: boolean;
  sticky?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Reusable form actions component
 * Provides consistent button styling and behavior for forms
 */
export function FormActions({
  isLoading = false,
  isSaved = false,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  backRoute,
  backLabel = 'Back',
  showBackButton = false,
  sticky = true,
  className,
  children
}: FormActionsProps) {
  return (
    <div className={cn(
      "flex justify-end gap-3 pt-2 pb-4",
      sticky ? "sticky bottom-0 bg-background border-t mt-4 sm:static sm:border-0 sm:bg-transparent sm:mt-2" : "mt-6",
      className
    )}>
      {showBackButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mr-auto flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={onCancel}
          disabled={isLoading}
        >
          <ArrowLeft size={16} />
          <span>{backLabel}</span>
        </Button>
      )}
      
      {children}
      
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      
      {onSubmit && (
        <Button 
          type="submit" 
          onClick={onSubmit}
          disabled={isLoading || isSaved}
          className={cn(
            "min-w-[120px]",
            isSaved ? "bg-green-600 hover:bg-green-700" : ""
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : isSaved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            submitLabel
          )}
        </Button>
      )}
    </div>
  );
}
