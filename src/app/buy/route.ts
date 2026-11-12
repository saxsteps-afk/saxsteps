import { NextResponse, type NextRequest } from "next/server";
import { checkoutReady, checkoutUrl } from "@/lib/payments/lemonsqueezy";
import { LOGIN_PATH, site } from "@/lib/site";
import { createClient, supabaseReady } from "@/lib/supabase/server";

// "Get SaxSteps": sign in (or sign up) first, so the purchase lands on the
// learner's account, then go to the hosted checkout.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin));
  if (!supabaseReady || !checkoutReady()) return to("/account?checkout=unavailable");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return to(`${LOGIN_PATH}?mode=signup&next=${encodeURIComponent("/buy")}`);

  const { data: course } = await supabase.from("courses").select("id").eq("slug", site.courseSlug).maybeSingle();
  if (course) {
    const { data: owned } = await supabase.rpc("has_course_access", { p_course: course.id });
    if (owned) return to("/account");
  }

  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  return NextResponse.redirect(checkoutUrl({ userId: user.id, email: user.email, name }));
}
