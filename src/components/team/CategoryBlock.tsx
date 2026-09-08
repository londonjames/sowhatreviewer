"use client";

import StarRating from "@/components/StarRating";
import { CategoryVerdict, COLLAPSE_AT } from "@/lib/team-types";
import { CATEGORIES } from "@/lib/questions";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

export default function CategoryBlock({
  verdict,
  index,
}: {
  verdict: CategoryVerdict;
  index: number;
}) {
  const definition = CATEGORIES.find((c) => c.id === verdict.id);
  const name = definition?.name ?? verdict.id;

  if (verdict.score === null) {
    return (
      <section className="py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h3
            className="text-base uppercase tracking-[0.18em] text-gray-light"
            style={SANS}
          >
            ({index + 1}) {name}
          </h3>
          <span
            className="text-sm uppercase tracking-[0.12em] text-gray-light"
            style={SANS}
          >
            Not applicable
          </span>
        </div>
        <p className="mt-2 text-lg leading-relaxed text-gray">
          {verdict.naReason}
        </p>
      </section>
    );
  }

  // A category this strong has nothing the author needs to act on, so it states
  // its result and gets out of the way. The review is only as long as the problems.
  const collapsed = verdict.score >= COLLAPSE_AT;

  return (
    <section className="py-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3
          className="text-base uppercase tracking-[0.18em] text-gray-light"
          style={SANS}
        >
          ({index + 1}) {name}
        </h3>
        <StarRating rating={verdict.score} />
      </div>

      {verdict.headline && (
        <p
          className={
            collapsed
              ? "mt-2 text-xl leading-snug text-foreground"
              : "mt-3 text-2xl font-semibold leading-snug text-foreground"
          }
        >
          {verdict.headline}
        </p>
      )}

      {!collapsed && verdict.body && (
        <p className="mt-3 text-xl leading-relaxed text-gray">{verdict.body}</p>
      )}
    </section>
  );
}
