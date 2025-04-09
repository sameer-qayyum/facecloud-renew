import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll();
          } catch (error) {
            console.error("Error accessing cookies:", error);
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                // Enforce consistent cookie options for better session handling
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
              });
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.error("Cookie set error (safe to ignore in server components):", error);
          }
        },
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true
      }
    },
  );
};
