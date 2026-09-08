import { CategoryId, DocType, CATEGORIES } from "./questions";
import { EvaluationResult } from "./types";

export type QuestionStatus =
  | "answered"
  | "partly"
  | "not-answered"
  | "not-applicable";

export interface QuestionVerdict {
  id: string;
  status: QuestionStatus;
  /** One line saying why, citing the page or slide. Empty when answered cleanly. */
  note: string;
}

export interface CategoryVerdict {
  id: CategoryId;
  /** 1.0-5.0 in half steps, or null when the category is not applicable. */
  score: number | null;
  /** Stated reason, required when score is null. */
  naReason?: string;
  /** A punchy one-liner, max 15 words. */
  headline: string;
  /** 2-4 sentences to the author, citing pages or slides. */
  body: string;
}

/** 1-5 whole stars. The name states the edit round it implies. */
export const OVERALL_LEVELS: Record<
  number,
  { name: string; meaning: string; color: string }
> = {
  1: {
    name: "Start again",
    meaning: "The questions are unanswered because the thinking is not done.",
    color: "#dc2626",
  },
  2: {
    name: "Not ready",
    meaning: "Several categories unanswered. Expect more than one round.",
    color: "#ea580c",
  },
  3: {
    name: "One round away",
    meaning: "The substance is there. Specific gaps to close.",
    color: "#d97706",
  },
  4: {
    name: "Nearly there",
    meaning: "Minor gaps. Fix and send.",
    color: "#65a30d",
  },
  5: {
    name: "Send it",
    meaning: "Nothing here James sends back.",
    color: "#16a34a",
  },
};

export interface TeamReviewResult {
  doc_type: DocType;
  /** Set when the type could not be determined, so the strict set was applied. */
  doc_type_uncertain?: boolean;
  /** The document's own title, as found. */
  title: string;
  /** One sentence, max 20 words, on the state of the document. */
  verdict: string;
  /** At most three, ranked by how badly each would derail the meeting. */
  top_fixes: string[];
  categories: CategoryVerdict[];
  questions: QuestionVerdict[];
  /** Model's proposal, kept so the cap is auditable. */
  proposed_overall: number;
  /** The capped, floored figure that is actually shown. */
  overall: number;
  overall_name: string;
  /** The existing TASTE review, rendered inside the craft category. */
  craft: EvaluationResult | null;
  progress?: {
    previous_overall: number;
    addressed: string[];
    outstanding: string[];
    summary: string;
  };
}

/**
 * The overall is capped by the weakest category, never averaged.
 *
 * A weighted mean lets a well-written document with a fake problem score 3.8,
 * which is the exact failure this reviewer exists to catch. One broken leg sends
 * the document back, which is how James actually behaves.
 *
 * Computed here rather than asked of the model, so a review that likes the
 * document cannot talk its way past it.
 */
export function capOverall(
  proposed: number,
  categories: Pick<CategoryVerdict, "score">[]
): number {
  const scores = categories
    .map((c) => c.score)
    .filter((s): s is number => typeof s === "number" && s > 0);

  // Nothing scored means nothing to cap against; fall back to the proposal.
  if (!scores.length) return clampStars(Math.floor(proposed));

  const lowest = Math.min(...scores);
  const cap = lowest <= 1 ? 2 : lowest + 1;

  return clampStars(Math.floor(Math.min(proposed, cap)));
}

function clampStars(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, n));
}

export function overallName(overall: number): string {
  return OVERALL_LEVELS[clampStars(Math.round(overall))]?.name ?? "Not ready";
}

export function overallColor(overall: number): string {
  return OVERALL_LEVELS[clampStars(Math.round(overall))]?.color ?? "#ea580c";
}

/** Half-star steps, 1.0 to 5.0. Anything else is a malformed generation. */
export function normaliseCategoryScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const snapped = Math.round(value * 2) / 2;
  return Math.max(1, Math.min(5, snapped));
}

/** A category scoring at or above this collapses to one line. */
export const COLLAPSE_AT = 4.5;

export function categoryOrder(id: CategoryId): number {
  const index = CATEGORIES.findIndex((c) => c.id === id);
  return index === -1 ? CATEGORIES.length : index;
}
