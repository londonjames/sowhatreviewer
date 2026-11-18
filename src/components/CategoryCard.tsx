import StarRating from "./StarRating";
import SectionHeading, { Label } from "./SectionHeading";
import { CategoryEvaluation } from "@/lib/types";

const CATEGORY_NUMBER: Record<string, string> = {
  Intent: "01",
  Delivery: "02",
  Narrative: "03",
};

export default function CategoryCard({ category }: { category: CategoryEvaluation }) {
  const actions = category.actions?.length
    ? category.actions
    : category.improvement
      ? [category.improvement]
      : [];

  // One bullet per sentence of the feedback.
  const feedbackBullets = category.feedback
    ? category.feedback.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 10)
    : [];

  return (
    <section>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <SectionHeading number={CATEGORY_NUMBER[category.name]}>{category.name}</SectionHeading>
        <StarRating rating={category.score} />
      </div>

      {category.headline && (
        <p className="mt-2 text-[19px] font-semibold leading-snug text-[var(--ui-ink)]">
          {category.headline.replace(/\*\*/g, "")}
        </p>
      )}

      <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <Label>Current state</Label>
          <ul className="mt-2.5 space-y-2.5">
            {feedbackBullets.map((bullet, i) => (
              <li key={i} className="flex gap-2.5 text-base leading-relaxed text-[var(--ui-ink-2)]">
                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-muted)]" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label>What to do</Label>
          <ol className="mt-2.5 space-y-2.5">
            {actions.map((action, i) => {
              const colonIdx = action.indexOf(":");
              const hasPrefix = colonIdx > 0 && colonIdx < 60;
              return (
                <li key={i} className="flex gap-2.5 text-base leading-relaxed text-[var(--ui-ink-2)]">
                  <span className="shrink-0 font-semibold text-[var(--ui-accent-text)] tabular-nums">{i + 1}</span>
                  {hasPrefix ? (
                    <span>
                      <span className="font-semibold text-[var(--ui-ink)]">{action.slice(0, colonIdx + 1)}</span>{" "}
                      {action.slice(colonIdx + 1).trim()}
                    </span>
                  ) : (
                    action
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
