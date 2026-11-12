import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 12, 2026">
      <p>
        These terms apply when you use {site.name}: the website, the practice app and the 30-day course. By creating an account
        or buying the course you agree to them.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your sign-in details to yourself. Your purchase is for you personally: please don&apos;t share your account or the
        course material with others.
      </p>

      <h2>What you get</h2>
      <p>
        Buying the course gives you personal, non-transferable access to all its lessons for as long as we offer the service.
        Some days can be tried for free before buying. We may improve or update lessons over time.
      </p>

      <h2>Payment</h2>
      <p>
        Checkout is handled by Lemon Squeezy, our reseller and merchant of record, which also handles sales tax and VAT. The
        price is shown before you pay. Refunds are covered by our <Link href="/refund">Refund Policy</Link>.
      </p>

      <h2>Course content</h2>
      <p>
        The songs in the course are in the public domain. Our arrangements, backing tracks, lesson texts, videos and the app
        itself belong to {site.name}; you may use them for your own practice but not copy, resell or publish them.
      </p>

      <h2>Playing safely</h2>
      <p>
        Take breaks, and stop if you feel pain or dizziness. The course is general music instruction and is not a substitute for
        a teacher who can see you play.
      </p>

      <h2>Liability</h2>
      <p>
        We work hard to keep {site.name} running, but we provide it “as is” and can&apos;t promise it will always be available or
        free of errors. To the extent the law allows, our total liability to you is limited to the amount you paid for the
        course.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms; the date above shows the latest version. Questions? Email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
