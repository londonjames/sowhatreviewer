import ThemeToggle from "./ThemeToggle";

/** Page background, column width and the light/dark switch, shared by the review pages. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ui-page)] px-6 pt-16 pb-12 text-[var(--ui-ink)] transition-colors sm:pt-12">
      <ThemeToggle />
      <div className="mx-auto w-full max-w-[680px]">{children}</div>
    </div>
  );
}

export const PRIMARY_BUTTON =
  "rounded-[14px] bg-[var(--ui-accent)] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#1d4ed8]";
export const SECONDARY_BUTTON =
  "rounded-[14px] border border-[var(--ui-field-border)] bg-[var(--ui-field)] px-6 py-3 text-[15px] font-semibold text-[var(--ui-ink)] transition hover:border-[var(--ui-accent)]";
