'use client';

import Link from 'next/link';


export function DashboardFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-4 px-6 bg-[#f8f8f8] border-t border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} FaceCloud. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link 
            href="/dashboard/help" 
            className="text-sm text-primary hover:text-primary/90 transition-colors"
          >
            Help
          </Link>
          <Link 
            href="/dashboard/privacy" 
            className="text-sm text-primary hover:text-primary/90 transition-colors"
          >
            Privacy
          </Link>
          <Link 
            href="/dashboard/terms" 
            className="text-sm text-primary hover:text-primary/90 transition-colors"
          >
            Terms
          </Link>
          <Link 
            href="https://facecloud.com.au" 
            className="text-sm text-primary hover:text-primary/90 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
