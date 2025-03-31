import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Performance metrics tracking
const PERFORMANCE_METRICS_ENABLED = process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  // Start timing the middleware execution
  const startTime = performance.now();
  
  // Add performance-related headers
  const response = await updateSession(request);
  
  // Add cache control headers for static assets
  const url = request.nextUrl.pathname;
  if (url.includes('/_next/') || url.includes('/images/') || url.match(/\.(jpg|jpeg|png|webp|avif|gif|ico|svg)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add security headers for better performance and security
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable preloading of critical resources
  if (url === '/' || url === '/sign-in' || url === '/sign-up') {
    response.headers.set('Link', '</images/common/brand/png/Facecloud-Logo-Horizontal-RGB.png>; rel=preload; as=image');
  }
  
  // Add Server-Timing header in non-production environments for debugging
  if (!PERFORMANCE_METRICS_ENABLED) {
    const endTime = performance.now();
    response.headers.set('Server-Timing', `middleware;dur=${endTime - startTime}`);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
