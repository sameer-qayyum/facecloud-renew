'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardFooter } from '@/components/dashboard/footer';
import { Sidebar } from '@/components/dashboard/sidebar/sidebar';
import { SidebarProvider } from '@/components/dashboard/sidebar/sidebar-context';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types/user-profiles';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/app/theme/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Fetch the current user's profile data
    async function loadUserProfile() {
      try {
        setLoading(true);
        
        // First get the current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setLoading(false);
          return;
        }
        
        // Then fetch the user's profile from our profiles table
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (userProfile) {
          setUser(userProfile as UserProfile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserProfile();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserProfile();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader user={user} />
            <main className="flex-1 overflow-y-auto p-6 bg-background">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-[250px]" />
                  <Skeleton className="h-[200px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-[160px] w-full" />
                    <Skeleton className="h-[160px] w-full" />
                    <Skeleton className="h-[160px] w-full" />
                  </div>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-64 bg-muted rounded w-full"></div>
                  </div>
                }>
                  {children}
                </Suspense>
              )}
            </main>
            <DashboardFooter />
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  );
}
