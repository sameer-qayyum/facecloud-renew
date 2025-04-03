'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import theme from '@/app/theme/theme';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Use Inter font with subsets pre-loaded for maximum performance
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Optimize font loading
});

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  return (
    <div className={cn(
      'min-h-screen bg-background font-sans antialiased',
      inter.variable
    )}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-card">
            <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold">FaceCloud</h1>
                  <p className="text-xs text-muted-foreground">Staff Onboarding</p>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 container py-10">
            {children}
          </main>
          
          <footer className="border-t py-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} FaceCloud. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </div>
  );
}
