import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WaitForAccess } from "@/components/WaitForAccess";
import { LOGIN_PATH } from "@/lib/site";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };
export const dynamic = "force-dynamic";

// Lemon Squeezy sends buyers here after paying. The webhook usually arrives
// within seconds; until then the page keeps checking.
export default async function WelcomePage() {
  const user = await getUser();
  if (!user) redirect(`${LOGIN_PATH}?next=${encodeURIComponent("/welcome")}`);
  return (
    <div className="flex justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white/70 p-8 text-center shadow-sm">
        <p className="text-5xl" aria-hidden="true">
          🎷
        </p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Thank you!</h1>
        <WaitForAccess />
      </div>
    </div>
  );
}
