'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  // Ultra-fast authentication check
  useEffect(() => {
    const initAuth = async () => {
      try {
        setMessage('Checking your authentication...');
        const supabase = createClient();
        
        // First check: Do we have a setup_key parameter? (from our custom invitation link)
        const setupKey = searchParams.get('setup_key');
        if (setupKey) {
          try {
            // Decode email from setup_key
            const decodedEmail = Buffer.from(setupKey, 'base64').toString();
            console.log('Setup key found with email:', decodedEmail);
            setEmail(decodedEmail);
            
            // Try to look up user in Supabase
            const { data: userData, error: userError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('email', decodedEmail)
              .single();
              
            if (userData) {
              console.log('Found user profile for email:', decodedEmail);
              setUserInfo({
                email: decodedEmail,
                firstName: userData.first_name || '',
                lastName: userData.last_name || '',
                role: userData.role || ''
              });
              setAuthenticating(false);
              return; // Skip other auth methods if we have user info
            } else {
              console.log('No user profile found, but have valid setup key');
              // Continue to token check, don't return yet
            }
          } catch (decodeError) {
            console.error('Failed to decode setup key:', decodeError);
            // Continue to other auth methods
          }
        }
        
        // Second check: Handle URL tokens if present (direct from magic link)
        if (searchParams.has('token_hash')) {
          setMessage('Processing your magic link...');
          console.log('Processing magic link token');
          
          // Get token parameters
          const tokenHash = searchParams.get('token_hash');
          const type = searchParams.get('type') || 'magiclink';
          
          try {
            // Verify the OTP token directly
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash!,
              type: type === 'invite' ? 'magiclink' : type as any,
            });
            console.log('verifyOtp result:', data);
            
            if (error) {
              console.error('Magic link verification failed:', error);
              // If we have email from setup_key, don't fail completely
              if (email) {
                console.log('Using email from setup_key instead');
                setAuthenticating(false);
                return;
              }
              
              setError(`Authentication failed: ${error.message}`);
              setAuthenticating(false);
              return;
            }

            // Set the session
            if (data?.session) {
              console.log('Setting session from magic link');
              await supabase.auth.setSession(data.session);
            }
            
            console.log('Token verified successfully');
          } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            // If we have email from setup_key, don't fail completely
            if (email) {
              console.log('Using email from setup_key instead');
              setAuthenticating(false);
              return;
            }
            
            setError('Failed to process magic link. Please try again.');
            setAuthenticating(false);
            return;
          }
        } else if (!email) {
          // No token and no setup_key
          console.error('No token_hash or setup_key found in URL');
          setError('Invalid invitation link. Please check your email and try again.');
          setAuthenticating(false);
          return;
        }
        
        // Third check: Get user from session - only if we don't already have email from setup_key
        if (!email) {
          // Check current session (with small delay to ensure auth is complete)
          setTimeout(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              // User is authenticated - show password setup form
              console.log('User authenticated from session:', user.email);
              setUserInfo({
                email: user.email,
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                role: user.user_metadata?.role || ''
              });
              setAuthenticating(false);
            } else {
              // No user session and no setup_key - redirect to home
              console.error('No authenticated user found');
              setError('Your session has expired. Please use the magic link again.');
              router.push('/');
            }
          }, 800);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('An error occurred during authentication.');
        setAuthenticating(false);
      }
    };

    initAuth();
  }, [router, searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
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
    
    const supabase = createClient();
    
    try {
      // If we have email from setup_key but no session, sign in first
      if (email && !(await supabase.auth.getUser()).data.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: 'temporary-password-for-setup' // This will fail, but that's OK
        });
        
        console.log('Attempted sign in with email', email);
        
        // Now use admin API to force set the password
        // In a real implementation, this would be a server action
        const response = await fetch('/api/set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to set password');
        }
        
        // Try to sign in with the new password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          throw error;
        }
      } else {
        // Normal password update for authenticated user
        const { error } = await supabase.auth.updateUser({
          password
        });
        
        if (error) {
          throw error;
        }
      }
      
      // Success - redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Password update error:', error);
      setError('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {authenticating ? (
          <Card>
            <CardHeader>
              <CardTitle>Setting up your account</CardTitle>
              <CardDescription>
                {message || 'Please wait while we verify your invitation...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : userInfo ? (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Complete your registration</CardTitle>
                <CardDescription>
                  Welcome {userInfo.firstName || userInfo.email}! Please set a password to complete your account setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={userInfo.email || email} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
                <div className="space-y-1">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Set Password & Continue'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                We couldn't verify your invitation. Please check your email and try the link again.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push('/')} className="w-full">
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
