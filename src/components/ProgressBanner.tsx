import { EvaluationResult } from "@/lib/types";

interface ProgressBannerProps {
  progress: NonNullable<EvaluationResult["progress"]>;
  overall: number;
}

export default function ProgressBanner({
  progress,
  overall,
}: ProgressBannerProps) {
  const delta = overall - progress.previous_overall;
  const deltaColor =
    delta > 0 ? "#1a6b35" : delta < 0 ? "#8b3a3a" : "var(--gray)";

  return (
    <section className="rounded-lg border border-gray-border bg-surface p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em] text-gray"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          Since your last version
        </p>
        <p
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}
        >
          {progress.previous_overall} &rarr; {overall}
          <span className="ml-2" style={{ color: deltaColor }}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </p>
      </div>

      {progress.summary && (
        <p className="mt-3 text-lg leading-snug text-foreground">
          {progress.summary}
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {progress.addressed.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                color: "#1a6b35",
              }}
            >
              Fixed
            </p>
            <ul className="mt-2 space-y-1.5">
              {progress.addressed.map((item, i) => (
                <li key={i} className="text-base leading-relaxed text-gray">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progress.outstanding.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                color: "#8b6914",
              }}
            >
              Still outstanding
            </p>
            <ul className="mt-2 space-y-1.5">
              {progress.outstanding.map((item, i) => (
                <li key={i} className="text-base leading-relaxed text-gray">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
