import SectionHeading from "./SectionHeading";

export default function RedTeam({ questions }: { questions: string[] }) {
  if (!questions.length) return null;

  return (
    <section>
      <SectionHeading>What you&apos;ll get asked</SectionHeading>
      <p className="mt-1.5 text-[15px] text-[var(--ui-muted)]">Questions this document leaves you unable to answer.</p>
      <ol className="mt-5 space-y-4">
        {questions.map((question, i) => (
          <li key={i} className="flex gap-4">
            <span className="w-4 shrink-0 text-[19px] font-semibold leading-[1.5] text-[var(--ui-red)] tabular-nums">
              {i + 1}
            </span>
            <p className="text-[17px] leading-relaxed text-[var(--ui-ink)]">{question}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
