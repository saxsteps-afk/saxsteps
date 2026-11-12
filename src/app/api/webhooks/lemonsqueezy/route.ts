import { NextResponse, type NextRequest } from "next/server";
import { PROVIDER, parseOrderEvent, verifyWebhook } from "@/lib/payments/lemonsqueezy";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

// Lemon Squeezy calls this after a purchase or a refund. The signature proves
// the call comes from Lemon Squeezy; record_order (service role only) stores
// the order and unlocks or locks the course.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const order = parseOrderEvent(body);
  if (!order) return NextResponse.json({ ignored: true });

  const { data, error } = await createAdminClient().rpc("record_order", {
    p_provider: PROVIDER,
    p_provider_order_id: order.orderId,
    p_course_slug: site.courseSlug,
    p_user: order.userId,
    p_email: order.email,
    p_amount_cents: order.amountCents,
    p_currency: order.currency,
    p_status: order.status,
    p_raw: body as Json,
  });
  // a 500 makes Lemon Squeezy retry later
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
