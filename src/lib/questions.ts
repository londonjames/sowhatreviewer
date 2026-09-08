/**
 * The question library: what James actually asks when a document lands on his desk.
 *
 * SOURCE OF JUDGMENT: this file is canonical. The prompt, the tool schema and the
 * review page all read it, so one definition drives all three.
 *
 * QUESTIONS.md at the repo root is a rendering of this array, produced by
 * scripts/gen-questions-md.mjs, so the library is readable without opening code.
 * Adding a question is one entry here, then `node scripts/gen-questions-md.mjs`.
 * Nothing else changes: no prompt edit, no schema edit, no UI edit.
 *
 * This is the challenge axis. TASTE.md remains canonical for craft, and the craft
 * category below defers to it rather than restating it.
 */

export type CategoryId =
  | "ask"
  | "problem"
  | "thinking"
  | "cost"
  | "plan"
  | "room"
  | "craft";

export type DocType =
  | "board-paper"
  | "strategy-memo"
  | "brief"
  | "status-update"
  | "client-deliverable"
  | "internal-comms";

export interface ReviewQuestion {
  /** Stable across edits: the re-review diff is keyed on this, not on prose. */
  id: string;
  category: CategoryId;
  /** In James's words, as the reviewer puts it to the author. */
  question: string;
  /** What in a document makes this question apply. */
  firesWhen: string;
  /** The substantive bar that answers it. Never the presence of a section. */
  clearsWhen: string;
  /** Absent means every document. */
  appliesTo?: DocType[];
}

export interface Category {
  id: CategoryId;
  /** Display name, e.g. "The Ask". */
  name: string;
  /** The one question behind the category, shown under the heading. */
  premise: string;
  /**
   * When this category may be marked not applicable. Absent means never:
   * without an explicit bar the model uses N/A to duck a hard judgment.
   */
  naBar?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "ask",
    name: "The Ask",
    premise:
      "What do you want from me, and what am I on the hook for beyond saying yes?",
  },
  {
    id: "problem",
    name: "The Problem",
    premise: "Is this real, is it ours, and why now?",
  },
  {
    id: "thinking",
    name: "The Thinking",
    premise:
      "Is this ambitious and rigorous, or hedged, lazy and already tried?",
  },
  {
    id: "cost",
    name: "The Cost",
    premise: "What does this displace, and who else does it land on?",
    naBar:
      "only if the document requests no resources and proposes no new work for anyone",
  },
  {
    id: "plan",
    name: "The Plan",
    premise:
      "Who owns it, what is true by when, and how much do we spend before we know?",
    naBar:
      "only if the document asks for no decision and proposes no action of any kind",
  },
  {
    id: "room",
    name: "The Room",
    premise: "Who has seen this, and who disagrees?",
  },
  {
    id: "craft",
    name: "The Craft",
    premise: "Does the length earn itself, and does it read?",
  },
];

export const QUESTIONS: ReviewQuestion[] = [
  // ---------------------------------------------------------------- The Ask
  {
    id: "goal-and-ask",
    category: "ask",
    question: "What do you need from me, and by when?",
    firesWhen: "Always.",
    clearsWhen:
      "Page one names the decision, the person who has to make it, and the date it is needed by. A document that states 'for information, no action required' clears this too, provided it says so.",
  },
  {
    id: "recommendation-not-menu",
    category: "ask",
    question: "What do you actually think we should do?",
    firesWhen:
      "Options are laid out neutrally and the choice is left to the reader.",
    clearsWhen:
      "One option is recommended by name, and the others are rejected with a stated reason. Presenting three options and calling the third 'our preference' in an appendix does not clear it.",
  },
  {
    id: "hook-beyond-approval",
    category: "ask",
    question: "What am I on the hook for beyond approving this?",
    firesWhen: "Always, where the reader is an approver.",
    clearsWhen:
      "Every call on the reader's time is listed in one place: introductions, customer calls, board slots, escalations, hiring panels. Mentions scattered through the body do not clear it.",
  },

  // ------------------------------------------------------------ The Problem
  {
    id: "fake-problems",
    category: "problem",
    question: "Who asked for this, and how do we know the problem is real?",
    firesWhen:
      "A problem is stated with no evidence, no size and no requester; work sits outside the document's own stated remit; or a solution arrives before the problem has been sized.",
    clearsWhen:
      "Each problem names a source (a named customer, a metric, a specific request) and a size (what not fixing it costs, in money, time or risk). Anything outside remit is flagged as outside remit rather than smuggled in.",
  },
  {
    id: "do-nothing-case",
    category: "problem",
    question: "What happens if we do not do this?",
    firesWhen: "Any proposal.",
    clearsWhen:
      "The cost of inaction is stated with a number or a dated consequence. 'We would fall behind' does not clear it; 'we lose the two renewals due in March' does.",
  },
  {
    id: "why-now",
    category: "problem",
    question: "What makes this the right quarter rather than next?",
    firesWhen: "Any proposal with a start date.",
    clearsWhen:
      "The urgency is tied to something dated and external: a contract, a competitor move, a regulatory date, a customer commitment. Internal readiness is not urgency.",
  },

  // ----------------------------------------------------------- The Thinking
  {
    id: "false-limitations",
    category: "thinking",
    question:
      "Which of these constraints did someone actually impose, and which did you assume?",
    firesWhen:
      "A constraint is stated as given with no source (budget, headcount, timeline, tooling, 'we can't because'); targets are last year's number plus a bit; a scoped-down option is presented as the only option.",
    clearsWhen:
      "Every stated constraint is either sourced (a named person said no, a contract, a hard technical limit) or explicitly tested with what it would be worth to break it. An ambition case sits beside the base case.",
  },
  {
    id: "cheaper-paths",
    category: "thinking",
    question:
      "What is the version of this that does not need more people or money?",
    firesWhen:
      "Any resource request: headcount, budget, tooling, vendor, or time.",
    clearsWhen:
      "At least one no-new-resource option is named and rejected with a reason, and the ask states its marginal return (what the extra buys, per unit). Stopping or deprioritising existing work counts as an option, and is usually the one missing.",
  },
  {
    id: "precedent",
    category: "thinking",
    question: "Have we tried this before, and what happened?",
    firesWhen:
      "The proposal resembles work the organisation has attempted before, or the document is silent about history in an area that plainly has some.",
    clearsWhen:
      "Prior attempts are named with what happened and what is different this time. 'This time we have executive sponsorship' is not a difference unless the last attempt lacked it.",
  },
  {
    id: "which-numbers-believed",
    category: "thinking",
    question: "Which of these numbers are known and which are guesses?",
    firesWhen:
      "Estimates and actuals appear in the same table, paragraph or chart without distinction; or a figure carries more precision than its source can support.",
    clearsWhen:
      "Each figure is marked as actual, estimate or assumption, and the actuals carry a source. A single line saying which of the model's inputs are assumed also clears it.",
  },

  // --------------------------------------------------------------- The Cost
  {
    id: "what-we-stop",
    category: "cost",
    question: "If we do this, what comes off the list?",
    firesWhen: "Any proposal that adds work.",
    clearsWhen:
      "The displaced work is named specifically, or the document states there is spare capacity and says exactly where it is. Silence assumes infinite capacity and does not clear it.",
  },
  {
    id: "lands-on-others",
    category: "cost",
    question: "Who else does this land on?",
    firesWhen:
      "The proposal creates work, dependencies or risk outside the proposing team.",
    clearsWhen:
      "Affected teams are named and their cost is counted in the total, not just the proposing team's. A dependency listed without an estimate of what it costs that team does not clear it.",
  },

  // --------------------------------------------------------------- The Plan
  {
    id: "owner-and-dates",
    category: "plan",
    question: "Who owns this, and what is true by when?",
    firesWhen: "Any plan.",
    clearsWhen:
      "A named individual owns each workstream and dated milestones exist. 'The team will' and 'in H2' do not clear it.",
  },
  {
    id: "how-we-know-it-worked",
    category: "plan",
    question:
      "What is the number that tells us this was right, and when do we check it?",
    firesWhen: "Any proposal.",
    clearsWhen:
      "A success metric with a target value and a review date is stated before the work starts, and it is a measure of outcome rather than of activity. Shipping the thing is not the metric.",
  },
  {
    id: "reversibility-checkpoint",
    category: "plan",
    question: "How much do we spend before we know if it is working?",
    firesWhen:
      "Any commitment above a material threshold, or any decision that is hard to reverse.",
    clearsWhen:
      "The commitment is staged, with a named decision point, what will be known at it, and a stop condition. A plan that only describes success does not clear it.",
  },

  // --------------------------------------------------------------- The Room
  {
    id: "who-has-seen-it",
    category: "room",
    question: "Who has seen this, and who disagrees?",
    firesWhen: "Any document that will be decided in a room.",
    clearsWhen:
      "The document names who has reviewed it, particularly the functions whose budget, people or roadmap it touches, and states any unresolved objection in the objector's own terms. 'Aligned with stakeholders' does not clear it.",
  },

  // -------------------------------------------------------------- The Craft
  {
    id: "length-earns-itself",
    category: "craft",
    question: "Why is this this long?",
    firesWhen:
      "Length exceeds the threshold for the document type; sections do not feed the ask; appendix material sits in the body; background the reader already has is restated.",
    clearsWhen:
      "Every section is load-bearing: deleting it would change the decision. Name the sections that fail that test and state a target length.",
  },
  {
    id: "taste-rubric",
    category: "craft",
    question: "Does it read? Is the point on the page?",
    firesWhen: "Always.",
    clearsWhen:
      "The document clears the TASTE bar: a stateable So What, an unmissable ask, scannable structure, a connected story, no corporate waffle, no hedging, no fake precision, and not boring.",
  },
];

/** Length thresholds by document type, used by the craft category. */
export const LENGTH_THRESHOLDS: Record<DocType, string> = {
  "board-paper": "8 pages",
  "strategy-memo": "5 pages",
  brief: "4 pages",
  "status-update": "2 pages",
  "client-deliverable": "no fixed threshold; judge the length against the ask",
  "internal-comms": "1 page",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  "board-paper": "Board paper or investment proposal",
  "strategy-memo": "Strategy memo",
  brief: "Project or product brief",
  "status-update": "Status update",
  "client-deliverable": "Client deliverable",
  "internal-comms": "Internal communication",
};

export function questionsFor(category: CategoryId): ReviewQuestion[] {
  return QUESTIONS.filter((q) => q.category === category);
}

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function questionById(id: string): ReviewQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
