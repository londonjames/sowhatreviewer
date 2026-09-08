import Anthropic from "@anthropic-ai/sdk";
import { trackStream } from "./usage-logger";
import { CHALLENGE_SYSTEM_PROMPT } from "./team-prompt";
import { CATEGORIES, DOC_TYPE_LABELS, DocType, QUESTIONS } from "./questions";
import {
  CategoryVerdict,
  TeamReviewResult,
  capOverall,
  normaliseCategoryScore,
  overallName,
} from "./team-types";
import { evaluateDocument } from "./evaluate";
import { EvaluationResult } from "./types";
import { shapeChallenge } from "./team-shape";

const CHALLENGE_TOOL: Anthropic.Messages.Tool = {
  name: "submit_review",
  description:
    "Submit the challenge review: the questions James asks, whether the document answers them, and what to fix.",
  input_schema: {
    type: "object",
    properties: {
      doc_type: {
        type: "string",
        enum: Object.keys(DOC_TYPE_LABELS),
        description: "The document type, which governs the length threshold.",
      },
      doc_type_uncertain: {
        type: "boolean",
        description:
          "True when the type could not be determined and the board-paper set was applied.",
      },
      title: {
        type: "string",
        description:
          "The document's own title as found, or a short description of it if untitled. Maximum 10 words.",
      },
      verdict: {
        type: "string",
        description:
          "One sentence, maximum 20 words, on the state of the document. Plain and specific.",
      },
      top_fixes: {
        type: "array",
        items: { type: "string" },
        description:
          "At most three fixes, ranked by how badly each would derail the meeting. Each names the change and where it goes.",
      },
      categories: {
        type: "array",
        description: `All ${CATEGORIES.length} categories, in order: ${CATEGORIES.map((c) => c.id).join(", ")}.`,
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: CATEGORIES.map((c) => c.id) },
            applicable: {
              type: "boolean",
              description:
                "False only where the category's stated not-applicable bar is met.",
            },
            score: {
              type: "number",
              description:
                "1.0 to 5.0 in half-star steps. Ignored when applicable is false.",
            },
            na_reason: {
              type: "string",
              description:
                "Why the category does not apply. Required when applicable is false, empty otherwise.",
            },
            headline: {
              type: "string",
              description:
                "Maximum 15 words, plain and specific, describing what is true about the document.",
            },
            body: {
              type: "string",
              description:
                "2 to 4 sentences to the author, citing pages or slides, saying what is missing and what would fix it.",
            },
          },
          required: ["id", "applicable", "score", "headline", "body"],
        },
      },
      questions: {
        type: "array",
        description: `All ${QUESTIONS.length} questions, using the ids given in the prompt.`,
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: QUESTIONS.map((q) => q.id) },
            status: {
              type: "string",
              enum: ["answered", "partly", "not-answered", "not-applicable"],
            },
            note: {
              type: "string",
              description:
                "One line on what is missing and where, citing page or slide. Empty when answered.",
            },
          },
          required: ["id", "status", "note"],
        },
      },
      proposed_overall: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description:
          "Your overall, 1 to 5. The system caps it by the weakest category.",
      },
      progress_summary: {
        type: "string",
        description:
          "Re-review only: one sentence on what changed since the previous version.",
      },
      progress_addressed: {
        type: "array",
        items: { type: "string" },
        description: "Re-review only: what the author fixed.",
      },
      progress_outstanding: {
        type: "array",
        items: { type: "string" },
        description: "Re-review only: what still is not answered.",
      },
    },
    required: [
      "doc_type",
      "title",
      "verdict",
      "top_fixes",
      "categories",
      "questions",
      "proposed_overall",
    ],
  },
};

function buildUserContent(
  text: string,
  previous?: { overall: number; fixes: string[] }
): string {
  const parts: string[] = [];

  if (previous) {
    parts.push(
      `This is a re-review. The previous version scored ${previous.overall}/5 and was given these fixes:\n${previous.fixes
        .map((f, i) => `${i + 1}. ${f}`)
        .join(
          "\n"
        )}\nFill in progress_summary, progress_addressed and progress_outstanding based on what has changed. Score this version on its own merits, not on the effort of the revision.`
    );
  }

  parts.push(`Here is the document:\n\n${text}`);
  return parts.join("\n\n");
}

export interface TeamEvaluateOptions {
  previous?: { overall: number; fixes: string[] };
  /** Called with the accumulated partial tool-input JSON as it streams. */
  onPartial?: (partialJson: string) => void;
}

/**
 * The challenge layer and the craft layer run as two calls, not one.
 *
 * Craft reuses lib/evaluate.ts verbatim, so the TASTE rubric is never restated
 * and cannot drift from whatsthesowhat. Combining them into a single call would
 * mean duplicating that prompt here, and would have one 16k budget covering the
 * rubric, the rewrites, seven categories and eighteen question verdicts, with
 * the challenge layer losing whenever the model ran short.
 *
 * They run concurrently, so the wall-clock cost is the slower of the two.
 */
export async function evaluateForTeam(
  text: string,
  options: TeamEvaluateOptions = {},
  source?: string
): Promise<TeamReviewResult> {
  const [challenge, craft] = await Promise.all([
    runChallenge(text, options, source),
    // Craft is supporting detail: a failure there must not lose the review.
    evaluateDocument(text, {}, source).catch((error) => {
      console.error("Craft evaluation failed:", error);
      return null;
    }),
  ]);

  return stitch(challenge, craft, options.previous);
}

async function runChallenge(
  text: string,
  options: TeamEvaluateOptions,
  source?: string
): Promise<Record<string, unknown>> {
  const client = new Anthropic();

  const stream = trackStream(
    "sowhat",
    "team-review",
    client.messages.stream({
      model: "claude-opus-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: CHALLENGE_SYSTEM_PROMPT,
      tools: [CHALLENGE_TOOL],
      tool_choice: { type: "tool", name: "submit_review" },
      messages: [
        { role: "user", content: buildUserContent(text, options.previous) },
      ],
    }),
    { source }
  );

  // The model can emit more than one tool_use block, abandoning a botched first
  // attempt. Accumulate per block so a discarded attempt is never concatenated on.
  let accumulated = "";
  stream.on("streamEvent", (event) => {
    if (event.type === "content_block_start") {
      accumulated = "";
    } else if (
      event.type === "content_block_delta" &&
      event.delta.type === "input_json_delta"
    ) {
      accumulated += event.delta.partial_json;
      options.onPartial?.(accumulated);
    }
  });

  const message = await stream.finalMessage();

  const candidates = message.content.filter(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use" && block.name === CHALLENGE_TOOL.name
  );
  if (!candidates.length) {
    throw new Error("No review returned from Claude");
  }

  // Pick the most complete candidate rather than the first or last.
  const best = candidates.reduce((chosen, block) =>
    Object.keys(block.input as object).length >=
    Object.keys(chosen.input as object).length
      ? block
      : chosen
  );

  return best.input as Record<string, unknown>;
}

/**
 * TASTE scores 0-100. The craft category is out of five, so the bands are mapped
 * across rather than divided, keeping the same discrimination TASTE already has.
 */
export function craftScoreFromTaste(overall: number): number {
  if (overall >= 90) return 5;
  if (overall >= 80) return 4.5;
  if (overall >= 70) return 4;
  if (overall >= 60) return 3.5;
  if (overall >= 50) return 3;
  if (overall >= 40) return 2.5;
  if (overall >= 30) return 2;
  if (overall >= 20) return 1.5;
  return 1;
}

function stitch(
  input: Record<string, unknown>,
  craft: EvaluationResult | null,
  previous?: { overall: number; fixes: string[] }
): TeamReviewResult {
  const shaped = shapeChallenge(input);

  const categories: CategoryVerdict[] = shaped.categories.map((c) => {
    if (c.id !== "craft" || !craft) return c;

    // Two readings of craft exist: this model's, and the TASTE rubric's. Take the
    // lower, following the house rule that a score is never rounded up.
    const fromTaste = craftScoreFromTaste(craft.overall);
    const score =
      typeof c.score === "number" ? Math.min(c.score, fromTaste) : fromTaste;
    return { ...c, score };
  });

  const proposed = shaped.proposed_overall;
  const overall = capOverall(proposed, categories);

  return {
    doc_type: shaped.doc_type as DocType,
    doc_type_uncertain: shaped.doc_type_uncertain,
    title: shaped.title,
    verdict: shaped.verdict,
    top_fixes: shaped.top_fixes,
    categories,
    questions: shaped.questions,
    proposed_overall: proposed,
    overall,
    overall_name: overallName(overall),
    craft,
    progress: previous
      ? {
          previous_overall: previous.overall,
          addressed: shaped.progress_addressed,
          outstanding: shaped.progress_outstanding,
          summary: shaped.progress_summary,
        }
      : undefined,
  };
}

/** Re-exported so the API route can validate before saving. */
export function isUsableReview(result: TeamReviewResult): boolean {
  const scored = result.categories.filter(
    (c) => normaliseCategoryScore(c.score) !== null
  );
  return scored.length >= 4 && result.verdict.trim().length > 0;
}
