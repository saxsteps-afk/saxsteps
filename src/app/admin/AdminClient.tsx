"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { courseApi, type CourseAdmin, type DayAdmin, type StudentAdmin } from "@/lib/admin/course";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Skeleton } from "@/components/Skeleton";
import { ITEM_KIND_LABEL, ITEM_KINDS, parseGuide,
  parseItemFile, type ParsedItemFile } from "@/lib/course";
import { PLAYER_PATH, site } from "@/lib/site";
import { OrdersSection } from "./OrdersSection";
import type { CourseItemKind } from "@/types/database";
import { cn } from "@/lib/utils/cn";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

const INPUT =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brass";
const CARD = "rounded-2xl border border-line bg-white p-4 md:p-5";
const PILL = "rounded-full border px-2.5 py-0.5 text-xs font-medium";

export function AdminClient() {
  const [course, setCourse] = useState<CourseAdmin | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    courseApi.getCourse(site.courseSlug).then(setCourse, (e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className={cn(CARD, "text-sm text-red-600")}>
        Không đọc được khóa học: {error}
        <p className="mt-2 text-ink/70">
          Nếu báo thiếu bảng (<code>courses</code>…), file <code>supabase/schema.sql</code> chưa được chạy trên project
          Supabase của SaxSteps.
        </p>
      </div>
    );
  }
  if (course === undefined) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (course === null) return <div className={CARD}>Chưa có khóa học {site.courseSlug}.</div>;

  return (
    <div className="space-y-6">
      <CourseHeader course={course} onChange={setCourse} />
      <LessonsSection course={course} />
      <OrdersSection course={course} />
      <StudentsSection course={course} />
      <CourseSettings course={course} onChange={setCourse} />
    </div>
  );
}

function CourseHeader({ course, onChange }: { course: CourseAdmin; onChange: (c: CourseAdmin) => void }) {
  const published = course.status === "published";
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{course.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {published
            ? "Đang mở bán: ai cũng xem được trang khóa học và học thử các bài miễn phí."
            : "Bản nháp: chỉ admin và học viên đã được mở khóa mới thấy. Dùng để chạy thử trước khi bán."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:text-ink">
          Trang chủ
        </Link>
        <a
          href={PLAYER_PATH}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:text-ink"
        >
          Màn hình học
        </a>
        <ConfirmButton
          confirmMessage={
            published
              ? "Chuyển khóa học về nháp? Người chưa được mở khóa sẽ không xem được nữa."
              : "Mở bán khóa học? Khách sẽ học thử được các ngày miễn phí và mua được khóa học."
          }
          onConfirm={async () => {
            const status = published ? "draft" : "published";
            await courseApi.updateCourse(course.id, { status });
            onChange({ ...course, status });
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            published ? "border border-line text-ink/70" : "bg-brass text-ink hover:bg-brass-soft",
          )}
        >
          {published ? "Chuyển về nháp" : "Mở bán"}
        </ConfirmButton>
      </div>
    </div>
  );
}

type LogLine = { ok: boolean; text: string };

/**
 * Tải lên: các file "Day NN - Notes/Song/Bonus - ….nhac.json" và
 * file giáo án .md. Giáo án đi trước để đặt tên ngày.
 */
async function uploadCourseFiles(courseId: string, files: File[], replace: boolean): Promise<LogLine[]> {
  const log: LogLine[] = [];
  const dayIds = new Map<number, string>();
  const dayId = async (day: number, title?: string) => {
    if (title === undefined && dayIds.has(day)) return dayIds.get(day)!;
    const id = await courseApi.ensureDay(courseId, day, title);
    dayIds.set(day, id);
    return id;
  };

  for (const file of files.filter((f) => /\.md$|\.txt$/i.test(f.name))) {
    const guides = parseGuide(await file.text());
    if (!guides.length) {
      log.push({ ok: false, text: `${file.name}: không thấy dòng "## Ngày N · Tên ngày" nào.` });
      continue;
    }
    for (const g of guides) await courseApi.saveGuide(await dayId(g.day, g.title), g.body);
    log.push({ ok: true, text: `${file.name}: bài giảng của ${guides.length} ngày` });
  }

  const parsed: ParsedItemFile[] = [];
  for (const file of files.filter((f) => /\.json$/i.test(f.name))) {
    try {
      parsed.push(await parseItemFile(file));
    } catch (e) {
      log.push({ ok: false, text: (e as Error).message });
    }
  }
  if (parsed.length) {
    let saved = 0;
    let removed = 0;
    const byDay = new Map<number, ParsedItemFile[]>();
    for (const p of parsed) byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]);
    for (const [day, list] of [...byDay].sort((a, b) => a[0] - b[0])) {
      const lessonId = await dayId(day);
      list.sort((a, b) => a.fileName.localeCompare(b.fileName, "vi"));
      for (const kind of ITEM_KINDS) {
        const ofKind = list.filter((x) => x.kind === kind);
        if (!ofKind.length) continue;
        const kept: string[] = [];
        for (const [position, p] of ofKind.entries()) {
          try {
            kept.push(await courseApi.saveItemFile(lessonId, p, position));
          } catch (e) {
            log.push({ ok: false, text: `${p.fileName}: ${(e as Error).message}` });
          }
        }
        saved += kept.length;
        // tải lại "Ngày 4 - Bài hát - …" thì bài hát cũ của ngày 4 (tên khác) bị thay; luyện nốt giữ nguyên
        if (replace && kept.length === ofKind.length) removed += await courseApi.removeItemsExcept(lessonId, kind, kept);
      }
    }
    log.push({ ok: true, text: `${saved} bản nhạc cho ${byDay.size} ngày` });
    if (removed) log.push({ ok: true, text: `Đã xóa ${removed} bài cũ bị thay` });
  }
  return log;
}

function LessonsSection({ course }: { course: CourseAdmin }) {
  const [days, setDays] = useState<DayAdmin[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(true);
  const [log, setLog] = useState<LogLine[]>([]);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(
    () =>
      courseApi.listDays(course.id).then(setDays, (e: Error) =>
        setLoadError(
          /course_items|course_lesson_guides|schema cache/.test(e.message)
            ? "Chưa chạy file SQL supabase/migrations/20261111000000_course_day_items.sql (mỗi ngày nhiều bài)."
            : e.message,
        ),
      ),
    [course.id],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setLog([]);
    try {
      setLog(await uploadCourseFiles(course.id, Array.from(files), replace));
    } catch (e) {
      setLog([{ ok: false, text: (e as Error).message }]);
    }
    await reload();
    setBusy(false);
  }

  const unpublished = days?.filter((l) => !l.is_published) ?? [];
  const have = new Set(days?.map((d) => d.day));
  const missing = Array.from({ length: course.total_days }, (_, k) => k + 1).filter((n) => !have.has(n));
  const itemCount = days?.reduce((n, d) => n + d.items.length, 0) ?? 0;

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Bài học</h2>
          <p className="text-sm text-muted">
            {days ? `${days.length}/${course.total_days} ngày · ${itemCount} bản nhạc` : "Đang tải…"} · Chọn cả thư mục bài:
            các file <code>Day NN - Notes/Song/Bonus - ….nhac.json</code> và file giáo án <code>lesson-plan.md</code> (thư mục <code>score/bai-tap/30daysForSax</code>).
          </p>
          <label className="mt-1.5 flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Bài mới thay bài cũ cùng loại trong ngày (bỏ chọn để chỉ thêm bài)
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {unpublished.length > 0 && (
            <ConfirmButton
              confirmMessage={`Đăng ${unpublished.length} bài chưa đăng?`}
              onConfirm={async () => {
                for (const l of unpublished) await courseApi.updateLesson(l.id, { is_published: true });
                await reload();
              }}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:text-ink"
            >
              Đăng tất cả
            </ConfirmButton>
          )}
          <label
            className={cn(
              "cursor-pointer rounded-full bg-brass px-4 py-2 text-sm font-semibold text-ink hover:bg-brass-soft",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {busy ? "Đang tải lên…" : "+ Tải bài lên"}
            <input
              type="file"
              accept=".json,.md,application/json,text/markdown"
              multiple
              className="sr-only"
              onChange={(e) => {
                upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {log.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-cream-2 p-3 text-sm">
          {log.map((m, i) => (
            <li key={i} className={m.ok ? "text-ink/70" : "text-red-600"}>
              {m.ok ? "✓ " : "✗ "}
              {m.text}
            </li>
          ))}
        </ul>
      )}

      {days && missing.length > 0 && days.length > 0 && (
        <p className="mt-3 text-sm text-muted">Chưa có: ngày {missing.join(", ")}</p>
      )}

      {loadError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      ) : !days ? (
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      ) : days.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Chưa có bài nào.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {days.map((d) => (
            <DayRow
              key={d.id}
              day={d}
              onChange={(next) => setDays((prev) => prev?.map((x) => (x.id === d.id ? next : x)) ?? prev)}
              onRemoved={reload}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DayRow({ day: d, onChange, onRemoved }: { day: DayAdmin; onChange: (d: DayAdmin) => void; onRemoved: () => void }) {
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState(d.guide ?? "");
  const [saved, setSaved] = useState("");
  // tải lại file giáo án thì ô soạn thảo theo bản mới
  const [shownGuide, setShownGuide] = useState(d.guide);
  if (d.guide !== shownGuide) {
    setShownGuide(d.guide);
    setGuide(d.guide ?? "");
  }

  async function patch(p: Partial<Pick<DayAdmin, "is_free" | "is_published" | "title">>) {
    onChange({ ...d, ...p });
    await courseApi.updateLesson(d.id, p);
  }

  const has = (k: CourseItemKind) => d.items.some((i) => i.kind === k);
  const bonus = d.items.filter((i) => i.kind === "bonus").length;
  const gaps = [!has("notes") && "luyện nốt", !has("song") && "bài hát", !d.guide && "bài giảng"].filter(Boolean);

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-20 shrink-0 text-left text-sm font-semibold text-ink"
        >
          <span className="inline-block w-4 text-muted">{open ? "▾" : "▸"}</span>Ngày {d.day}
        </button>
        <div className="min-w-0 flex-1">
          <input
            defaultValue={d.title}
            aria-label={`Tên ngày ${d.day}`}
            placeholder="Tên ngày (lấy từ giáo án)"
            onBlur={(e) => {
              const title = e.target.value.trim();
              if (title !== d.title) patch({ title });
            }}
            className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink hover:border-line focus:border-brass focus:outline-none"
          />
          <p className="truncate px-1.5 text-xs text-muted">
            {d.items.map((i) => ITEM_KIND_LABEL[i.kind]).filter((x, k, a) => a.indexOf(x) === k).join(" · ") || "chưa có bản nhạc"}
            {bonus > 1 ? ` (${bonus})` : ""}
            {d.guide ? " · có bài giảng" : ""}
            {gaps.length > 0 && <span className="text-red-600"> · thiếu {gaps.join(", ")}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => patch({ is_free: !d.is_free })}
            className={cn(PILL, d.is_free ? "border-brass bg-brass-soft/40 text-ink" : "border-line text-muted")}
            title="Ngày học thử: ai cũng mở được khi khóa học đang bán"
          >
            {d.is_free ? "Học thử" : "Trả phí"}
          </button>
          <button
            type="button"
            onClick={() => patch({ is_published: !d.is_published })}
            className={cn(PILL, d.is_published ? "border-green-300 bg-green-50 text-green-800" : "border-line text-muted")}
          >
            {d.is_published ? "Đã đăng" : "Nháp"}
          </button>
          <ConfirmButton
            confirmMessage={`Xóa cả ngày ${d.day} (bản nhạc, bài giảng, video)? Tiến độ của học viên ở ngày này cũng mất.`}
            onConfirm={async () => {
              await courseApi.removeLesson(d.id);
              onRemoved();
            }}
            className="px-1 text-red-600 hover:underline"
          >
            Xóa
          </ConfirmButton>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-4 rounded-xl bg-cream-2 p-3 md:ml-20">
          <ul className="space-y-3">
            {d.items.map((i) => (
              <li key={i.id} className="grid gap-1.5 md:grid-cols-[6rem_1fr_auto] md:items-start">
                <span className="text-xs font-semibold uppercase text-muted">{ITEM_KIND_LABEL[i.kind]}</span>
                <div className="min-w-0">
                  <p className="text-sm text-ink">
                    {i.title}
                    {i.subtitle && <span className="text-muted"> · {i.subtitle}</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {i.file_name ?? "thiếu nốt nhạc"}
                    {i.content_updated_at ? ` · cập nhật ${formatDate(i.content_updated_at)}` : ""}
                  </p>
                  <input
                    defaultValue={i.video_url}
                    placeholder="Link video (YouTube không công khai, hoặc file .mp4)"
                    aria-label={`Video ${ITEM_KIND_LABEL[i.kind]} ngày ${d.day}`}
                    onBlur={async (e) => {
                      const url = e.target.value.trim();
                      if (url === i.video_url) return;
                      await courseApi.setVideo(i.id, url);
                      onChange({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, video_url: url } : x)) });
                    }}
                    className="mt-1 w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-brass focus:outline-none"
                  />
                </div>
                <ConfirmButton
                  confirmMessage={`Xóa "${i.title}" khỏi ngày ${d.day}?`}
                  onConfirm={async () => {
                    await courseApi.removeItem(i.id);
                    onChange({ ...d, items: d.items.filter((x) => x.id !== i.id) });
                  }}
                  className="justify-self-start px-1 text-xs text-red-600 hover:underline"
                >
                  Xóa
                </ConfirmButton>
              </li>
            ))}
          </ul>

          <div>
            <label className="text-xs font-semibold uppercase text-muted" htmlFor={`guide-${d.id}`}>
              Bài giảng
            </label>
            <textarea
              id={`guide-${d.id}`}
              value={guide}
              onChange={(e) => {
                setGuide(e.target.value);
                setSaved("");
              }}
              rows={12}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs leading-relaxed text-ink focus:border-brass focus:outline-none"
            />
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                disabled={guide === (d.guide ?? "")}
                onClick={async () => {
                  await courseApi.saveGuide(d.id, guide);
                  onChange({ ...d, guide });
                  setSaved("Đã lưu.");
                }}
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-cream hover:bg-ink-3 disabled:opacity-40"
              >
                Lưu bài giảng
              </button>
              <span className="text-xs text-muted">
                {saved || "Dùng **đậm**, dòng “- ” và “1. ”. Tải lại file giáo án sẽ ghi đè phần này."}
              </span>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function StudentsSection({ course }: { course: CourseAdmin }) {
  const [students, setStudents] = useState<StudentAdmin[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const reload = useCallback(() => courseApi.listStudents(course.id).then(setStudents), [course.id]);
  useEffect(() => {
    reload();
  }, [reload]);

  async function handleGrant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = data.get("email")?.toString().trim() ?? "";
    const note = data.get("note")?.toString().trim() ?? "";
    setPending(true);
    setMessage(null);
    try {
      await courseApi.grant(course.id, email, note);
      setMessage({ ok: true, text: `Đã mở khóa cho ${email}.` });
      form.reset();
      await reload();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    }
    setPending(false);
  }

  return (
    <section className={CARD}>
      <h2 className="font-semibold text-ink">Học viên</h2>
      <p className="text-sm text-muted">
        Học viên đăng ký tài khoản ở trang khóa học, chuyển khoản, rồi bạn mở khóa bằng email của họ.
      </p>

      <form onSubmit={handleGrant} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-medium text-ink">
          Email học viên
          <input name="email" type="email" required className={INPUT} />
        </label>
        <label className="text-sm font-medium text-ink">
          Ghi chú (mã chuyển khoản, số điện thoại…)
          <input name="note" className={INPUT} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink-3 disabled:opacity-60"
        >
          {pending ? "Đang mở…" : "Mở khóa"}
        </button>
      </form>
      {message && (
        <p aria-live="polite" className={cn("mt-2 text-sm", message.ok ? "text-green-700" : "text-red-600")}>
          {message.text}
        </p>
      )}

      {!students ? (
        <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      ) : students.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Chưa mở khóa cho ai.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Ghi chú</th>
                <th className="py-2 pr-3 font-medium">Mở khóa</th>
                <th className="py-2 pr-3 font-medium">Đã học</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => (
                <tr key={s.user_id}>
                  <td className="py-2 pr-3 text-ink">{s.email}</td>
                  <td className="py-2 pr-3 text-ink/70">{s.note}</td>
                  <td className="py-2 pr-3 text-ink/70">{formatDate(s.granted_at)}</td>
                  <td className="py-2 pr-3 text-ink/70">
                    {s.lessons_done} ngày{s.last_activity ? ` · ${formatDate(s.last_activity)}` : ""}
                  </td>
                  <td className="py-2 text-right">
                    <ConfirmButton
                      confirmMessage={`Khóa lại khóa học với ${s.email}?`}
                      onConfirm={async () => {
                        await courseApi.revoke(course.id, s.user_id);
                        await reload();
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Khóa lại
                    </ConfirmButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CourseSettings({ course, onChange }: { course: CourseAdmin; onChange: (c: CourseAdmin) => void }) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const patch = {
      title: data.get("title")?.toString().trim() || course.title,
      subtitle: data.get("subtitle")?.toString().trim() ?? "",
      total_days: Number(data.get("total_days") || course.total_days),
    };
    try {
      await courseApi.updateCourse(course.id, patch);
      onChange({ ...course, ...patch });
      setMessage("Đã lưu.");
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <section className={CARD}>
      <h2 className="font-semibold text-ink">Thông tin khóa học</h2>
      <form onSubmit={handleSubmit} className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-ink">
          Tên khóa học
          <input name="title" defaultValue={course.title} required className={INPUT} />
        </label>
        <label className="text-sm font-medium text-ink">
          Dòng phụ
          <input name="subtitle" defaultValue={course.subtitle} className={INPUT} />
        </label>
        <label className="text-sm font-medium text-ink">
          Số ngày
          <input name="total_days" type="number" min={1} max={365} defaultValue={course.total_days} className={INPUT} />
        </label>
        <p className="self-end text-sm text-muted md:col-span-2">
          Giá bán đặt ở Lemon Squeezy; giá hiện trên trang chủ sửa trong <code>src/lib/site.ts</code> (hiện: {site.price.label}).
        </p>
        <div className="flex items-center gap-3 md:col-span-2">
          <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink-3">
            Lưu
          </button>
          {message && <span className="text-sm text-ink/70">{message}</span>}
        </div>
      </form>
    </section>
  );
}
