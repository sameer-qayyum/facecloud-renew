'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Verifying your authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Log params in a TypeScript-friendly way
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
        console.log('Auth callback params:', params);
        
        // Check if we have a redirect URL from the magic link
        let redirectUrl = searchParams.get('redirectTo');
        
        // If no redirectUrl is provided, default to dashboard with onboard parameter
        if (!redirectUrl) {
          redirectUrl = window.location.origin + '/?onboard=true';
        } else if (!redirectUrl.includes('onboard=true')) {
          // Make sure onboard=true is in the redirectUrl for new staff
          redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + 'onboard=true';
        }
        
        console.log('Will redirect to:', redirectUrl);
        
        // Process the OTP verification
        if (searchParams.has('token_hash')) {
          const tokenHash = searchParams.get('token_hash');
          const type = searchParams.get('type') || 'magiclink';
          
          console.log('Processing auth token:', { tokenHash, type });
          
          // CRITICAL STEP 1: Verify the OTP token first
          try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash!,
              type: type === 'invite' ? 'magiclink' : type as any
            });
            
            if (verifyError) {
              console.error('Token verification error:', verifyError);
              setError(`Authentication failed: ${verifyError.message}`);
              return;
            }
            
            console.log('OTP verification successful:', !!data?.session);
            
            // CRITICAL STEP 2: Explicitly set the session if available
            if (data?.session) {
              console.log('Setting session explicitly');
              await supabase.auth.setSession(data.session);
              
              // CRITICAL STEP 3: Verify the session was set
              const { data: sessionData } = await supabase.auth.getSession();
              console.log('Session active after explicit set:', !!sessionData.session);
              
              // CRITICAL STEP 4: Load the user to verify authentication
              const { data: userData } = await supabase.auth.getUser();
              console.log('User authenticated:', !!userData.user);
              
              if (userData.user) {
                console.log('Authentication confirmed, redirecting to:', redirectUrl);
                
                // CRITICAL STEP 5: Store session in localStorage for extra persistence
                if (typeof window !== 'undefined') {
                  // Save session info to localStorage to ensure it persists
                  localStorage.setItem('supabase.auth.token', JSON.stringify({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: Date.now() + (data.session.expires_in * 1000)
                  }));
                  console.log('Session saved to localStorage');
                }
                
                // CRITICAL STEP 6: Use window.location for hard redirect to ensure session persists
                window.location.href = redirectUrl;
                return;
              } else {
                setError('Authentication succeeded but user session was not established.');
                return;
              }
            } else {
              setError('Authentication verification completed but no session was returned.');
              return;
            }
          } catch (err) {
            console.error('OTP verification error:', err);
            setError('Authentication verification failed');
            return;
          }
        } else {
          setError('Invalid authentication link. Missing required parameters.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred during authentication.');
      }
    };
    
    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {!error ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h1 className="text-xl font-semibold">{message}</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we complete your authentication...
              </p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">!</span>
              </div>
              <h1 className="text-xl font-semibold">Authentication Failed</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
