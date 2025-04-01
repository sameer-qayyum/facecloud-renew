'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, ChevronRight } from 'lucide-react';
import { UserProfile } from '@/lib/types/user-profiles';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  user?: UserProfile;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  
  // Function to get breadcrumb segments from the path
  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: 'Dashboard', href: '/dashboard' }];
    
    // Split the path and create breadcrumbs
    const segments = pathname.split('/').filter(Boolean);
    
    // Build breadcrumbs with href for each level
    return segments.map((segment, index) => {
      // Build the href for this segment
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      
      // Format the label (capitalize first letter, replace hyphens with spaces)
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  // Create initials from user name if available
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  };

  // Get user full name
  const getUserFullName = () => {
    if (!user) return 'User';
    return `${user.first_name} ${user.last_name}`;
  };

  // Determine role display
  const getUserRole = () => {
    if (!user) return '';
    // Format the role with "Dr" prefix for doctors
    if (user.role === 'doctor') return `Dr ${user.last_name}`;
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <header className="w-full py-3 px-6 flex flex-col bg-[#f8f8f8] border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 md:hidden">
            <Image 
              src="/images/common/brand/svg/Facecloud-Mark-RGB.svg"
              alt="FaceCloud"
              width={24}
              height={24}
              priority
            />
            <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 hidden md:block">{pageTitle}</h1>
          
          {/* Breadcrumbs navigation */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />}
                  <Link 
                    href={crumb.href} 
                    className={cn(
                      "text-xs hover:text-primary transition-colors",
                      i === breadcrumbs.length - 1 
                        ? "font-medium text-primary" 
                        : "text-gray-500"
                    )}
                  >
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Search"
              className="w-[300px] pl-10 bg-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profile_picture} alt={getUserFullName()} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">{getUserRole()}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getUserFullName()}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
