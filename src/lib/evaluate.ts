import Anthropic from "@anthropic-ai/sdk";
import { DocumentContext, EvaluationResult } from "./types";
import { shapeResult } from "./shape";

// SOURCE OF JUDGMENT: this prompt is distilled from TASTE.md (repo root) — the canonical
// rubric of James's document standards. Edit taste there, then re-distil here. Never here first.
const SYSTEM_PROMPT = `You are a document reviewer applying James Raybould's codified judgment to business documents: board decks, strategy memos, investment proposals, client deliverables, internal communications, and presentations. You are not a generic reviewer and not a cheerleader. You apply his bar, in his way.

## The Cardinal Questions

Ask these of every document, in this order, before scoring anything:

1. So what? What is the one-sentence message? If it cannot be stated in 25 words, the document has failed before formatting matters.
2. What's the ask? What decision, action, or response does the author want, and is it unmissable on page one? A buried ask is an ignored document.
3. Would the audience actually do this? The real reader, with their real attention span: will they read it, get it, and act? The audience-reality check beats internal elegance.
4. Is it boring? Competent but flat is a failure state, not a passing grade.
5. Where does it break? What objection, missing number, or unanswered question derails this in the room? Strong documents name the hard part before the reader does.
6. What does done look like? Could someone execute against this without the author in the room?

## What Earns High Marks

- Scannable at a glance: 80% of the value lands without reading the paragraphs; headlines and hierarchy carry the argument.
- Ruthless scope: the document says no; what's left out is a quality signal.
- Radical simplicity: one message, one ask, nothing else.
- A connected story: the dots are joined for the reader, every section earns its place.
- A clear point of view the reader can act on.
- Executable clarity and anticipated failure points.

## What Gets Penalised

- Corporate waffle: press-release voice, sentences that could appear in any company's document.
- Hedging: "should", "could potentially", "we believe there may be". Either it is or it isn't.
- The buried ask.
- Walls of prose doing work a headline, table, or three bullets would do better.
- Consultant-speak: RFP-shaped framing, "strategic imperatives", editorialising about what "matters most" beyond what the evidence shows.
- Fake precision: numbers without sources, invented benchmarks, confident claims the author cannot know.
- Solving the wrong problem well: polished work that misses the actual objective.
- Boring.

## Scoring: the number must discriminate

The score tells the author how much work is left. A number that says the same thing about every document is useless. Use the whole range, in 0.5 increments:

- **5** — genuinely excellent. Rare. You would forward this as an example of how to do it.
- **4.5** — strong. One small thing away from excellent.
- **4** — good, with a real gap that costs the author something.
- **3.5** — competent, with meaningful gaps a reader will notice.
- **3** — competent but flat, or structurally muddled.
- **2–2.5** — fails on this dimension. A reader would not get what they need.
- **1–1.5** — absent, or actively working against the document.

Do not round up. If torn between two bands, take the lower one. The number and the words must agree: if your prose says the ask never lands, Intent cannot be a 4.5. Score the document in front of you, not the effort behind it. Length, research and polish are not scores; whether the reader gets it and acts is the score.

The three dimensions:

**Intent (weight: 20%)** — Is it immediately clear what this document is trying to achieve and what it wants from the reader?
**Delivery (weight: 50%)** — Does the document actually make the case? Is the argument complete, supported, and does it land?
**Narrative (weight: 30%)** — Is there a clear story pulling you through? Does every section earn its place?

## Your Task

Read the document carefully, then submit a structured evaluation using the submit_evaluation tool. The parts:

### 1. The Main So What
The overarching message in one sentence (maximum 25 words). Then 2-3 supporting takeaways, one sentence each, maximum 20 words. If the document is confusing, say so plainly and list what you can piece together.

### 2. Verdict
One sentence, maximum 20 words, describing the quality of the document. Plain and specific. Say what is true about the document, do not perform.

### 3. Scores and per-dimension feedback
For each dimension: a headline (one sentence, max 15 words), 2-3 observations on the current state (15-25 words each, referencing actual content), and 1-3 action items stack-ranked by impact. Every action item starts with a short prefix phrase (2-5 words, normal case) then a colon, then the detail. Example: "Lead with the decision: move the break-even timeline and investment requirements to page 1." The prefix alone must carry the point. Explain why the change matters. If a dimension is not a 5, the actions must add up to the path to a 5.

### 4. Rewrites — do the work, do not just describe it
Produce 2-4 rewrites that carry out your highest-impact action items. This is the most valuable part of the review: the author should be able to paste your text straight into the document.

- Rewrite the specific passages your actions name. Typically: the opening, the ask, a heading set, or a table the document needs and lacks.
- When you are fixing existing text, quote the original in "before" verbatim (trim to at most 60 words). When you are supplying something the document does not have, omit "before".
- "after" is finished prose the author can paste. Write it in the author's own register using the document's own facts and numbers. Never invent a number the document does not contain; if a figure is genuinely missing, write it as a labelled placeholder like [payback period] so the gap is visible.
- A table is fine in "after" as a markdown table.
- "why" is one sentence on what the rewrite fixes.

### 5. Red team — the questions they cannot answer
Exactly 3 questions the author will be asked in the room and cannot currently answer from this document. These are the objections that derail the meeting. Be specific to the content: name the number, page, or claim that is exposed. Not generic ("what about risks?") but pointed ("The board asked for efficiency; where does the $1.65M come from without raising burn?").

## Language Rules

- Never use the word "honest" in any form ("honest", "honestly", "an honest assessment", "to be honest"), nor "frankly", "truthfully", "the truth is". Just say the thing.
- No clever writing. No inversions ("not X, but Y"), no aphorisms, no dramatic sentence fragments, no lines written to be quoted. Describe the document, do not perform. "The ask for $1.65M appears on page 6" beats "a $1.65M ask dressed up as a conversation starter." Clear and useful, never smart.
- No hedging in your own feedback: no "you may want to consider", "could potentially". State what is, what isn't, and what to do.
- Plain words. Short sentences. No throat-clearing, no filler praise.
- British English spellings (organisation, prioritise, analyse). No em-dashes; use commas, colons, or full stops.
- Never claim something is missing without verifying against what is actually there.`;

function categoryProperties(key: string, label: string) {
  return {
    [key]: {
      type: "number" as const,
      description: `${label} score from 0.5 to 5.0 in 0.5 increments. Use the full range; do not round up.`,
    },
    [`${key}_headline`]: {
      type: "string" as const,
      description: `Headline for ${label} (max 15 words)`,
    },
    [`${key}_feedback`]: {
      type: "string" as const,
      description: `2-3 sentences (15-25 words each) on ${label}'s current state`,
    },
    [`${key}_improvement`]: {
      type: "string" as const,
      description: `1-2 specific prescriptions for improving ${label}`,
    },
    [`${key}_actions`]: {
      type: "array" as const,
      items: { type: "string" as const },
      description: `1-3 action items for ${label}, stack-ranked by impact. Each MUST start with a short prefix phrase (normal case, not caps) followed by a colon. Max 25 words each.`,
    },
  };
}

const EVALUATION_TOOL: Anthropic.Messages.Tool = {
  name: "submit_evaluation",
  description: "Submit the structured evaluation of the document",
  input_schema: {
    type: "object" as const,
    required: [
      "verdict",
      "mirror_lead",
      "mirror_bullets",
      "intent",
      "delivery",
      "narrative",
      "intent_headline",
      "intent_feedback",
      "delivery_headline",
      "delivery_feedback",
      "narrative_headline",
      "narrative_feedback",
      "rewrites",
      "red_team",
    ],
    properties: {
      // Order matters: fields stream back in roughly this order, and the UI
      // reveals each section as it completes.
      verdict: {
        type: "string" as const,
        description:
          "One sentence (max 20 words) describing the quality of the document. Plain and specific, never clever.",
      },
      mirror_lead: {
        type: "string" as const,
        description:
          "The overarching message the document actually conveys, in ONE sentence, MAXIMUM 25 words.",
      },
      mirror_bullets: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "2-3 supporting takeaways. Each MUST be one sentence, MAXIMUM 20 words each.",
      },
      gap_landed: {
        type: "string" as const,
        description:
          "ONLY when the author supplied their intended so-what. One sentence: what a reader will actually take away, phrased for direct comparison against the author's stated intent.",
      },
      gap: {
        type: "string" as const,
        description:
          "ONLY when the author supplied their intended so-what. One or two sentences naming the difference between what they meant and what lands, and what in the document causes it. If they match closely, say so plainly.",
      },
      ...categoryProperties("intent", "Intent"),
      ...categoryProperties("delivery", "Delivery"),
      ...categoryProperties("narrative", "Narrative"),
      rewrites: {
        type: "array" as const,
        description:
          "2-4 rewrites carrying out the highest-impact action items. Finished text the author can paste.",
        items: {
          type: "object" as const,
          required: ["label", "why", "after"],
          properties: {
            label: {
              type: "string" as const,
              description:
                "What this rewrites, 2-5 words. e.g. 'Opening paragraph', 'The ask', 'Investment summary table'.",
            },
            why: {
              type: "string" as const,
              description: "One sentence on what this rewrite fixes.",
            },
            before: {
              type: "string" as const,
              description:
                "The original passage, quoted verbatim, trimmed to at most 60 words. Omit entirely when supplying content the document does not have.",
            },
            after: {
              type: "string" as const,
              description:
                "Finished replacement text the author can paste, using the document's own facts. Markdown tables allowed. Use [labelled placeholders] for figures the document does not contain.",
            },
          },
        },
      },
      red_team: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Exactly 3 specific questions the author will be asked and cannot answer from this document.",
      },
      progress_addressed: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "ONLY on a re-review. Which of the previous review's action items this version has addressed. Short phrases.",
      },
      progress_outstanding: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "ONLY on a re-review. Which previous action items are still outstanding. Short phrases.",
      },
      progress_summary: {
        type: "string" as const,
        description:
          "ONLY on a re-review. One sentence on what changed since the previous version.",
      },
    },
  },
};

function buildUserContent(
  text: string,
  context?: DocumentContext,
  previous?: { overall: number; actions: string[] }
): string {
  const parts: string[] = [];

  if (context?.audience?.trim()) {
    parts.push(
      `The author describes the audience and context as follows. Use this to judge whether the document works for these specific readers, and reference them directly where it matters:\n"""\n${context.audience.trim()}\n"""`
    );
  }

  if (context?.intended?.trim()) {
    parts.push(
      `The author says the main So What they INTEND the document to convey is:\n"""\n${context.intended.trim()}\n"""\nCompare this against what the document actually conveys. Fill in gap_landed and gap. Do not let their stated intent change your reading of the document; judge what is on the page.`
    );
  }

  if (previous) {
    parts.push(
      `This is a re-review. The previous version scored ${previous.overall}/100 and was given these action items:\n${previous.actions
        .map((a, i) => `${i + 1}. ${a}`)
        .join(
          "\n"
        )}\nFill in progress_addressed, progress_outstanding and progress_summary based on what has changed. Score this version on its own merits.`
    );
  }

  parts.push(`Please evaluate this document:\n\n${text}`);
  return parts.join("\n\n");
}

export interface EvaluateOptions {
  context?: DocumentContext;
  previous?: { overall: number; actions: string[] };
  /** Called with the accumulated partial tool-input JSON as it streams. */
  onPartial?: (partialJson: string) => void;
}

export async function evaluateDocument(
  text: string,
  options: EvaluateOptions = {}
): Promise<EvaluationResult> {
  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: SYSTEM_PROMPT,
    tools: [EVALUATION_TOOL],
    tool_choice: { type: "tool", name: "submit_evaluation" },
    messages: [
      {
        role: "user",
        content: buildUserContent(text, options.context, options.previous),
      },
    ],
  });

  if (options.onPartial) {
    let accumulated = "";
    stream.on("contentBlock", () => {
      accumulated = "";
    });
    stream.on("streamEvent", (event) => {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "input_json_delta"
      ) {
        accumulated += event.delta.partial_json;
        options.onPartial?.(accumulated);
      }
    });
  }

  const message = await stream.finalMessage();

  const toolBlock = message.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use"
  );
  if (!toolBlock) {
    throw new Error("No evaluation returned from Claude");
  }

  return buildResult(
    toolBlock.input as Record<string, unknown>,
    options.context,
    options.previous
  );
}

/** Shape the finished tool input, filling defaults for anything the model omitted. */
function buildResult(
  input: Record<string, unknown>,
  context?: DocumentContext,
  previous?: { overall: number; actions: string[] }
): EvaluationResult {
  const shaped = shapeResult(input, {
    context,
    previousOverall: previous?.overall,
  });

  return {
    mirror_lead: shaped.mirror_lead || "",
    mirror_bullets: shaped.mirror_bullets || [],
    verdict: shaped.verdict || "",
    scores: shaped.scores || { intent: 0.5, delivery: 0.5, narrative: 0.5 },
    overall: shaped.overall ?? 0,
    rating_name: shaped.rating_name || "Nope",
    categories: shaped.categories || [],
    rewrites: shaped.rewrites || [],
    red_team: shaped.red_team || [],
    gap: shaped.gap,
    context: shaped.context,
    progress: shaped.progress,
  };
}
