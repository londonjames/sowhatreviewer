"use client";

import { useState } from "react";
import { TeamReviewResult } from "@/lib/team-types";
import ReviewBody from "@/components/ReviewBody";
import OverallCard from "./OverallCard";
import CategoryBlock from "./CategoryBlock";
import QuestionLedger from "./QuestionLedger";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

function Rule() {
  return <hr className="border-foreground/20" />;
}

function Pending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-light" />
      <p
        className="text-xs uppercase tracking-[0.15em] text-gray-light"
        style={SANS}
      >
        {label}
      </p>
    </div>
  );
}

/** The full TASTE review, folded away until the author wants the writing notes. */
function CraftDetail({ craft }: { craft: NonNullable<TeamReviewResult["craft"]> }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-lg border border-gray-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span>
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray"
            style={SANS}
          >
            The writing, in detail
          </span>
          <span className="mt-1 block text-lg text-foreground">
            Intent, delivery and narrative scored {craft.overall}/100, with
            rewrites
          </span>
        </span>
        <span
          className="shrink-0 text-sm uppercase tracking-[0.12em] text-[#1a5a8a]"
          style={SANS}
        >
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-border px-6 py-8">
          <ReviewBody result={craft} />
        </div>
      )}
    </section>
  );
}

function ProgressBlock({
  progress,
  overall,
}: {
  progress: NonNullable<TeamReviewResult["progress"]>;
  overall: number;
}) {
  const delta = overall - progress.previous_overall;
  const color = delta > 0 ? "#1a6b35" : delta < 0 ? "#8b3a3a" : "var(--gray)";

  return (
    <section className="rounded-lg border border-gray-border bg-surface p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em] text-gray"
          style={SANS}
        >
          Since your last version
        </p>
        <p className="text-xl font-bold">
          {progress.previous_overall} &rarr; {overall}
          <span className="ml-2" style={{ color }}>
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
              style={{ ...SANS, color: "#1a6b35" }}
            >
              Answered since last time
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
              style={{ ...SANS, color: "#8b6914" }}
            >
              Still open
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

export default function TeamReviewBody({
  result,
  streaming = false,
  truncated = false,
}: {
  /** Partial while the review is still streaming in. */
  result: Partial<TeamReviewResult>;
  streaming?: boolean;
  truncated?: boolean;
}) {
  const sections: React.ReactNode[] = [];
  const push = (node: React.ReactNode) => sections.push(node);

  if (truncated) {
    push(
      <div
        key="truncated"
        className="rounded-lg border p-4"
        style={{ borderColor: "#d97706", backgroundColor: "#fffbf2" }}
      >
        <p className="text-base text-foreground">
          <span className="font-semibold">
            This document was too long to read in full.
          </span>{" "}
          The review covers roughly the first 300,000 characters. Anything after
          that was not assessed.
        </p>
      </div>
    );
  }

  if (result.verdict || result.overall) {
    push(<OverallCard key="overall" result={result} />);
  } else if (streaming) {
    push(<Pending key="overall-pending" label="Reading the document" />);
  }

  if (result.progress && typeof result.overall === "number") {
    push(
      <ProgressBlock
        key="progress"
        progress={result.progress}
        overall={result.overall}
      />
    );
  }

  const categories = result.categories ?? [];
  if (categories.length) {
    push(
      <div key="categories">
        {categories.map((category, i) => (
          <div key={category.id}>
            {i > 0 && <Rule />}
            <CategoryBlock verdict={category} index={i} />
          </div>
        ))}
      </div>
    );
  } else if (streaming) {
    push(<Pending key="categories-pending" label="Working through the questions" />);
  }

  if (result.questions?.length) {
    push(<QuestionLedger key="ledger" questions={result.questions} />);
  }

  if (result.craft) {
    push(<CraftDetail key="craft" craft={result.craft} />);
  } else if (streaming) {
    push(<Pending key="craft-pending" label="Scoring the writing" />);
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((node, i) => (
        <div key={i}>{node}</div>
      ))}
    </div>
  );
}
