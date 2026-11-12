import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 12, 2026">
      <p>
        This policy explains what {site.name} collects when you use {site.url.replace(/^https?:\/\//, "")} and the {site.name}{" "}
        practice app, and what we do with it. In short: we collect only what we need to run your course, and we never sell it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your email address and the name you give us (or that Google shares when you sign in
          with Google).
        </li>
        <li>
          <strong>Your progress:</strong> which pieces you have played, your best score, stars and number of attempts, so you can
          continue on any device.
        </li>
        <li>
          <strong>Your purchase:</strong> the order number, amount, currency and email from our payment provider. We never see or
          store your card details.
        </li>
      </ul>

      <h2>Your microphone</h2>
      <p>
        The practice app uses your microphone only while you are playing, to hear which note you play. The sound is analysed on
        your own device, in your browser. It is never recorded, stored or sent to us or anyone else.
      </p>

      <h2>Who helps us run the service</h2>
      <ul>
        <li>Supabase — stores accounts and progress.</li>
        <li>Vercel — hosts the website.</li>
        <li>Lemon Squeezy — handles checkout, payment and taxes as our merchant of record.</li>
        <li>Google — only if you choose “Continue with Google”.</li>
      </ul>
      <p>They process your data only to provide their service to us.</p>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in. The practice app also saves your settings (such as which saxophone
        you play) in your browser. We do not use advertising or tracking cookies.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us for a copy of your data, to correct it, or to delete your account and everything linked to it. Email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> from the address of your account and we will reply within 30 days.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date above, and tell you by email if the change is significant.</p>
    </LegalPage>
  );
}
