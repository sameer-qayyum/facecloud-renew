import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-8">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to FaceCloud
        </h1>
        <h2 className="text-2xl text-muted-foreground mb-8">
          The first clinic management platform specifically designed for Australian cosmetic injectable clinics
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-6xl p-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <div className="rounded-full bg-primary/10 p-4 mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Specialized Workflows</h3>
          <p className="text-muted-foreground">Designed specifically for Australian cosmetic injectable clinics</p>
        </div>
        
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <div className="rounded-full bg-primary/10 p-4 mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Transparent Pricing</h3>
          <p className="text-muted-foreground">Clear, predictable pricing for clinics of all sizes</p>
        </div>
        
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <div className="rounded-full bg-primary/10 p-4 mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Seamless Scalability</h3>
          <p className="text-muted-foreground">Grows with your clinic from startup to multi-location</p>
        </div>
      </div>
    </div>
  );
}
