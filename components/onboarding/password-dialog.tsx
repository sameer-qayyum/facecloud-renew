'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, Loader2, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PasswordSetupDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Ultra-fast check for onboard parameter
  useEffect(() => {
    const checkOnboarding = async () => {
      // Debug logs
      console.log('Checking onboarding status');
      
      // Convert searchParams to object in a TypeScript-compatible way
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      console.log('URL parameters:', params);
      console.log('onboard parameter:', searchParams.get('onboard'));
      
      // Setup Supabase auth listener for ultra-fast authentication
      if (searchParams.get('onboard') === 'true') {
        console.log('Onboard parameter detected! Setting up auth listener');
        
        const supabase = createClient();
        
        // First check if user is already authenticated
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Initial user authentication status:', !!user);
        
        if (user) {
          // User is already authenticated
          console.log('User is already authenticated:', user.email);
          handleAuthenticatedUser(user);
        } else {
          // Set up auth state listener for when magic link completes
          console.log('Setting up auth state listener');
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in through listener:', session.user.email);
              handleAuthenticatedUser(session.user);
              
              // Clean up subscription after user is authenticated
              subscription.unsubscribe();
            }
          });
        }
      }
    };
    
    // Helper function to handle authenticated user
    const handleAuthenticatedUser = (user: any) => {
      setUserInfo({
        email: user.email,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
      });
      
      // Force dialog to open
      console.log('Setting dialog to open state');
      setOpen(true);
      console.log('Dialog open state after setting:', true);
      
      // Remove the onboard parameter from URL without page reload (for cleaner UX)
      const url = new URL(window.location.href);
      url.searchParams.delete('onboard');
      window.history.replaceState({}, '', url);
    };
    
    checkOnboarding();
    
    // Clean up function
    return () => {
      console.log('Cleaning up onboarding check');
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        throw error;
      }
      
      // Success
      setOpen(false);
      // Force reload dashboard to ensure all authentication changes are applied
      router.refresh();
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If dialog is not open, don't render anything
  if (!open) return null;

  // Directly render the dialog overlay with fixed positioning for ultra-fast performance
  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking backdrop
      />
      
      {/* Modal dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Welcome to FaceCloud!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Please set a password to complete your account setup.
                </p>
              </div>
              {/* Disable closing for now */}
              <div className="opacity-20">
                <X className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {userInfo && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userInfo.email} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  'Set Password & Continue'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
