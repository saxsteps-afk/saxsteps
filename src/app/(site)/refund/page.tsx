import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy" updated="November 12, 2026">
      <p>
        We want you to enjoy learning the saxophone with {site.name}. If the course isn&apos;t right for you, you can get your
        money back.
      </p>

      <h2>{site.refundDays}-day money-back guarantee</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a> within {site.refundDays} days of your purchase, from the address
        you bought with or including your order number. We will refund the full amount — no questions asked.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the original payment method through our payment provider, Lemon Squeezy. Depending on your bank, it
        can take 5–10 business days to appear. Your access to the paid days ends when the refund is issued.
      </p>

      <h2>After {site.refundDays} days</h2>
      <p>
        Purchases older than {site.refundDays} days are not normally refundable, but if something went wrong, write to us anyway
        and we will do our best to help.
      </p>
    </LegalPage>
  );
}
