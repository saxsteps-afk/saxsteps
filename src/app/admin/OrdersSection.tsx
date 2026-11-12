"use client";

import { useCallback, useEffect, useState } from "react";
import { courseApi, type CourseAdmin, type OrderAdmin } from "@/lib/admin/course";
import { Skeleton } from "@/components/Skeleton";
import { cn } from "@/lib/utils/cn";

const CARD = "rounded-2xl border border-line bg-white p-4 md:p-5";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Đơn hàng do webhook Lemon Squeezy ghi vào (supabase/schema.sql, record_order). */
export function OrdersSection({ course }: { course: CourseAdmin }) {
  const [orders, setOrders] = useState<OrderAdmin[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(() => courseApi.listOrders(course.id).then(setOrders, (e: Error) => setError(e.message)), [course.id]);
  useEffect(() => {
    reload();
  }, [reload]);

  const paid = orders?.filter((o) => o.status === "paid") ?? [];
  const revenue = new Map<string, number>();
  for (const o of paid) revenue.set(o.currency, (revenue.get(o.currency) ?? 0) + o.amount_cents);

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Đơn hàng</h2>
          <p className="text-sm text-muted">
            Lemon Squeezy báo về qua webhook; khóa học tự mở cho người mua.
            {paid.length > 0 && ` · ${paid.length} đơn đã trả · ${[...revenue].map(([c, v]) => money(v, c)).join(" + ")}`}
          </p>
        </div>
        <button type="button" onClick={reload} className="rounded-full border border-line px-3 py-1.5 text-sm text-ink/70 hover:text-ink">
          Làm mới
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : !orders ? (
        <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Chưa có đơn nào.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Thời gian</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Số tiền</th>
                <th className="py-2 pr-3 font-medium">Trạng thái</th>
                <th className="py-2 font-medium">Mã đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 pr-3 text-ink/70">{new Date(o.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="py-2 pr-3 text-ink">
                    {o.email}
                    {!o.user_id && <span className="block text-xs text-brass-deep">chưa có tài khoản: mở khóa khi họ đăng nhập bằng email này</span>}
                  </td>
                  <td className="py-2 pr-3 text-ink/70">{money(o.amount_cents, o.currency)}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        o.status === "paid" ? "border-green-300 bg-green-50 text-green-800" : "border-line text-muted",
                      )}
                    >
                      {o.status === "paid" ? "Đã trả" : "Đã hoàn tiền"}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-muted">
                    {o.provider} {o.provider_order_id}
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
