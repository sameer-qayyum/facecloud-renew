'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { mainNavItems, secondaryNavItems } from '@/lib/constants/navigation';
import { UserProfile } from '@/lib/types/user-profiles';
import { PanelLeft, PanelLeftClose, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  user?: UserProfile;
  defaultCollapsed?: boolean;
}

export function Sidebar({ user, defaultCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Handle resize events to determine if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // On mobile, ensure sidebar is not collapsed
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    // Initialize
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset mobile sheet open state when navigating
  useEffect(() => {
    // Intentionally left empty as we just want to track pathname changes
  }, [pathname]);

  // Create initials for avatar
  const getInitials = () => {
    if (!user) return 'FC';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
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
            userRole={user?.role}
            isCollapsed={isCollapsed}
            className="mb-6"
          />
          
          {/* Secondary/utility links */}
          <SidebarNav
            items={secondaryNavItems}
            title={isCollapsed ? undefined : "Configuration"}
            userRole={user?.role}
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
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile sidebar (sheet/drawer)
  const MobileSidebar = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
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
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
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
                userRole={user?.role}
                className="mb-6"
              />
              
              <Separator className="my-4" />
              
              {/* Secondary links */}
              <SidebarNav
                items={secondaryNavItems}
                title="Configuration"
                userRole={user?.role}
                className="mt-4"
              />
            </div>
          </ScrollArea>
          
          {/* Footer */}
          <div className="mt-auto border-t p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">&copy; 2025 FaceCloud</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
}
