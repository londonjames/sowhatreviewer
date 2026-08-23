export interface CategoryEvaluation {
  name: string;
  score: number; // 0.5-5.0 in 0.5 increments
  headline: string;
  feedback: string;
  improvement: string; // kept for backward compat
  actions: string[]; // 1-3 numbered action items
}

/** A specific passage rewritten, tied to one of the action items. */
export interface Rewrite {
  label: string; // "Opening paragraph", "The ask", "Investment summary table"
  why: string; // one sentence on what the rewrite fixes
  before?: string; // quoted from the document; absent when the content is new
  after: string; // the replacement, markdown table allowed
}

/** Shown only when the author told us what they meant to say. */
export interface GapMirror {
  intended: string;
  landed: string;
  gap: string;
}

export interface DocumentContext {
  audience?: string;
  intended?: string;
}

export interface EvaluationResult {
  mirror_lead: string;
  mirror_bullets: string[];
  verdict: string;
  scores: {
    intent: number;
    delivery: number;
    narrative: number;
  };
  overall: number;
  rating_name: string;
  categories: CategoryEvaluation[];
  rewrites: Rewrite[];
  red_team: string[];
  gap?: GapMirror;
  context?: DocumentContext;
  /** Set on a re-review: what changed since the previous pass. */
  progress?: {
    previous_overall: number;
    addressed: string[];
    outstanding: string[];
    summary: string;
  };
}

export function calculateOverall(
  intent: number,
  delivery: number,
  narrative: number
): number {
  return Math.round((intent / 5) * 20 + (delivery / 5) * 50 + (narrative / 5) * 30);
}

export function ratingName(score: number): string {
  if (score >= 90) return "Crystal Clear";
  if (score >= 80) return "On Point";
  if (score >= 70) return "Getting There";
  if (score >= 60) return "Hazy";
  if (score >= 40) return "Muddled";
  if (score >= 20) return "Lost";
  return "Nope";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "var(--score-green)";
  if (score >= 60) return "var(--score-amber)";
  return "var(--score-red)";
}
