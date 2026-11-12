"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLAYER_PATH, site } from "@/lib/site";

const EVERY_MS = 3000;
const GIVE_UP_MS = 3 * 60 * 1000;

/** Polls until the purchase has unlocked the course, then offers Day 1. */
export function WaitForAccess() {
  const [state, setState] = useState<"waiting" | "ready" | "slow">("waiting");

  useEffect(() => {
    const supabase = createClient();
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let live = true;
    const check = async () => {
      await supabase.rpc("claim_orders");
      const { data: course } = await supabase.from("courses").select("id").eq("slug", site.courseSlug).maybeSingle();
      const { data: ok } = course ? await supabase.rpc("has_course_access", { p_course: course.id }) : { data: false };
      if (!live) return;
      if (ok) return setState("ready");
      if (Date.now() - started > GIVE_UP_MS) return setState("slow");
      timer = setTimeout(check, EVERY_MS);
    };
    check();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  if (state === "ready")
    return (
      <>
        <p className="mt-2 text-muted">Your 30 days are unlocked. Grab your sax!</p>
        <a href={PLAYER_PATH} className="mt-6 inline-block rounded-full bg-brass px-6 py-3 font-bold text-ink hover:bg-brass-soft">
          Start Day 1
        </a>
      </>
    );
  return (
    <div aria-live="polite">
      <p className="mt-2 text-muted">
        {state === "waiting" ? "Unlocking your course… this takes a few seconds." : "Your payment is taking longer than usual to come through."}
      </p>
      {state === "waiting" ? (
        <span className="mx-auto mt-6 block h-3 w-3 animate-ping rounded-full bg-brass" aria-hidden="true" />
      ) : (
        <p className="mt-4 text-sm text-muted">
          Refresh this page in a minute. Still locked? Email{" "}
          <a className="font-semibold text-brass-deep underline" href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          with your order receipt.
        </p>
      )}
    </div>
  );
}
