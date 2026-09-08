"use client";

import { OVERALL_LEVELS, TeamReviewResult } from "@/lib/team-types";
import { DOC_TYPE_LABELS } from "@/lib/questions";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

const COUNT_WORD = ["No", "One", "Two", "Three"];

/**
 * A document that scores four or five has already been told it is ready, so
 * heading its list "before this reaches James" contradicts the verdict directly
 * above it. At that point the fixes are sharpening, not gating.
 */
function fixesHeading(count: number, overall: number): string {
  const word = COUNT_WORD[count] ?? String(count);
  const noun = count === 1 ? "thing" : "things";
  return overall >= 4
    ? `${word} ${noun} that would sharpen it`
    : `${word} ${noun} before this reaches James`;
}

function BigStars({ filled, color }: { filled: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${filled} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="26" height="26" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 1.5l2.47 5.01L18.5 7.4l-4.25 4.14 1 5.83L10 14.48l-5.25 2.89 1-5.83L1.5 7.4l6.03-.89L10 1.5z"
            fill={n <= filled ? color : "none"}
            stroke={color}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

export default function OverallCard({
  result,
}: {
  result: Partial<TeamReviewResult>;
}) {
  const overall = result.overall ?? 0;
  const level = OVERALL_LEVELS[overall];
  const color = level?.color ?? "var(--gray-light)";
  const fixes = result.top_fixes ?? [];

  return (
    <section className="rounded-lg border-2 p-7" style={{ borderColor: color }}>
      {(result.title || result.doc_type) && (
        <p
          className="mb-5 text-xs uppercase tracking-[0.18em] text-gray-light"
          style={SANS}
        >
          {result.doc_type ? DOC_TYPE_LABELS[result.doc_type] : ""}
          {result.doc_type && result.title ? " · " : ""}
          {result.title}
          {result.doc_type_uncertain && (
            <span className="ml-2 normal-case tracking-normal text-gray">
              (type unclear, judged against the strictest set)
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <BigStars filled={overall} color={color} />
        {level && (
          <p
            className="text-2xl font-bold uppercase tracking-[0.08em]"
            style={{ ...SANS, color }}
          >
            {level.name}
          </p>
        )}
      </div>

      {result.verdict && (
        <p className="mt-5 text-2xl leading-snug text-foreground">
          {result.verdict}
        </p>
      )}

      {level && (
        <p className="mt-2 text-base text-gray-light" style={SANS}>
          {level.meaning}
        </p>
      )}

      {fixes.length > 0 && (
        <div className="mt-7 border-t border-gray-border pt-6">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray"
            style={SANS}
          >
            {fixesHeading(fixes.length, overall)}
          </p>
          <ol className="mt-4 space-y-3">
            {fixes.map((fix, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="mt-0.5 shrink-0 text-base font-semibold text-gray-light"
                  style={SANS}
                >
                  {i + 1}.
                </span>
                <span className="text-lg leading-relaxed text-foreground">
                  {fix}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
