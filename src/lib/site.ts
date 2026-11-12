// Everything about the brand and the offer in one place.
// Price, refund window and trial days are business decisions: change them here.

export const site = {
  name: "SaxSteps",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://saxsteps.com").replace(/\/$/, ""),
  tagline: "Learn sax in 30 days. The music waits for you.",
  description:
    "A 30-day saxophone course for complete beginners. The app listens to your sax: play the right note and the band plays on.",
  email: "saxsteps@gmail.com",
  courseSlug: "saxsteps-30-days",
  totalDays: 30,
  /** Shown on the site; the real charge is set on the payment provider. Keep both in sync. */
  price: { label: "$29", note: "one-time payment · lifetime access" },
  refundDays: 14,
  /** Days anyone can try before buying (also mark them "free" in /admin). */
  freeDays: [1, 2, 3],
} as const;

export const PLAYER_PATH = "/learn";
export const LOGIN_PATH = "/login";

/** Only follow redirects inside this site (blocks ?next=https://evil.example). */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
