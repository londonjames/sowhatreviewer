"use client";

import { EvaluationResult } from "@/lib/types";
import ScoreDisplay from "./ScoreDisplay";
import MirrorSection from "./MirrorSection";
import CategoryCard from "./CategoryCard";
import GapMirror from "./GapMirror";
import RewritePanel from "./RewritePanel";
import RedTeam from "./RedTeam";
import ProgressBanner from "./ProgressBanner";

interface ReviewBodyProps {
  /** Partial while the review is still streaming in. */
  result: Partial<EvaluationResult>;
  streaming?: boolean;
  truncated?: boolean;
}

function Rule() {
  return <hr className="border-[var(--ui-line)]" />;
}

function Pending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ui-accent)]" />
      <p className="text-sm text-[var(--ui-muted)]">
        {label}
      </p>
    </div>
  );
}

export default function ReviewBody({
  result,
  streaming = false,
  truncated = false,
}: ReviewBodyProps) {
  const sections: React.ReactNode[] = [];
  const push = (node: React.ReactNode) => sections.push(node);

  // Sections render in the order the model writes them (see the schema in
  // lib/evaluate.ts), so while streaming the page only ever grows at the bottom.
  if (streaming || result.overall !== undefined || result.verdict) {
    push(
      <ScoreDisplay key="score" overall={result.overall} rating={result.rating_name} verdict={result.verdict} />
    );
  }

  if (result.document && !streaming) {
    push(
      <details key="document" className="group rounded-2xl border border-[var(--ui-line)] bg-[var(--ui-card)]">
        <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-[var(--ui-accent-text)]">
          <span className="group-open:hidden">Show the document that was reviewed</span>
          <span className="hidden group-open:inline">Hide the document</span>
        </summary>
        <div className="whitespace-pre-wrap border-t border-[var(--ui-line)] px-5 py-4 text-[15px] leading-relaxed text-[var(--ui-ink-2)]">
          {result.document}
        </div>
      </details>
    );
  }

  if (truncated) {
    push(
      <div key="truncated" className="rounded-2xl border border-[var(--ui-amber)] p-4">
        <p className="text-base text-[var(--ui-ink)]">
          <span className="font-semibold">This document was too long to read in full.</span>{" "}
          The review covers roughly the first 300,000 characters, so anything
          after that point was not assessed.
        </p>
      </div>
    );
  }

  if (result.progress && result.overall !== undefined) {
    push(<ProgressBanner key="progress" progress={result.progress} overall={result.overall} />);
  }

  if (result.mirror_lead) {
    push(<MirrorSection key="mirror" lead={result.mirror_lead} bullets={result.mirror_bullets || []} />);
  }

  if (result.gap) push(<GapMirror key="gap" gap={result.gap} />);

  if (result.categories?.length) {
    push(<Rule key="rule-cat" />);
    result.categories.forEach((category, i) => {
      push(<CategoryCard key={category.name} category={category} />);
      if (i < (result.categories?.length || 0) - 1) {
        push(<Rule key={`rule-${category.name}`} />);
      }
    });
  }

  if (result.rewrites?.length) {
    push(<Rule key="rule-rewrites" />);
    push(<RewritePanel key="rewrites" rewrites={result.rewrites} />);
  }

  if (result.red_team?.length) {
    push(<Rule key="rule-red" />);
    push(<RedTeam key="red" questions={result.red_team} />);
  }

  if (streaming) {
    const next =
      result.overall === undefined
        ? "Reading your document"
        : !result.mirror_lead
          ? "Working out the so what"
          : !result.categories?.length
            ? "Writing the feedback"
          : !result.rewrites?.length
            ? "Writing the rewrites"
            : !result.red_team?.length
              ? "Red teaming"
              : "Finishing up";
    push(<Pending key="pending" label={`${next}...`} />);
  }

  // ScoreDisplay centres itself; everything else is full width.
  return <div className="flex flex-col gap-8">{sections}</div>;
}
