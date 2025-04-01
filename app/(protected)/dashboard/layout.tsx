'use client';

import { Suspense } from 'react';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is now a simple passthrough layout that just wraps the children
  // The sidebar, header, and footer are handled by the parent protected layout
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded w-full"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
