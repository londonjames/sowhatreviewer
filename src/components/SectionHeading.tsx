/** Section title on the review page: plain sentence case, matching the home page steps. */
export default function SectionHeading({
  children,
  number,
  tone = "default",
}: {
  children: React.ReactNode;
  number?: string;
  tone?: "default" | "red";
}) {
  return (
    <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--ui-ink)]">
      {number && (
        <span className={`mr-2.5 ${tone === "red" ? "text-[var(--ui-red)]" : "text-[var(--ui-accent-text)]"}`}>
          {number}
        </span>
      )}
      {children}
    </h2>
  );
}

/** Small label above a block of content. */
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ui-muted)] ${className}`}>
      {children}
    </p>
  );
}
