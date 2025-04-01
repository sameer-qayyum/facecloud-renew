import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">FaceCloud</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-600 hover:text-primary">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-primary">
                  Australia's First Cosmetic Clinic Solution
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  FaceCloud is the only clinic management platform specifically designed for Australian cosmetic injectable clinics.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="px-8">
                  <Link href="/sign-up">Start Free Trial</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#demo">Watch Demo</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 rounded-lg overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-full h-full flex items-center justify-center">
                  <span className="text-primary font-semibold">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Built specifically for Australian cosmetic clinics
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Specialized Workflows</h3>
              <p className="text-sm text-gray-500 text-center">
                Tailored processes for cosmetic injectable clinics
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Transparent Pricing</h3>
              <p className="text-sm text-gray-500 text-center">
                Clear, predictable pricing for clinics of all sizes
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Australian Compliance</h3>
              <p className="text-sm text-gray-500 text-center">
                Built to meet Australian healthcare standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Ready to transform your clinic?
              </h2>
              <p className="max-w-[600px] text-white/80 md:text-xl">
                Join clinics across Australia that trust FaceCloud for their operations.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full bg-white text-primary hover:bg-white/90">
                <Link href="/sign-up">Start Your Free Trial</Link>
              </Button>
              <p className="text-xs text-white/60">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-white border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <p className="text-xs text-gray-500">
            2025 FaceCloud. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-gray-500 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-gray-500 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
