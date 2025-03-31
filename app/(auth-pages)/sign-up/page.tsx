import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { SmtpMessage } from "../smtp-message";
import { Suspense } from "react";

// Prefetch the sign-in page for faster navigation
const prefetchSignIn = () => {
  return (
    <>
      <link rel="prefetch" href="/sign-in" as="document" />
    </>
  );
};

// Optimized background component to reduce layout shifts
const BackgroundImage = () => {
  return (
    <div className="hidden lg:block lg:w-[384px] relative overflow-hidden">
      <Image
        src="/images/login/login1.jpg"
        alt="Facecloud Login"
        fill
        sizes="384px"
        priority
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAIxAAAQMDBAMBAAAAAAAAAAAAAQIDBQAEBgcREiExQVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAUG/8QAHBEAAQQDAQAAAAAAAAAAAAAAAQACAxEEBRIh/9oADAMBAAIRAxEAPwCVZNqHHMVtLrILy5ZZbSVLcUwQEgdknb1XzXqLrRnGpWQOXGU5HdXqnDuKWVBDafxKQAB+VZOtmXXOQ6o3jNq6pFtbIFvxJ7KiSVH+kn9qPNLcRYwvGGLdKEuPrAcecA7Uo9D8HQ/a5/Ixn5MxYOgA9JVIxmRjTcjnXJP/2Q=="
        style={{ objectFit: 'cover' }}
        className="brightness-[0.4] filter"
      />
      <div className="absolute inset-0 bg-[#305893] bg-opacity-40 flex flex-col items-start justify-center p-12">
        <h2 className="text-[42px] leading-tight font-bold text-white opacity-90">Welcome<br/>to<br/>Facecloud</h2>
        <p className="text-xl text-white opacity-90 max-w-md mt-4">
          Your complete solution for clinic management and patient care.
        </p>
      </div>
    </div>
  );
};

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      {prefetchSignIn()}
      <div className="flex min-h-screen">
        {/* Left side - Background */}
        <Suspense fallback={<div className="hidden lg:block lg:w-[384px] bg-[#B8C7D9]" />}>
          <BackgroundImage />
        </Suspense>
        
        {/* Right side - Sign Up Form */}
        <div className="w-full lg:flex-1 flex justify-center">
          <div className="w-full max-w-[360px] py-12 px-5">
            {/* Logo */}
            <div className="mb-6">
              <Image
                src="/images/common/brand/png/Facecloud-Logo-Horizontal-RGB.png"
                alt="Facecloud Logo"
                width={150}
                height={40}
                priority
              />
            </div>
            
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">Create Your Account</h1>
              <p className="text-gray-600 text-sm mt-1">
                Join Facecloud to manage your clinic efficiently
              </p>
            </div>
            
            {/* Form */}
            <form className="space-y-5">
              {/* First Name + Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <Label htmlFor="firstName" className="text-xs text-gray-700 font-medium">
                      First Name
                    </Label>
                  </div>
                  <Input 
                    name="firstName" 
                    id="firstName"
                    placeholder="John" 
                    required 
                    className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <Label htmlFor="lastName" className="text-xs text-gray-700 font-medium">
                      Last Name
                    </Label>
                  </div>
                  <Input 
                    name="lastName" 
                    id="lastName"
                    placeholder="Doe" 
                    required 
                    className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20" 
                  />
                </div>
              </div>
              
              {/* Mobile Number */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <Label htmlFor="mobileNumber" className="text-xs text-gray-700 font-medium">
                    Mobile Number
                  </Label>
                </div>
                <Input 
                  name="mobileNumber" 
                  id="mobileNumber"
                  placeholder="+61 400 000 000" 
                  required 
                  className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20" 
                />
              </div>
              
              {/* Company Name */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  <Label htmlFor="companyName" className="text-xs text-gray-700 font-medium">
                    Company Name
                  </Label>
                </div>
                <Input 
                  name="companyName" 
                  id="companyName"
                  placeholder="Your Company" 
                  required 
                  className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20" 
                />
              </div>
              
              {/* Email */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                  <Label htmlFor="email" className="text-xs text-gray-700 font-medium">
                    Email Address
                  </Label>
                </div>
                <Input 
                  name="email" 
                  id="email"
                  type="email"
                  placeholder="you@example.com" 
                  required 
                  className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20" 
                />
              </div>
              
              {/* Password */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="text-[#2986E2]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <Label htmlFor="password" className="text-xs text-gray-700 font-medium">
                    Password
                  </Label>
                </div>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Create a secure password"
                  minLength={6}
                  required
                  className="w-full h-9 text-sm rounded border-gray-200 focus:border-[#2986E2] focus:ring focus:ring-[#2986E2] focus:ring-opacity-20"
                />
                <p className="text-[10px] text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>
              
              {/* Submit Button */}
              <SubmitButton 
                formAction={signUpAction} 
                pendingText="Creating your account..." 
                className="w-full py-2.5 bg-[#305893] hover:bg-[#264673] text-white font-medium rounded text-sm transition-colors mt-2"
              >
                Create Account
              </SubmitButton>
              
              {/* Form Message */}
              <FormMessage message={searchParams} />
              
              {/* Sign In Link */}
              <div className="text-center mt-4">
                <p className="text-gray-600 text-xs">
                  Already have an account?{" "}
                  <Link 
                    className="text-[#2986E2] font-medium hover:underline" 
                    href="/sign-in"
                    prefetch={true}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <SmtpMessage />
    </>
  );
}
