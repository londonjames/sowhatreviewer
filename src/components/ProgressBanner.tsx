import { EvaluationResult } from "@/lib/types";
import { Label } from "./SectionHeading";

export default function ProgressBanner({
  progress,
  overall,
}: {
  progress: NonNullable<EvaluationResult["progress"]>;
  overall: number;
}) {
  const delta = overall - progress.previous_overall;
  const deltaColor = delta > 0 ? "var(--ui-green)" : delta < 0 ? "var(--ui-red)" : "var(--ui-muted)";

  return (
    <section className="rounded-2xl border border-[var(--ui-line)] bg-[var(--ui-card)] p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <Label>Since your last version</Label>
        <p className="text-xl font-semibold text-[var(--ui-ink)] tabular-nums">
          {progress.previous_overall} &rarr; {overall}
          <span className="ml-2" style={{ color: deltaColor }}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </p>
      </div>

      {progress.summary && (
        <p className="mt-3 text-[17px] leading-snug text-[var(--ui-ink)]">{progress.summary}</p>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {progress.addressed.length > 0 && (
          <div>
            <Label className="!text-[var(--ui-green)]">Fixed</Label>
            <ul className="mt-2 space-y-1.5">
              {progress.addressed.map((item, i) => (
                <li key={i} className="text-base leading-relaxed text-[var(--ui-ink-2)]">{item}</li>
              ))}
            </ul>
          </div>
        )}
        {progress.outstanding.length > 0 && (
          <div>
            <Label className="!text-[var(--ui-amber)]">Still outstanding</Label>
            <ul className="mt-2 space-y-1.5">
              {progress.outstanding.map((item, i) => (
                <li key={i} className="text-base leading-relaxed text-[var(--ui-ink-2)]">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
