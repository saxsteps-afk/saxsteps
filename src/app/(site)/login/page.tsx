import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex justify-center px-4 py-14">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-white/70 p-6 shadow-sm sm:p-8">
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
