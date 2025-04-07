'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UsersIcon, CreditCardIcon, PieChartIcon } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

// Client component with search params
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ultra-fast authentication check for onboarding
  useEffect(() => {
    const checkUrlAndSetSession = async () => {
      // Check for hash fragment from magic link redirect (#access_token=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        console.log('Found hash fragment, attempting to extract tokens');
        
        try {
          // Extract the part after the '#'
          const fragment = window.location.hash.substring(1);
          
          // Convert the fragment into an object
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          
          console.log('Extracted tokens:', { 
            hasAccessToken: !!access_token, 
            hasRefreshToken: !!refresh_token 
          });
          
          if (typeof access_token === 'string' && typeof refresh_token === 'string') {
            // Create Supabase client
            const supabase = createClient();
            
            console.log('Setting session manually with extracted tokens');
            
            // Set up listener first
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              console.log('Auth state changed after manual setting:', event);
            });
            
            // Manually set the session using extracted tokens
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('Session set successfully:', !!data.session);
              
              // Clean up hash fragment from URL to avoid exposure of tokens
              window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname + (searchParams.get('onboard') ? '?onboard=true' : '')
              );
              
              // Clean up subscription
              subscription.unsubscribe();
              
              // Force refresh to ensure we have the latest auth state
              window.location.reload();
            }
          }
        } catch (err) {
          console.error('Error parsing hash fragment:', err);
        }
      }
    };
    
    // Check URL hash first
    checkUrlAndSetSession();
    
    // Then check for onboard parameter
    if (searchParams.get('onboard') === 'true') {
      console.log('Dashboard detected onboard=true parameter');
      
      // Check for token parameter
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') || 'magiclink';
      
      console.log('Token parameters found:', { 
        hasToken: !!token, 
        hasTokenHash: !!tokenHash, 
        type 
      });
      
      // Force authentication check directly on dashboard page
      const checkAuthentication = async () => {
        const supabase = createClient();
        
        // First try to authenticate with token if present
        if (tokenHash) {
          console.log('Attempting to verify token_hash');
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type === 'invite' ? 'magiclink' : type as any
            });
            
            console.log('Token verification result:', { 
              success: !error, 
              hasSession: !!data?.session
            });
            
            if (data?.session) {
              console.log('Session established from token');
              // Session is set, refresh the page to remove token parameters
              window.history.replaceState({}, '', window.location.pathname + '?onboard=true');
              return;
            }
          } catch (err) {
            console.error('Token verification error:', err);
          }
        }
        
        // Check if user is already authenticated
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Dashboard auth check result:', !!user);
        
        if (user) {
          console.log('Dashboard confirmed authenticated user:', user.email);
          // Authentication is confirmed - the dialog will be shown via the component
        } else {
          console.log('Dashboard detected unauthenticated user with onboard=true');
          // User is not authenticated but has onboard=true - may need special handling
        }
      };
      
      checkAuthentication();
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">346</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">4 upcoming in next hour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$13,248</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Treatment Completion</CardTitle>
            <PieChartIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>
              Today's patient schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {`${String.fromCharCode(64 + i)}${String.fromCharCode(64 + i)}`}
                    </div>
                    <div>
                      <p className="font-medium">Patient {i}</p>
                      <p className="text-sm text-muted-foreground">Anti-wrinkle Treatment</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{`${10 + i}:00 AM`}</p>
                    <p className="text-xs text-muted-foreground">45 min</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Appointments</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Popular Treatments</CardTitle>
            <CardDescription>
              Most requested procedures this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Anti-wrinkle Injections", percent: 38 },
                { name: "Dermal Fillers", percent: 28 },
                { name: "Skin Treatments", percent: 18 },
                { name: "Lip Enhancement", percent: 16 },
              ].map((treatment, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{treatment.name}</p>
                    <p className="text-sm text-muted-foreground">{treatment.percent}%</p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${treatment.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Treatments</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Wrap the client component with search params in Suspense
function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

export default DashboardPage;
