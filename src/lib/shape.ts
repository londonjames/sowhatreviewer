import {
  CategoryEvaluation,
  DocumentContext,
  EvaluationResult,
  Rewrite,
  calculateOverall,
  ratingName,
} from "./types";

export interface ShapeOptions {
  context?: DocumentContext;
  previousOverall?: number;
}

function clampScore(score: number): number {
  const clamped = Math.max(0.5, Math.min(5.0, score));
  return Math.round(clamped * 2) / 2;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function strArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
  return items.length ? items : undefined;
}

function shapeCategory(
  input: Record<string, unknown>,
  key: string,
  name: string
): CategoryEvaluation | undefined {
  const rawScore = input[key];
  const headline = str(input[`${key}_headline`]);
  const feedback = str(input[`${key}_feedback`]);

  // A category is worth showing once it has a score and a headline.
  if (typeof rawScore !== "number" || !headline) return undefined;

  return {
    name,
    score: clampScore(rawScore),
    headline,
    feedback: feedback || "",
    improvement: str(input[`${key}_improvement`]) || "",
    actions: strArray(input[`${key}_actions`]) || [],
  };
}

function shapeRewrites(value: unknown): Rewrite[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rewrites: Rewrite[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const r = entry as Record<string, unknown>;
    const after = str(r.after);
    // Only show a rewrite once its replacement text has arrived.
    if (!after) continue;
    rewrites.push({
      label: str(r.label) || "Rewrite",
      why: str(r.why) || "",
      before: str(r.before),
      after,
    });
  }
  return rewrites.length ? rewrites : undefined;
}

/**
 * Turn raw tool input into an EvaluationResult, tolerating missing fields so
 * the same code path renders a mid-stream fragment and a finished evaluation.
 */
export function shapeResult(
  input: Record<string, unknown>,
  options: ShapeOptions = {}
): Partial<EvaluationResult> {
  const result: Partial<EvaluationResult> = {};

  const verdict = str(input.verdict);
  if (verdict) result.verdict = verdict;

  const mirrorLead = str(input.mirror_lead);
  if (mirrorLead) result.mirror_lead = mirrorLead;

  const mirrorBullets = strArray(input.mirror_bullets);
  if (mirrorBullets) result.mirror_bullets = mirrorBullets;

  const intended = options.context?.intended?.trim();
  const landed = str(input.gap_landed);
  const gapText = str(input.gap);
  if (intended && landed && gapText) {
    result.gap = { intended, landed, gap: gapText };
  }

  const categories = [
    shapeCategory(input, "intent", "Intent"),
    shapeCategory(input, "delivery", "Delivery"),
    shapeCategory(input, "narrative", "Narrative"),
  ].filter((c): c is CategoryEvaluation => !!c);
  if (categories.length) result.categories = categories;

  // The headline score only appears once all three dimensions have landed,
  // so it never jumps around as the stream fills in.
  if (categories.length === 3) {
    const [intent, delivery, narrative] = categories;
    result.scores = {
      intent: intent.score,
      delivery: delivery.score,
      narrative: narrative.score,
    };
    result.overall = calculateOverall(
      intent.score,
      delivery.score,
      narrative.score
    );
    result.rating_name = ratingName(result.overall);
  }

  const rewrites = shapeRewrites(input.rewrites);
  if (rewrites) result.rewrites = rewrites;

  const redTeam = strArray(input.red_team);
  if (redTeam) result.red_team = redTeam;

  if (options.context?.audience?.trim() || intended) {
    result.context = options.context;
  }

  if (typeof options.previousOverall === "number") {
    const summary = str(input.progress_summary);
    const addressed = strArray(input.progress_addressed) || [];
    const outstanding = strArray(input.progress_outstanding) || [];
    if (summary || addressed.length || outstanding.length) {
      result.progress = {
        previous_overall: options.previousOverall,
        addressed,
        outstanding,
        summary: summary || "",
      };
    }
  }

  return result;
}
