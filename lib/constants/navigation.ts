import { UserRole } from '@/lib/types/user-profiles';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Stethoscope,
  CircleDollarSign,
  PackageOpen,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: {
    content: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  children?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin'],
  },
  {
    title: 'Clinics',
    href: '/clinics',
    icon: Building2,
    roles: ['owner', 'manager'],
    children: [
      {
        title: 'All Clinics',
        href: '/clinics',
        icon: Building2,
        roles: ['owner', 'manager'],
      },
      {
        title: 'Rooms',
        href: '/rooms',
        icon: Building2,
        roles: ['owner', 'manager'],
      },
      {
        title: 'Equipment',
        href: '/equipment',
        icon: PackageOpen,
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin'],
    badge: {
      content: 'New',
      variant: 'default',
    },
  },
  {
    title: 'Services',
    href: '/services',
    icon: CircleDollarSign,
    roles: ['owner', 'manager'],
  },
  {
    title: 'Staff',
    href: '/staff',
    icon: Users,
    roles: ['owner', 'manager'],
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: User,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist'],
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: PackageOpen,
    roles: ['owner', 'manager', 'admin'],
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin'],
  },
  {
    title: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin'],
  },
  {
    title: 'Sign Out',
    href: '/sign-out',
    icon: LogOut,
    roles: ['owner', 'manager', 'doctor', 'nurse', 'therapist', 'admin'],
  },
];

/**
 * Filter navigation items based on user role
 */
export function getNavItemsByRole(items: NavItem[], role?: UserRole | null): NavItem[] {
  if (!role) return [];
  return items.filter((item) => item.roles.includes(role));
}
