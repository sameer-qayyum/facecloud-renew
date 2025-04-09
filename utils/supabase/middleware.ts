import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return request.cookies.getAll();
            } catch (error) {
              console.error("Error accessing cookies in middleware:", error);
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Set cookies on the request
                request.cookies.set(name, value);
                
                // Recreate the response to include new cookies
                response = NextResponse.next({
                  request: {
                    headers: request.headers,
                  },
                });
                
                // Set cookies on the response with consistent options
                response.cookies.set(name, value, {
                  ...options,
                  path: "/",
                  sameSite: "lax",
                  secure: process.env.NODE_ENV === "production"
                });
              });
            } catch (error) {
              console.error("Error setting cookies in middleware:", error);
            }
          },
        },
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getSession();

    // protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && !request.cookies.get('sb-auth-token')) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (request.nextUrl.pathname === "/" && request.cookies.get('sb-auth-token')) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    return response;
  } catch (e) {
    // If an error is thrown, return the original request
    console.error("Middleware error:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
