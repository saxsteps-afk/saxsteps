import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Everything specific to Lemon Squeezy lives here. To switch to another
// provider (Paddle, Gumroad...), write the same three functions for it and
// change the imports in app/buy and app/api/webhooks.
//
// Setup (Lemon Squeezy dashboard):
//   - Product "SaxSteps" with one variant at the price shown in src/lib/site.ts
//   - Variant > Confirmation modal > button link: https://<site>/welcome
//   - Share > checkout link  -> LEMONSQUEEZY_CHECKOUT_URL
//   - Settings > Webhooks: URL https://<site>/api/webhooks/lemonsqueezy,
//     events order_created + order_refunded, signing secret -> LEMONSQUEEZY_WEBHOOK_SECRET

export const PROVIDER = "lemonsqueezy";

export function checkoutReady(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_CHECKOUT_URL);
}

/** The hosted checkout, prefilled with the buyer and carrying their user id back to the webhook. */
export function checkoutUrl(buyer: { userId: string; email: string; name?: string }): string {
  const url = new URL(process.env.LEMONSQUEEZY_CHECKOUT_URL!);
  url.searchParams.set("checkout[email]", buyer.email);
  if (buyer.name) url.searchParams.set("checkout[name]", buyer.name);
  url.searchParams.set("checkout[custom][user_id]", buyer.userId);
  return url.toString();
}

/** X-Signature = hex HMAC-SHA256 of the raw body with the webhook signing secret. */
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface OrderEvent {
  orderId: string;
  email: string;
  userId: string | null;
  amountCents: number;
  currency: string;
  status: "paid" | "refunded";
}

interface LsWebhook {
  meta?: { event_name?: string; custom_data?: { user_id?: unknown } };
  data?: {
    type?: string;
    id?: string;
    attributes?: { user_email?: string; total?: number; currency?: string; status?: string; refunded?: boolean };
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The order in a webhook, or null for events that don't change access. */
export function parseOrderEvent(body: unknown): OrderEvent | null {
  const w = body as LsWebhook;
  const event = w.meta?.event_name;
  const a = w.data?.attributes;
  if (w.data?.type !== "orders" || !w.data.id || !a?.user_email) return null;

  let status: OrderEvent["status"] | null = null;
  if (event === "order_refunded" || a.status === "refunded" || a.refunded) status = "refunded";
  else if (event === "order_created" && a.status === "paid") status = "paid";
  if (!status) return null;

  const userId = w.meta?.custom_data?.user_id;
  return {
    orderId: String(w.data.id),
    email: a.user_email,
    userId: typeof userId === "string" && UUID.test(userId) ? userId : null,
    amountCents: Number(a.total) || 0,
    currency: a.currency || "USD",
    status,
  };
}
