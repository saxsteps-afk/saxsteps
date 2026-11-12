"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LOGIN_PATH } from "@/lib/site";

// Checked in the browser (the session cookie, no network call) so that the
// landing page itself stays static and is served from the CDN.
export function HeaderAuthLink() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);
  return (
    <Link
      href={signedIn ? "/account" : LOGIN_PATH}
      className="rounded-full border border-brass/60 px-4 py-2 text-sm font-semibold text-brass hover:bg-brass hover:text-ink"
    >
      {signedIn ? "My course" : "Sign in"}
    </Link>
  );
}
