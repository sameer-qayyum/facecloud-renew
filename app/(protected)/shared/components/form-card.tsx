'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

/**
 * Reusable form card component 
 * Provides consistent styling for form sections across the application
 */
export function FormCard({
  title,
  description,
  children,
  className,
  contentClassName,
  headerClassName
}: FormCardProps) {
  return (
    <Card className={cn("shadow-sm border-muted", className)}>
      {(title || description) && (
        <CardHeader className={cn("bg-card/50 pb-6", headerClassName)}>
          {title && <CardTitle className="text-lg text-primary">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("p-4 sm:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
