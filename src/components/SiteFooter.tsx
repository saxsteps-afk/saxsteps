import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-sm text-muted-dark">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto_auto]">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-xs">{site.tagline}</p>
        </div>
        <ul className="space-y-2">
          <li>
            <Link href="/#curriculum" className="hover:text-cream">
              Curriculum
            </Link>
          </li>
          <li>
            <Link href="/#pricing" className="hover:text-cream">
              Pricing
            </Link>
          </li>
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-cream">
              {site.email}
            </a>
          </li>
        </ul>
        <ul className="space-y-2">
          <li>
            <Link href="/terms" className="hover:text-cream">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="hover:text-cream">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/refund" className="hover:text-cream">
              Refund Policy
            </Link>
          </li>
        </ul>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs">
        © {new Date().getFullYear()} {site.name}. All songs in the course are in the public domain.
      </p>
    </footer>
  );
}
