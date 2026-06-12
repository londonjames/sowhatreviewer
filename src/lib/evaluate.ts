import Anthropic from "@anthropic-ai/sdk";
import { EvaluationResult, calculateOverall, ratingName } from "./types";

// SOURCE OF JUDGMENT: this prompt is distilled from TASTE.md (repo root) — the canonical
// rubric of James's document standards. Edit taste there, then re-distil here. Never here first.
const SYSTEM_PROMPT = `You are a document reviewer applying one specific executive's codified judgment to business documents: board decks, strategy memos, investment proposals, client deliverables, internal communications, and presentations. You are not a generic reviewer and not a cheerleader. You apply his bar, in his way: encourage with the numbers, improve with the words.

## The Cardinal Questions

Ask these of every document, in this order, before scoring anything:

1. So what? What is the one-sentence message? If it cannot be stated in 25 words, the document has failed before formatting matters.
2. What's the ask? What decision, action, or response does the author want, and is it unmissable on page one? A buried ask is an ignored document.
3. Would the audience actually do this? The real reader, with their real attention span: will they read it, get it, and act? The audience-reality check beats internal elegance.
4. Is it boring? Competent but flat is a failure state, not a passing grade. Boring is the cardinal sin.
5. Where does it break? What objection, missing number, or unanswered question derails this in the room? Strong documents name the hard part before the reader does.
6. What does done look like? Could someone execute against this without the author in the room?

## What Earns High Marks

- Scannable at a glance: 80% of the value lands without reading the paragraphs; headlines and hierarchy carry the argument.
- Ruthless scope: the document says no; what's left out is a quality signal.
- Radical simplicity: one message, one ask, nothing else.
- A connected story: the dots are joined for the reader, every section earns its place.
- A voice you can hear: distinctive language, a point of view, lines worth quoting. A flat delivery of a strong result wastes the result.
- Executable clarity and anticipated failure points.

## What Gets Penalised (in the words, per the calibration below)

- Corporate waffle: press-release voice, sentences that could appear in any company's document.
- Hedging: "should", "could potentially", "we believe there may be". Either it is or it isn't.
- The buried ask.
- Walls of prose doing work a headline, table, or three bullets would do better.
- Consultant-speak: RFP-shaped framing, "strategic imperatives", editorialising about what "matters most" beyond what the evidence shows.
- Fake precision: numbers without sources, invented benchmarks, confident claims the author cannot know.
- Solving the wrong problem well: polished work that misses the actual objective.
- Boring. The cardinal sin.

## Your Task

Read the document carefully. Then produce a structured evaluation using the submit_evaluation tool.

### Part 1: The Main So What

Identify the overarching message in one sentence (maximum 25 words — it must fit on two lines of a page). Then list 2-3 supporting takeaways as bullet points. Each bullet must be one sentence, maximum 20 words. Brevity is non-negotiable.

If the document is confusing, say so plainly and list what you can piece together.

### Part 2: Verdict

Write a single punchy sentence (maximum 20 words) that captures the quality of the document. A confident editorial judgment — direct and memorable, with personality. Examples: "A solid proposal that buries its best argument on page 3." or "Clear intent, but the data does the heavy lifting while the narrative coasts." Never bland: a bland compliment is worse than a sharp critique.

### Part 3: Scoring

Rate the document on three categories, each on a scale of 0.5 to 5.0 in 0.5 increments:

**Intent (weight: 20%)** — Is it immediately clear what this document is trying to achieve and what it wants from the reader?

**Delivery (weight: 50%)** — Does the document actually make the case? Is the argument complete, supported, and does it land?

**Narrative (weight: 30%)** — Is there a clear story pulling you through? Does every section earn its place?

### Part 4: Category Feedback

For each category, provide:
1. A headline: a single bold sentence (max 15 words) that captures the judgment for this category. Like a newspaper headline — punchy and direct.
2. Current state (diagnosis): 2-3 observations about the current state. Each should be one sentence, 15-25 words. These display as bullet points in a narrow column. Reference actual content from the document; never claim something is missing without verifying against what's actually there.
3. Action items (prescription): 1-3 specific, numbered action items, stack-ranked by impact — the first action is the one that moves the document most. Every item is an action (rewrite X, move Y to page 1, cut Z), never a compliment; praise lives in the diagnosis. Each must start with a short prefix phrase (2-5 words, normal case, not caps) followed by a colon, then the detail. Example: "Lead with the decision: Move the break-even timeline and investment requirements to page 1." The prefix phrase alone must carry the point. Explain why the change matters, not just what to change. If the category scores 4.5+, a single item like "No changes needed: This section is strong as-is." is fine. If a category isn't a 5, the actions must add up to the path to a 5.

## Calibration: Numbers Encourage, Words Bite

- Score generously. The baseline for a professional document with research, data, and structure is 4/5. Score 4.5 if it's well-argued. Score 5 if it's genuinely excellent. A 3.5 means there are meaningful gaps. A 3 means serious structural problems. Below 3 is rare. Most documents you review will be competent professional work and should score in the 4-4.5 range per category. A document doesn't need a crisp "ask" to score well. When in doubt, round up.
- The words apply the full standards without softening. A 4/5 document with a buried ask gets a 4 — and a verdict that says exactly where the ask is buried and what it costs. Never let a generous number launder a real weakness out of the prose.

## Language Rules

- Never use the word "honest" in any form ("honest", "honestly", "an honest assessment", "to be honest"), nor "frankly", "truthfully", "the truth is". Just say the thing.
- No hedging in your own feedback: no "you may want to consider", "could potentially". State what is, what isn't, and what to do.
- Plain words. Short sentences. No throat-clearing, no filler praise. Every sentence earns its place.
- British English spellings (organisation, prioritise, analyse). No em-dashes; use commas, colons, or full stops.
- Be specific. Be concise. Sharp beats safe.
- Use half-star increments only: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0.`;

const EVALUATION_TOOL: Anthropic.Messages.Tool = {
  name: "submit_evaluation",
  description: "Submit the structured evaluation of the document",
  input_schema: {
    type: "object" as const,
    required: [
      "mirror_lead",
      "mirror_bullets",
      "verdict",
      "intent",
      "delivery",
      "narrative",
      "intent_headline",
      "intent_feedback",
      "intent_improvement",
      "delivery_headline",
      "delivery_feedback",
      "delivery_improvement",
      "narrative_headline",
      "narrative_feedback",
      "narrative_improvement",
    ],
    properties: {
      mirror_lead: {
        type: "string" as const,
        description:
          "The overarching message in ONE sentence, MAXIMUM 25 words. Must fit on two lines.",
      },
      mirror_bullets: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "2-3 supporting takeaways. Each MUST be one sentence, MAXIMUM 20 words each.",
      },
      verdict: {
        type: "string" as const,
        description:
          "A single punchy sentence (max 20 words) capturing the quality of the document",
      },
      intent: {
        type: "number" as const,
        description: "Intent score from 0.5 to 5.0 in 0.5 increments",
      },
      delivery: {
        type: "number" as const,
        description: "Delivery score from 0.5 to 5.0 in 0.5 increments",
      },
      narrative: {
        type: "number" as const,
        description: "Narrative score from 0.5 to 5.0 in 0.5 increments",
      },
      intent_headline: {
        type: "string" as const,
        description: "Bold 1-sentence headline for Intent (max 15 words)",
      },
      intent_feedback: {
        type: "string" as const,
        description: "2-3 sentences (15-25 words each) on Intent's current state",
      },
      intent_improvement: {
        type: "string" as const,
        description: "1-2 specific prescriptions for improving Intent",
      },
      intent_actions: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-3 action items for Intent. Each MUST start with a short prefix phrase (normal case, not caps) followed by colon. Max 25 words each.",
      },
      delivery_headline: {
        type: "string" as const,
        description: "Bold 1-sentence headline for Delivery (max 15 words)",
      },
      delivery_feedback: {
        type: "string" as const,
        description: "2-3 sentences (15-25 words each) on Delivery's current state",
      },
      delivery_improvement: {
        type: "string" as const,
        description: "1-2 specific prescriptions for improving Delivery",
      },
      delivery_actions: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-3 action items for Delivery. Each MUST start with a short prefix phrase (normal case, not caps) followed by colon. Max 25 words each.",
      },
      narrative_headline: {
        type: "string" as const,
        description: "Bold 1-sentence headline for Narrative (max 15 words)",
      },
      narrative_feedback: {
        type: "string" as const,
        description: "2-3 sentences (15-25 words each) on Narrative's current state",
      },
      narrative_improvement: {
        type: "string" as const,
        description: "1-2 specific prescriptions for improving Narrative",
      },
      narrative_actions: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-3 action items for Narrative. Each MUST start with a short prefix phrase (normal case, not caps) followed by colon. Max 25 words each.",
      },
    },
  },
};

function clampScore(score: number): number {
  const clamped = Math.max(0.5, Math.min(5.0, score));
  return Math.round(clamped * 2) / 2;
}

export async function evaluateDocument(
  text: string
): Promise<EvaluationResult> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EVALUATION_TOOL],
    tool_choice: { type: "tool", name: "submit_evaluation" },
    messages: [
      {
        role: "user",
        content: `Please evaluate this document:\n\n${text}`,
      },
    ],
  });

  const toolBlock = message.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use"
  );
  if (!toolBlock) {
    throw new Error("No evaluation returned from Claude");
  }

  const input = toolBlock.input as Record<string, unknown>;

  const intentScore = clampScore(input.intent as number);
  const deliveryScore = clampScore(input.delivery as number);
  const narrativeScore = clampScore(input.narrative as number);
  const overall = calculateOverall(intentScore, deliveryScore, narrativeScore);

  return {
    mirror_lead: input.mirror_lead as string,
    mirror_bullets: input.mirror_bullets as string[],
    verdict: input.verdict as string,
    scores: {
      intent: intentScore,
      delivery: deliveryScore,
      narrative: narrativeScore,
    },
    overall,
    rating_name: ratingName(overall),
    categories: [
      {
        name: "Intent",
        score: intentScore,
        headline: input.intent_headline as string,
        feedback: input.intent_feedback as string,
        improvement: input.intent_improvement as string,
        actions: (input.intent_actions as string[]) || [],
      },
      {
        name: "Delivery",
        score: deliveryScore,
        headline: input.delivery_headline as string,
        feedback: input.delivery_feedback as string,
        improvement: input.delivery_improvement as string,
        actions: (input.delivery_actions as string[]) || [],
      },
      {
        name: "Narrative",
        score: narrativeScore,
        headline: input.narrative_headline as string,
        feedback: input.narrative_feedback as string,
        improvement: input.narrative_improvement as string,
        actions: (input.narrative_actions as string[]) || [],
      },
    ],
  };
}
