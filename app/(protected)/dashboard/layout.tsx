'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardFooter } from '@/components/dashboard/footer';
import { Sidebar } from '@/components/dashboard/sidebar/sidebar';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types/user-profiles';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/app/theme/theme';
import CssBaseline from '@mui/material/CssBaseline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
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
        
        // Then fetch their profile data
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (profileData) {
          setUser(profileData as UserProfile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserProfile();
  }, [supabase]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Suspense fallback={<div className="w-[70px] md:w-[240px] border-r bg-sidebar-background" />}>
          <Sidebar user={user || undefined} />
        </Suspense>

        {/* Main content */}
        <div className="flex flex-col flex-1 h-screen overflow-hidden">
          <DashboardHeader user={user || undefined} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <DashboardFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}
