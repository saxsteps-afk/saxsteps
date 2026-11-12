import "server-only";
import type { User } from "@supabase/supabase-js";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export interface LearnerState {
  user: User;
  /** null while the course is a draft the learner cannot see yet */
  courseId: string | null;
  hasAccess: boolean;
  isAdmin: boolean;
  daysDone: number;
  daysReady: number;
}

/**
 * What the account page shows. Also attaches purchases made with this email
 * before the account existed (claim_orders).
 */
export async function getLearnerState(user: User): Promise<LearnerState> {
  const supabase = await createClient();
  await supabase.rpc("claim_orders");

  const [{ data: course }, { data: isAdmin }] = await Promise.all([
    supabase.from("courses").select("id").eq("slug", site.courseSlug).maybeSingle(),
    supabase.rpc("is_admin"),
  ]);
  if (!course) return { user, courseId: null, hasAccess: false, isAdmin: Boolean(isAdmin), daysDone: 0, daysReady: 0 };

  const [{ data: access }, { data: lessons }] = await Promise.all([
    supabase.rpc("has_course_access", { p_course: course.id }),
    supabase.from("course_lessons").select("id").eq("course_id", course.id).eq("is_published", true),
  ]);
  const lessonIds = (lessons ?? []).map((l) => l.id);

  let daysDone = 0;
  if (lessonIds.length) {
    const { data: items } = await supabase.from("course_items").select("id,lesson_id,kind").in("lesson_id", lessonIds);
    const required = (items ?? []).filter((i) => i.kind !== "bonus");
    const { data: progress } = required.length
      ? await supabase
          .from("course_item_progress")
          .select("item_id")
          .eq("user_id", user.id)
          .in(
            "item_id",
            required.map((i) => i.id),
          )
      : { data: [] };
    const done = new Set((progress ?? []).map((p) => p.item_id));
    daysDone = lessonIds.filter((id) => {
      const mine = required.filter((i) => i.lesson_id === id);
      return mine.length > 0 && mine.every((i) => done.has(i.id));
    }).length;
  }

  return {
    user,
    courseId: course.id,
    hasAccess: Boolean(access),
    isAdmin: Boolean(isAdmin),
    daysDone,
    daysReady: lessonIds.length,
  };
}
