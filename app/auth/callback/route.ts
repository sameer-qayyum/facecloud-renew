import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After exchanging the code, redirect to our success page which handles client-side auth flow
  if (redirectTo) {
    return NextResponse.redirect(`${origin}/auth/success?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  // URL to redirect to after sign up process completes - goes through success page first
  return NextResponse.redirect(`${origin}/auth/success`);
}
