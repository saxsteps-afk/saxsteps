"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/site";

const INPUT = "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brass";

type Mode = "signin" | "signup";

/** Pages outside the Next router (the practice app, the checkout redirect) need a full page load. */
function go(router: ReturnType<typeof useRouter>, to: string) {
  if (to.startsWith("/learn") || to.startsWith("/buy")) window.location.assign(to);
  else {
    router.push(to);
    router.refresh();
  }
}

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    params.get("error") ? { ok: false, text: "That sign-in link has expired or is invalid. Please sign in again." } : null,
  );

  async function google() {
    setPending(true);
    setMessage(null);
    // signInWithOAuth leaves the page; if Google is not enabled yet the user would land on a JSON error
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      });
      const s = (await r.json()) as { external?: { google?: boolean } };
      if (!s.external?.google) {
        setPending(false);
        setMessage({ ok: false, text: "Google sign-in is not available yet. Please use your email." });
        return;
      }
    } catch {
      // could not check: try anyway
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setPending(false);
      setMessage({ ok: false, text: error.message });
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get("email")?.toString().trim() ?? "";
    const password = data.get("password")?.toString() ?? "";
    const fullName = data.get("full_name")?.toString().trim() ?? "";
    setPending(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPending(false);
        setMessage({
          ok: false,
          text: /confirm/i.test(error.message) ? "Please confirm your email first. Check your inbox." : "Wrong email or password.",
        });
        return;
      }
      await supabase.rpc("claim_orders");
      go(router, next);
      return;
    }

    const { data: signUp, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: fullName },
      },
    });
    setPending(false);
    if (error) {
      setMessage({
        ok: false,
        text: /already|registered/i.test(error.message)
          ? "There is already an account with this email. Please sign in."
          : /password/i.test(error.message)
            ? "Your password needs at least 6 characters."
            : error.message,
      });
      return;
    }
    if (signUp.session) {
      go(router, next);
      return;
    }
    setMessage({ ok: true, text: `We sent a confirmation link to ${email}. Open it to activate your account.` });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "signin" ? "Sign in to continue your 30 days." : "Your progress is saved to your account, on every device."}
      </p>

      <button
        type="button"
        onClick={google}
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-ink/40 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
      <p className="my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        or with email
      </p>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-semibold">
            Name
            <input name="full_name" required autoComplete="name" maxLength={60} className={INPUT} />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Email
          <input name="email" type="email" required autoComplete="email" className={INPUT} />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={INPUT}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream hover:bg-ink-3 disabled:opacity-60"
        >
          {pending ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        {message && (
          <p aria-live="polite" className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "signin" ? "New to SaxSteps? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="font-semibold text-brass-deep underline"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
