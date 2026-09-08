/**
 * Turn raw tool input into safe values.
 *
 * Runs against finished tool input and against in-flight partial JSON, so every
 * field has to survive being absent, half-written or the wrong type. Nothing here
 * invents content: a missing field comes back empty, never filled with plausible
 * text, because a fabricated verdict is worse than a blank one.
 */
import {
  CATEGORIES,
  CategoryId,
  DOC_TYPE_LABELS,
  DocType,
  QUESTIONS,
} from "./questions";
import {
  CategoryVerdict,
  QuestionStatus,
  QuestionVerdict,
  TeamReviewResult,
  capOverall,
  normaliseCategoryScore,
  overallName,
} from "./team-types";

const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const VALID_QUESTION_IDS = new Set<string>(QUESTIONS.map((q) => q.id));
const VALID_DOC_TYPES = new Set<string>(Object.keys(DOC_TYPE_LABELS));
const VALID_STATUSES = new Set<string>([
  "answered",
  "partly",
  "not-answered",
  "not-applicable",
]);

export interface ShapedChallenge {
  doc_type: DocType;
  doc_type_uncertain: boolean;
  title: string;
  verdict: string;
  top_fixes: string[];
  categories: CategoryVerdict[];
  questions: QuestionVerdict[];
  proposed_overall: number;
  progress_summary: string;
  progress_addressed: string[];
  progress_outstanding: string[];
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function strArray(value: unknown, limit?: number): string[] {
  if (!Array.isArray(value)) return [];
  const items = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return limit ? items.slice(0, limit).map((s) => s.trim()) : items.map((s) => s.trim());
}

function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
  );
}

export function shapeChallenge(input: Record<string, unknown>): ShapedChallenge {
  const docTypeRaw = str(input.doc_type);
  const docType = VALID_DOC_TYPES.has(docTypeRaw)
    ? (docTypeRaw as DocType)
    : "board-paper";

  return {
    doc_type: docType,
    // An unrecognised type is the same situation as an undetermined one: the
    // strictest set was applied, and the reader should be told.
    doc_type_uncertain:
      input.doc_type_uncertain === true ||
      (docTypeRaw.length > 0 && !VALID_DOC_TYPES.has(docTypeRaw)),
    title: str(input.title),
    verdict: str(input.verdict),
    top_fixes: strArray(input.top_fixes, 3),
    categories: shapeCategories(input.categories),
    questions: shapeQuestions(input.questions),
    proposed_overall: shapeProposed(input.proposed_overall),
    progress_summary: str(input.progress_summary),
    progress_addressed: strArray(input.progress_addressed),
    progress_outstanding: strArray(input.progress_outstanding),
  };
}

function shapeProposed(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function shapeCategories(value: unknown): CategoryVerdict[] {
  const seen = new Set<CategoryId>();
  const out: CategoryVerdict[] = [];

  for (const row of rows(value)) {
    const id = str(row.id) as CategoryId;
    if (!VALID_CATEGORY_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);

    const definition = CATEGORIES.find((c) => c.id === id);
    const naReason = str(row.na_reason);

    // A category with no not-applicable bar cannot be waived, whatever the model
    // returned. Otherwise the hardest judgments are the ones that get skipped.
    const applicable = row.applicable === false ? !!definition?.naBar : true;

    out.push({
      id,
      score: applicable ? normaliseCategoryScore(row.score) : null,
      naReason: applicable ? undefined : naReason || "Not applicable to this document.",
      headline: str(row.headline),
      body: str(row.body),
    });
  }

  // Present in the library's order, so the review reads the same way every time.
  return out.sort(
    (a, b) =>
      CATEGORIES.findIndex((c) => c.id === a.id) -
      CATEGORIES.findIndex((c) => c.id === b.id)
  );
}

function shapeQuestions(value: unknown): QuestionVerdict[] {
  const seen = new Set<string>();
  const out: QuestionVerdict[] = [];

  for (const row of rows(value)) {
    const id = str(row.id);
    if (!VALID_QUESTION_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);

    const status = str(row.status);
    out.push({
      id,
      status: (VALID_STATUSES.has(status)
        ? status
        : "not-answered") as QuestionStatus,
      note: str(row.note),
    });
  }

  return out.sort(
    (a, b) =>
      QUESTIONS.findIndex((q) => q.id === a.id) -
      QUESTIONS.findIndex((q) => q.id === b.id)
  );
}

/** Counts for the ledger heading, e.g. "14 of 18 answered". */
export function tallyQuestions(questions: QuestionVerdict[]): {
  answered: number;
  partly: number;
  notAnswered: number;
  applicable: number;
} {
  const applicable = questions.filter((q) => q.status !== "not-applicable");
  return {
    answered: applicable.filter((q) => q.status === "answered").length,
    partly: applicable.filter((q) => q.status === "partly").length,
    notAnswered: applicable.filter((q) => q.status === "not-answered").length,
    applicable: applicable.length,
  };
}

/**
 * Turn in-flight tool input into something the review page can render.
 *
 * The overall is capped here exactly as it is on the finished result, so the
 * number does not jump when the stream lands. The craft layer is absent during
 * streaming because it is a second, parallel call; it appears when both finish.
 */
export function partialFromChallenge(
  input: Record<string, unknown>
): Partial<TeamReviewResult> {
  const shaped = shapeChallenge(input);
  const hasCategories = shaped.categories.some(
    (c) => typeof c.score === "number"
  );

  const overall = hasCategories
    ? capOverall(shaped.proposed_overall || 5, shaped.categories)
    : undefined;

  return {
    doc_type: shaped.doc_type,
    doc_type_uncertain: shaped.doc_type_uncertain,
    title: shaped.title,
    verdict: shaped.verdict,
    top_fixes: shaped.top_fixes,
    categories: shaped.categories,
    questions: shaped.questions,
    proposed_overall: shaped.proposed_overall,
    overall,
    overall_name: overall ? overallName(overall) : undefined,
    craft: null,
  };
}
