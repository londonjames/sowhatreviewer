"use client";

import { useState } from "react";
import { QuestionVerdict } from "@/lib/team-types";
import { CATEGORIES, questionById, questionsFor } from "@/lib/questions";
import { tallyQuestions } from "@/lib/team-shape";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  answered: { label: "Answered", color: "#1a6b35" },
  partly: { label: "Partly", color: "#8b6914" },
  "not-answered": { label: "Not answered", color: "#8b3a3a" },
  "not-applicable": { label: "N/A", color: "var(--gray-light)" },
};

/**
 * Every question, with what it got.
 *
 * Collapsed by default and led by the count. An author who reads three
 * criticisms and nothing else assumes the document is broken; seeing that
 * fourteen of eighteen were answered is what makes the three actionable.
 */
export default function QuestionLedger({
  questions,
}: {
  questions: QuestionVerdict[];
}) {
  const [open, setOpen] = useState(false);
  if (!questions.length) return null;

  const tally = tallyQuestions(questions);
  const byId = new Map(questions.map((q) => [q.id, q]));

  return (
    <section className="rounded-lg border border-gray-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span>
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray"
            style={SANS}
          >
            Every question
          </span>
          <span className="mt-1 block text-lg text-foreground">
            {tally.answered} of {tally.applicable} answered
            {tally.partly > 0 && `, ${tally.partly} partly`}
            {tally.notAnswered > 0 && `, ${tally.notAnswered} not answered`}
          </span>
        </span>
        <span
          className="shrink-0 text-sm uppercase tracking-[0.12em] text-[#1a5a8a]"
          style={SANS}
        >
          {open ? "Hide" : "Show all"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-border px-6 pb-6">
          {CATEGORIES.map((category) => {
            const rows = questionsFor(category.id)
              .map((q) => byId.get(q.id))
              .filter((v): v is QuestionVerdict => !!v);
            if (!rows.length) return null;

            return (
              <div key={category.id} className="pt-5">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-light"
                  style={SANS}
                >
                  {category.name}
                </p>
                <ul className="mt-3 space-y-3">
                  {rows.map((row) => {
                    const definition = questionById(row.id);
                    const style = STATUS_STYLE[row.status];
                    return (
                      <li key={row.id}>
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <span
                            className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em]"
                            style={{ ...SANS, color: style.color }}
                          >
                            {style.label}
                          </span>
                          <span className="text-lg italic text-foreground">
                            &ldquo;{definition?.question}&rdquo;
                          </span>
                        </div>
                        {row.note && (
                          <p className="mt-1 text-base leading-relaxed text-gray">
                            {row.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
