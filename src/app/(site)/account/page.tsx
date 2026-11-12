import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { getLearnerState } from "@/lib/learner";
import { LOGIN_PATH, PLAYER_PATH, site } from "@/lib/site";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My course", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const user = await getUser();
  if (!user) redirect(`${LOGIN_PATH}?next=${encodeURIComponent("/account")}`);
  const s = await getLearnerState(user);
  const total = site.totalDays;
  const pct = Math.round((100 * s.daysDone) / total);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="text-sm text-muted">Signed in as {user.email}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">My course</h1>

      {checkout === "unavailable" && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Checkout is not open yet. Please try again later, or email{" "}
          <a className="underline" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          .
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-3xl bg-ink text-cream shadow-lg">
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brass">SaxSteps · 30 days</p>
          {s.hasAccess ? (
            <>
              <p className="mt-3 text-2xl font-extrabold">
                {s.daysDone === 0 ? "Ready for Day 1" : `${s.daysDone} of ${total} days done`}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
              </div>
              <a href={PLAYER_PATH} className="mt-6 inline-block rounded-full bg-brass px-6 py-3 font-bold text-ink hover:bg-brass-soft">
                {s.daysDone === 0 ? "Start Day 1" : "Continue"}
              </a>
              {s.isAdmin && <p className="mt-3 text-xs text-muted-dark">You are an admin: every day is open to you.</p>}
            </>
          ) : (
            <>
              <p className="mt-3 text-2xl font-extrabold">Unlock all 30 days</p>
              <p className="mt-2 text-muted-dark">
                Days {site.freeDays.join(", ")} are free to try. The full course is {site.price.label}, {site.price.note}.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/buy" className="rounded-full bg-brass px-6 py-3 font-bold text-ink hover:bg-brass-soft">
                  Get SaxSteps · {site.price.label}
                </a>
                <a href={PLAYER_PATH} className="rounded-full border border-white/25 px-6 py-3 font-semibold hover:border-brass hover:text-brass">
                  Try the free days
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <p>
          Bought it with another email?{" "}
          <a className="font-semibold text-brass-deep underline" href={`mailto:${site.email}?subject=SaxSteps%20access`}>
            Contact us
          </a>
        </p>
        <div className="flex items-center gap-4">
          {s.isAdmin && (
            <Link href="/admin" className="font-semibold text-brass-deep underline">
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
