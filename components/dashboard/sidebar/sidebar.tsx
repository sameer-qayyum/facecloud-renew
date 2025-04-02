'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { mainNavItems, secondaryNavItems } from '@/lib/constants/navigation';
import { UserProfile, StaffMember, UserRole } from '@/lib/types/user-profiles';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from './sidebar-context';

interface SidebarProps {
  user?: UserProfile & { 
    staff?: StaffMember[];
    companyOwner?: boolean;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const { isOpen, setIsOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  // Handle resize events to determine if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initialize
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create initials for avatar
  const getInitials = () => {
    if (!user) return 'FC';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  };

  // Get user's primary role (first role in their staff records or null)
  const getPrimaryRole = (): UserRole | null => {
    if (!user?.staff || user.staff.length === 0) return null;
    return user.staff[0].role;
  };

  // Desktop sidebar
  const DesktopSidebar = (
    <div
      className={cn(
        'hidden md:flex h-screen flex-col border-r bg-sidebar-background text-sidebar-foreground',
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      )}
      data-collapsed={isCollapsed}
    >
      {/* Header with logo/branding */}
      <div className={cn(
        'flex h-16 items-center border-b px-4',
        isCollapsed ? 'justify-center flex-col' : 'justify-between'
      )}>
        <div className="flex items-center">
          {isCollapsed ? (
            <div className="flex items-center justify-center">
              <Image 
                src="/images/common/brand/svg/Facecloud-Mark-RGB.svg"
                alt="FaceCloud"
                width={36}
                height={36}
                className="transition-opacity"
                priority
              />
            </div>
          ) : (
            <div className="flex items-center">
              <Image 
                src="/images/common/brand/svg/Facecloud-Mark-RGB.svg"
                alt="FaceCloud"
                width={32}
                height={32}
                className="mr-2"
                priority
              />
              <span className="font-bold text-xl text-primary tracking-tight">FaceCloud</span>
            </div>
          )}
        </div>
        
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 mt-2"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable navigation area */}
      <ScrollArea className="flex-1 py-4">
        <div className={cn('px-4', isCollapsed && 'px-2')}>
          {/* Main navigation */}
          <SidebarNav
            items={mainNavItems}
            userRole={getPrimaryRole()}
            isCollapsed={isCollapsed}
            className="mb-6"
          />
          
          {/* Secondary/utility links */}
          <SidebarNav
            items={secondaryNavItems}
            title={isCollapsed ? undefined : "Configuration"}
            userRole={getPrimaryRole()}
            isCollapsed={isCollapsed}
            className="mt-6"
          />
        </div>
      </ScrollArea>

      {/* User profile section */}
      <div className={cn(
        'mt-auto p-4 border-t flex items-center',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.first_name} {user?.last_name}</span>
              <span className="text-xs text-muted-foreground capitalize">{getPrimaryRole()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile sidebar (sheet/drawer)
  const MobileSidebar = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        side="left" 
        className="w-[300px] p-0 border-r shadow-lg transition-transform duration-300 ease-in-out"
      >
        <div className="flex h-full flex-col">
          {/* Header with branding */}
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center">
              <Image 
                src="/images/common/brand/svg/Facecloud-Mark-RGB.svg"
                alt="FaceCloud"
                width={32}
                height={32}
                className="mr-2"
                priority
              />
              <span className="font-bold text-xl text-primary tracking-tight">FaceCloud</span>
              {/* Hidden title for accessibility */}
              <SheetTitle className="sr-only">FaceCloud Navigation</SheetTitle>
            </div>
          </div>
          
          {/* User profile */}
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.first_name} {user?.last_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{getPrimaryRole()}</span>
              </div>
            </div>
          </div>

          {/* Scrollable navigation area */}
          <ScrollArea className="flex-1 py-4">
            <div className="px-4">
              {/* Main navigation */}
              <SidebarNav
                items={mainNavItems}
                title="Main"
                userRole={getPrimaryRole()}
                className="mb-6"
              />
              
              <Separator className="my-4" />
              
              {/* Secondary links */}
              <SidebarNav
                items={secondaryNavItems}
                title="Configuration"
                userRole={getPrimaryRole()}
                className="mb-6"
              />
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {DesktopSidebar}
      {isMobile && MobileSidebar}
    </>
  );
}
