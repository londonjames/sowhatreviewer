import SectionHeading from "./SectionHeading";

export default function MirrorSection({ lead, bullets }: { lead: string; bullets: string[] }) {
  return (
    <section>
      <SectionHeading>The So What your doc conveys</SectionHeading>
      <p className="mt-3 text-[19px] font-semibold leading-snug text-[var(--ui-ink)]">{lead}</p>
      {bullets.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-relaxed text-[var(--ui-ink-2)]">
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-muted)]" />
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
