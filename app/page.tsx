'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Client component with search params extraction
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState('');

  // Enhanced magic link handler - direct auth check + onboarding redirection
  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();
      
      // If this is from a magic link invitation, process it
      if (searchParams.has('token_hash') && searchParams.has('type')) {
        setIsRedirecting(true);
        setMessage('Processing your invitation...');
        
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('Magic link detected:', { tokenHash, type });

        try {
          // First, verify the OTP token from the magic link
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash!,
            type: type === 'invite' ? 'magiclink' : type as any,
          });
          
          if (verifyError) {
            console.error('Verification error:', verifyError);
            setMessage('Authentication error: ' + verifyError.message);
            return;
          }
          
          // Check if user needs to set a password (new invitation)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && !user.last_sign_in_at) {
            // New user who needs to complete onboarding
            setMessage('Redirecting to account setup...');
            router.push('/dashboard?onboard=true');
          } else {
            // Existing user, just go to dashboard
            setMessage('Authentication successful! Redirecting...');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          setMessage('An unexpected error occurred');
        }
      } else if (searchParams.get('onboard') === 'true') {
        // Handle direct onboard flow from magic link
        setIsRedirecting(true);
        setMessage('Preparing your account setup...');
        
        // This should redirect to the dashboard which will show the onboarding dialog
        router.push('/dashboard?onboard=true');
      } else {
        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsRedirecting(true);
          setMessage('Already logged in! Redirecting...');
          router.push('/dashboard');
        }
      }
    };
    
    handleAuth();
  }, [router, searchParams]);

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-700">{message || 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero section */}
      <div className="container flex flex-col items-center justify-center px-4 py-16 mx-auto mt-10 text-center md:px-8 lg:py-32">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10"></div>
        
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-800 md:text-5xl lg:text-6xl">
          Streamlined Patient Management for Healthcare Professionals
        </h1>
        
        <p className="max-w-xl mt-6 text-lg text-gray-600">
          FaceCloud helps healthcare providers manage patient records, appointments, and communications more efficiently.
        </p>
        
        <div className="flex flex-col gap-4 mt-10 sm:flex-row">
          <Button 
            size="lg" 
            onClick={() => router.push('/sign-in')}
            className="h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => router.push('/sign-up')}
            className="h-12 text-lg bg-white hover:bg-gray-100"
          >
            Register Your Practice
          </Button>
        </div>
      </div>

      {/* Features section */}
      <div className="container px-4 py-16 mx-auto md:px-8 lg:py-24">
        <h2 className="text-3xl font-bold text-center text-gray-800 md:text-4xl">
          Powerful Healthcare Management Features
        </h2>
        
        <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Patient Management</h3>
            <p className="text-gray-600">Efficiently manage patient records, history, and demographics in a secure environment.</p>
          </div>
          
          {/* Feature 2 */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Appointment Scheduling</h3>
            <p className="text-gray-600">Intuitive scheduling system to manage appointments and minimize no-shows.</p>
          </div>
          
          {/* Feature 3 */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Secure Messaging</h3>
            <p className="text-gray-600">HIPAA-compliant messaging system for staff and patient communication.</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container px-4 py-16 mx-auto md:px-8 lg:py-24 bg-gray-50">
        <h2 className="text-3xl font-bold text-center text-gray-800 md:text-4xl">
          Trusted by Healthcare Professionals
        </h2>
        
        <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2">
          {/* Testimonial 1 */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 mr-4 overflow-hidden bg-gray-300 rounded-full">
                <Image src="/images/testimonial/doctor-1.jpg" alt="Dr. Sarah Johnson" width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Dr. Sarah Johnson</h4>
                <p className="text-sm text-gray-600">Family Medicine</p>
              </div>
            </div>
            <p className="text-gray-600">
              "FaceCloud has transformed our practice's efficiency. Patient records are now easily accessible, and the scheduling system has reduced our no-show rate significantly."
            </p>
          </div>
          
          {/* Testimonial 2 */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 mr-4 overflow-hidden bg-gray-300 rounded-full">
                <Image src="/images/testimonial/admin-1.jpg" alt="Michael Chen" width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Michael Chen</h4>
                <p className="text-sm text-gray-600">Practice Administrator</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The analytics and reporting features have given us valuable insights into our practice's performance. We've been able to optimize staffing and improve patient satisfaction."
            </p>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="container px-4 py-16 mx-auto text-center md:px-8 lg:py-32">
        <h2 className="max-w-4xl mx-auto text-3xl font-bold text-gray-800 md:text-4xl">
          Ready to improve your healthcare practice?
        </h2>
        
        <p className="max-w-xl mx-auto mt-6 text-lg text-gray-600">
          Join thousands of healthcare professionals who trust FaceCloud for their practice management needs.
        </p>
        
        <Button 
          size="lg" 
          onClick={() => router.push('/register')}
          className="h-12 mt-10 text-lg bg-blue-600 hover:bg-blue-700"
        >
          Get Started Today
        </Button>
      </div>

      {/* Footer */}
      <footer className="py-12 mt-auto bg-gray-800">
        <div className="container px-4 mx-auto md:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="text-xl font-bold text-white">FaceCloud</h3>
              <p className="mt-2 text-gray-400">Healthcare management simplified</p>
            </div>
            
            <div className="flex gap-8">
              <Link href="/privacy" className="text-gray-300 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>
          
          <div className="pt-8 mt-8 text-center text-gray-400 border-t border-gray-700">
            <p>&copy; {new Date().getFullYear()} FaceCloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Wrap the client component with search params in Suspense
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
