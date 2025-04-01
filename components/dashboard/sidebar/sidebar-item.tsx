'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NavItem } from '@/lib/constants/navigation';
import { buttonVariants } from '@/components/ui/button';
import React from 'react';

interface SidebarItemProps {
  item: NavItem;
  isCollapsed?: boolean;
}

export function SidebarItem({ item, isCollapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  
  // Memoize the rendered item to prevent unnecessary re-renders
  const renderedItem = React.useMemo(() => (
    <Link
      href={item.href}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'justify-start h-9 px-3 w-full relative',
        isCollapsed && 'justify-center px-0 w-10',
        isActive && 'bg-primary/10 text-primary font-medium'
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
      )}
      
      <Icon className={cn(
        'h-4 w-4 mr-2',
        isCollapsed && 'mr-0',
        isActive && 'text-primary'
      )} />
      
      {!isCollapsed && <span>{item.title}</span>}
      {!isCollapsed && item.badge && (
        <Badge 
          className="ml-auto" 
          variant={item.badge.variant} 
          aria-label={item.badge.content}
        >
          {item.badge.content}
        </Badge>
      )}
    </Link>
  ), [isActive, isCollapsed, item]);

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full flex justify-center relative">
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" />
              )}
              {renderedItem}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <Badge variant={item.badge.variant}>{item.badge.content}</Badge>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderedItem;
}
