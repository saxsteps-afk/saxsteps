/** Three rising steps with a note head on top: "step by step to your first songs". */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#e3ad4a" />
      <path d="M6 25h6v-5h6v-5h6V9" fill="none" stroke="#15110e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="21.6" cy="9.6" rx="3.4" ry="2.6" transform="rotate(-20 21.6 9.6)" fill="#15110e" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-lg font-extrabold tracking-tight ${dark ? "text-cream" : "text-ink"}`}>
        Sax<span className="text-brass">Steps</span>
      </span>
    </span>
  );
}
