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
  return <hr className="border-foreground/20" />;
}

function Pending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-light" />
      <p
        className="text-xs uppercase tracking-[0.15em] text-gray-light"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
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

  if (truncated) {
    push(
      <div
        key="truncated"
        className="rounded-lg border p-4"
        style={{ borderColor: "#d97706", backgroundColor: "#fffbf2" }}
      >
        <p className="text-base text-foreground">
          <span className="font-semibold">This document was too long to read in full.</span>{" "}
          The review covers roughly the first 300,000 characters, so anything
          after that point was not assessed.
        </p>
      </div>
    );
  }

  if (result.progress && result.overall !== undefined) {
    push(
      <ProgressBanner
        key="progress"
        progress={result.progress}
        overall={result.overall}
      />
    );
  }

  if (result.gap) push(<GapMirror key="gap" gap={result.gap} />);

  // The score needs all three dimensions, so the verdict carries the page
  // until they land rather than leaving a blank header while streaming.
  if (result.overall !== undefined && result.rating_name) {
    push(
      <ScoreDisplay
        key="score"
        result={result as EvaluationResult}
      />
    );
  } else if (result.verdict) {
    push(
      <div key="verdict-only" className="flex justify-center">
        <p
          className="max-w-xl text-center text-[1.7rem] font-bold italic leading-snug"
          style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}
        >
          {result.verdict}
        </p>
      </div>
    );
  }

  if (result.mirror_lead) {
    push(
      <MirrorSection
        key="mirror"
        lead={result.mirror_lead}
        bullets={result.mirror_bullets || []}
      />
    );
  }

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
    const next = !result.verdict
      ? "Reading your document"
      : !result.mirror_lead
        ? "Working out the so what"
        : !result.categories?.length
          ? "Scoring intent, delivery and narrative"
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
