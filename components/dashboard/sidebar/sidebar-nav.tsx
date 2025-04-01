'use client';

import { cn } from '@/lib/utils';
import { NavItem, getNavItemsByRole } from '@/lib/constants/navigation';
import { SidebarItem } from './sidebar-item';
import { Separator } from '@/components/ui/separator';
import { UserRole } from '@/lib/types/user-profiles';

interface SidebarNavProps {
  items: NavItem[];
  title?: string;
  userRole?: UserRole | null;
  isCollapsed?: boolean;
  className?: string;
}

export function SidebarNav({
  items,
  title,
  userRole,
  isCollapsed = false,
  className,
}: SidebarNavProps) {
  // Filter items based on user role
  const filteredItems = userRole ? getNavItemsByRole(items, userRole) : items;

  if (!filteredItems.length) {
    return null;
  }

  return (
    <div className={className}>
      {title && !isCollapsed && (
        <h4 className="mb-1 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
          {title}
        </h4>
      )}
      {title && isCollapsed && <Separator className="mb-4" />}
      <nav className={cn('flex flex-col gap-1', isCollapsed && 'items-center')}>
        {filteredItems.map((item) => (
          <SidebarItem key={item.title} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
    </div>
  );
}
