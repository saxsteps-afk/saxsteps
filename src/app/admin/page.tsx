import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient, getUser } from "@/lib/supabase/server";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=%2Fadmin");
  const { data: isAdmin } = await (await createClient()).rpc("is_admin");

  return (
    <div className="min-h-screen bg-cream-2/50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-sm text-muted">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {isAdmin ? (
          <AdminClient />
        ) : (
          <div className="rounded-2xl border border-line bg-white p-6 text-sm">
            <p className="font-semibold">Không có quyền quản trị.</p>
            <p className="mt-2 text-muted">
              Tài khoản {user.email} chưa nằm trong admin_users. Chạy <code>supabase/make-admin.sql</code> trong SQL Editor (sửa email
              nếu cần), rồi tải lại trang.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
