import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/site";

// Email confirmation links and Google sign-in come back here with ?code=...
// (PKCE flow of @supabase/ssr): swap the code for a session, then go on.
// This address must be listed in Supabase > Authentication > URL Configuration > Redirect URLs.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // paid before having an account? attach those purchases now
      await supabase.rpc("claim_orders");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
