'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Menu } from 'lucide-react';
import { UserProfile } from '@/lib/types/user-profiles';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar/sidebar-context';

interface DashboardHeaderProps {
  user?: UserProfile;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { toggleMobileMenu } = useSidebar();
  
  // Function to get page title and href from the path
  const getPageInfo = () => {
    if (!pathname) return { title: 'Dashboard', href: '/dashboard' };
    
    // Split the path and get the last segment
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (!lastSegment) return { title: 'Dashboard', href: '/dashboard' };
    
    // Format the title (capitalize first letter, replace hyphens with spaces)
    const title = lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return { title, href: pathname };
  };

  const { title, href } = getPageInfo();

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
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-3 h-11 w-11 touch-manipulation"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-8 w-8" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2 md:hidden">
              <Image 
                src="/images/common/brand/svg/Facecloud-Mark-RGB.svg"
                alt="FaceCloud"
                width={24}
                height={24}
                priority
              />
              <Link href={href} className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors">
                {title}
              </Link>
            </div>
            
            <Link 
              href={href}
              className="text-2xl font-semibold text-gray-900 hover:text-primary transition-colors hidden md:block"
            >
              {title}
            </Link>
          </div>
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
