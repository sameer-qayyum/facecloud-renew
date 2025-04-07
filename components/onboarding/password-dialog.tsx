'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, Loader2, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Component that uses search params
function PasswordSetupDialogContent() {
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
      
      console.log('Search params:', params);
      
      if (params.onboard === 'true') {
        // Show password setup dialog for onboarding flow
        setOpen(true);
        
        // Get current user for verification
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        
        if (user) {
          setUserInfo(user);
        } else {
          console.error('No user found in session');
          setError('Authentication error. Please try logging in again.');
        }
      }
    };
    
    checkOnboarding();
  }, [searchParams, router]);
  
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get active Supabase session
      const supabase = createClient();
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      // Password set successfully
      
      // Clean up URL by removing onboard parameter (for better UX)
      const params = new URLSearchParams(searchParams.toString());
      params.delete('onboard');
      
      // Redirect to dashboard with clean URL
      const dashboardUrl = params.toString() 
        ? `/dashboard?${params.toString()}`
        : '/dashboard';
      
      // Ultra-fast redirect without page reload
      router.push(dashboardUrl, { scroll: false });
      
      // Close dialog
      setOpen(false);
      
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
        {/* Close button - only show if not first-time onboarding */}
        {!searchParams.get('onboard') && (
          <button 
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        )}
        
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Set Your Password</h2>
            <p className="text-muted-foreground mt-1">
              Create a secure password for your FaceCloud account
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Set a secure password"
                  required
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                "Set Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense boundary for Next.js 15 optimization
export default function PasswordSetupDialog() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto mt-2" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    }>
      <PasswordSetupDialogContent />
    </Suspense>
  );
}
