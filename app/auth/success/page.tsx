'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Client component with search params
function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      try {
        // Get important params from the URL 
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') || 'recovery';
        
        // Optional redirect - defaults to dashboard
        const redirectUrl = searchParams.get('redirectUrl') || '/dashboard';
        
        if (tokenHash) {
          try {
            // Verify OTP token from magic link
            const { data, error: verifyErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as any,
            });
            
            if (verifyErr) throw verifyErr;
            
            // Check if user needs to set a password (first login)
            if (data.user && !data.user.last_sign_in_at) {
              // Add onboard flag for first-time users
              router.push(`${redirectUrl}?onboard=true`);
            } else {
              // Not a first login, just redirect to the target URL
              router.push(redirectUrl);
            }
          } catch (verifyErr: any) {
            console.error('OTP verification error:', verifyErr);
            setError(`Failed to verify your authentication: ${verifyErr.message}`);
          }
        } else {
          console.log('No token hash found, assuming fallback redirect');
          // If there's no token hash but we were redirected here,
          // just forward to the dashboard
          router.push(redirectUrl);
        }
      } catch (err: any) {
        console.error('Callback handling error:', err);
        setError(`Authentication error: ${err.message}`);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {error ? (
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Authentication Error</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Processing Authentication</h2>
          <p className="text-gray-600">Please wait while we verify your credentials...</p>
        </div>
      )}
    </div>
  );
}

// Wrap the client component with search params in Suspense
export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Loading Authentication</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
