'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * AuthInitializer - Client component that handles authentication state
 * and redirects based on auth status
 */
export function AuthInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && pathname === '/sign-in') {
        router.push('/protected/dashboard');
      }
      
      if (event === 'SIGNED_OUT' && pathname.startsWith('/protected')) {
        router.push('/sign-in');
      }
      
      setIsInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, pathname]);

  return null; // This component doesn't render anything
}
