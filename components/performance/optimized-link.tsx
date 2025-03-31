'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useCallback } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

/**
 * OptimizedLink component for faster navigation
 * - Prefetches links that are likely to be clicked
 * - Uses instant navigation when possible
 * - Preloads data for faster rendering
 */
export default function OptimizedLink({
  href,
  children,
  className,
  prefetch = true,
  onClick,
}: OptimizedLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Prefetch important routes on component mount
  useEffect(() => {
    if (prefetch) {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);
  
  // Handle click with optimized navigation
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle internal links
    if (href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      
      // Execute any onClick handler
      if (onClick) {
        onClick();
      }
      
      // Navigate to the new route
      router.push(href);
    }
  }, [href, onClick, router]);
  
  // Determine if this is the active link
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
