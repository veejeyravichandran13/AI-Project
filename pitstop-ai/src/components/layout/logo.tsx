import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Pitstop AI home">
      <span aria-hidden="true" className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl bg-accent text-accent-ink shadow-[0_0_24px_var(--glow)]">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M6 19V5h6.5c3 0 5 1.7 5 4.2s-2 4.3-5 4.3H10V19z" />
          <path d="M16.5 15h2v2h-2zM18.5 17h2v2h-2zM16.5 19h2v2h-2z" opacity=".85" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Pitstop <span className="text-accent">AI</span>
      </span>
    </Link>
  );
}
