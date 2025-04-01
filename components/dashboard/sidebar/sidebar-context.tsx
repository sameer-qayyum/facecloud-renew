'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileMenu: () => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export function SidebarProvider({ 
  defaultCollapsed = false, 
  children 
}: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const pathname = usePathname();

  // Reset the mobile sidebar state when path changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      // On mobile, ensure sidebar is not collapsed
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsOpen(prev => !prev);
  };

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider 
      value={{ 
        isOpen, 
        setIsOpen,
        isCollapsed,
        setIsCollapsed,
        toggleMobileMenu,
        toggleCollapsed
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
