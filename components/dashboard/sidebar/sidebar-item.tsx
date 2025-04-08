'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NavItem } from '@/lib/constants/navigation';
import { buttonVariants } from '@/components/ui/button';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SidebarItemProps {
  item: NavItem;
  isCollapsed?: boolean;
  depth?: number;
}

export function SidebarItem({ item, isCollapsed = false, depth = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const [isOpen, setIsOpen] = useState(isActive);
  
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children?.some(
    child => pathname === child.href || pathname?.startsWith(`${child.href}/`)
  );
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Memoize all rendering logic regardless of condition
  const collapsedItemWithChildren = React.useMemo(() => {
    // Early safety check
    if (!item.children || item.children.length === 0) return null;
    
    return (
      <Popover>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <div className="w-full flex justify-center relative">
                  {(isActive || isChildActive) && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" />
                  )}
                  <button
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'justify-center px-0 w-10',
                      (isActive || isChildActive) && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <Icon className={cn(
                      'h-4 w-4',
                      (isActive || isChildActive) && 'text-primary'
                    )} />
                  </button>
                </div>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.title}
              {item.badge && (
                <Badge variant={item.badge.variant}>{item.badge.content}</Badge>
              )}
              <span className="ml-1 text-xs text-muted-foreground">(+{item.children.length})</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent side="right" className="p-0 w-40 ml-1">
          <div className="p-1 flex flex-col gap-1">
            {item.children.map((child) => (
              <Link
                key={child.title}
                href={child.href}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'justify-start h-9',
                  pathname === child.href && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                <span>{child.title}</span>
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }, [isActive, isChildActive, item, pathname]);

  const collapsedItemWithoutChildren = React.useMemo(() => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full flex justify-center relative">
            {(isActive || isChildActive) && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" />
            )}
            <Link
              href={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'justify-center px-0 w-10',
                (isActive || isChildActive) && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                (isActive || isChildActive) && 'text-primary'
              )} />
            </Link>
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
  ), [isActive, isChildActive, item]);
  
  const expandedItem = React.useMemo(() => (
    <div className="w-full">
      {hasChildren ? (
        <button
          onClick={toggleOpen}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'justify-start h-9 px-3 w-full relative',
            (isActive || isChildActive) && 'bg-primary/10 text-primary font-medium'
          )}
        >
          {/* Active indicator bar */}
          {(isActive || isChildActive) && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
          )}
          
          <Icon className={cn(
            'h-4 w-4 mr-2',
            (isActive || isChildActive) && 'text-primary'
          )} />
          
          <span className="flex-grow text-left">{item.title}</span>
          {hasChildren && (
            <div className="ml-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          
          {item.badge && (
            <Badge 
              className="ml-auto" 
              variant={item.badge.variant} 
              aria-label={item.badge.content}
            >
              {item.badge.content}
            </Badge>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'justify-start h-9 px-3 w-full relative',
            isActive && 'bg-primary/10 text-primary font-medium',
            depth > 0 && 'pl-8' // Indent child items
          )}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
          )}
          
          <Icon className={cn(
            'h-4 w-4 mr-2',
            isActive && 'text-primary'
          )} />
          
          <span>{item.title}</span>
          {item.badge && (
            <Badge 
              className="ml-auto" 
              variant={item.badge.variant} 
              aria-label={item.badge.content}
            >
              {item.badge.content}
            </Badge>
          )}
        </Link>
      )}
      
      {/* Render children */}
      {hasChildren && isOpen && (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pl-4"
          >
            {item.children?.map((child) => (
              <SidebarItem 
                key={child.title} 
                item={child} 
                isCollapsed={false} 
                depth={depth + 1}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  ), [isActive, item, isOpen, isChildActive, depth, hasChildren, toggleOpen]);

  // Render based on conditions AFTER all hooks are defined
  if (isCollapsed && hasChildren) {
    return collapsedItemWithChildren;
  }
  
  if (isCollapsed) {
    return collapsedItemWithoutChildren;
  }

  return expandedItem;
}
