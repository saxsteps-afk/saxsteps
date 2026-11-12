import Link from "next/link";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { Logo } from "./Logo";

const NAV = [
  ["How it works", "/#how"],
  ["Curriculum", "/#curriculum"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="SaxSteps home">
          <Logo dark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted-dark md:flex">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-cream">
              {label}
            </Link>
          ))}
        </nav>
        <HeaderAuthLink />
      </div>
    </header>
  );
}
