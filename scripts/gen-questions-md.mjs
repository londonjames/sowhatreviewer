/**
 * Regenerate QUESTIONS.md from src/lib/questions.ts.
 *
 * The TypeScript array is what ships; this file is what James edits and reads.
 * Generating one from the other means they cannot drift, which matters because a
 * question that exists in only one of them is a question the reviewer silently
 * does not ask. Run after editing either file: `node scripts/gen-questions-md.mjs`.
 */
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../src/lib/questions.ts", import.meta.url);
const src = readFileSync(path, "utf8");

// Strip the type annotations and imports, leaving plain JS the runtime can eval.
const js = src
  .replace(/^import[\s\S]*?;\s*$/gm, "")
  .replace(/^export type [\s\S]*?;\s*$/gm, "")
  .replace(/^export interface [\s\S]*?^}\s*$/gms, "")
  .replace(/: (ReviewQuestion|Category)\[\]/g, "")
  .replace(/: Record<DocType, string>/g, "")
  .replace(/export (const|function)/g, "$1")
  .replace(/\(category: CategoryId\)[\s\S]*?\n}/g, "() {}")
  .replace(/\(id: CategoryId\)[\s\S]*?\n}/g, "() {}")
  .replace(/\(id: string\)[\s\S]*?\n}/g, "() {}")
  .replace(/: string/g, "")
  .replace(/: ReviewQuestion \| undefined/g, "");

const { CATEGORIES, QUESTIONS, LENGTH_THRESHOLDS, DOC_TYPE_LABELS } = new Function(
  `${js}; return { CATEGORIES, QUESTIONS, LENGTH_THRESHOLDS, DOC_TYPE_LABELS };`
)();

const lines = [];
lines.push("# QUESTIONS.md — What James Asks");
lines.push("");
lines.push("**GENERATED FILE. Do not edit by hand.**");
lines.push("");
lines.push(
  "The questions live in `src/lib/questions.ts`, which is what the prompt, the tool schema and the review page all read."
);
lines.push(
  "This file is rendered from it by `scripts/gen-questions-md.mjs` so the library is readable without opening the code,"
);
lines.push(
  "and so the two can never drift. Edit the TypeScript, run the script, commit both."
);
lines.push("");
lines.push(
  "This is the **challenge** axis: whether the thinking behind the document holds up."
);
lines.push(
  "[TASTE.md](TASTE.md) is the **craft** axis: whether the argument is well made. Neither restates the other."
);
lines.push(
  "A document can score well on TASTE and still be conservative, over-resourced, and solving a problem nobody has."
);
lines.push("");
lines.push("Every question carries three parts:");
lines.push("");
lines.push("- **The question** — in James's words, as the reviewer puts it to the author.");
lines.push("- **Fires when** — what in a document makes the question apply.");
lines.push(
  "- **Clears when** — the substantive bar that answers it. Never the presence of a section: a reviewer built from"
);
lines.push(
  "  completeness checks gets gamed by adding a \"Risks\" heading with nothing under it."
);
lines.push("");
lines.push("---");
lines.push("");
lines.push("## Document types");
lines.push("");
lines.push(
  "The reviewer infers the type and states it. The type governs which questions apply and the length threshold used by The Craft."
);
lines.push("If the type is unclear the reviewer says so and applies the board-paper set, which is the strictest.");
lines.push("");
lines.push("| Type | Length threshold |");
lines.push("|------|------------------|");
for (const [key, label] of Object.entries(DOC_TYPE_LABELS)) {
  lines.push(`| ${label} (\`${key}\`) | ${LENGTH_THRESHOLDS[key]} |`);
}
lines.push("");
lines.push("---");
lines.push("");

CATEGORIES.forEach((category, i) => {
  const questions = QUESTIONS.filter((q) => q.category === category.id);
  lines.push(`## ${i + 1}. ${category.name}`);
  lines.push("");
  lines.push(`> ${category.premise}`);
  lines.push("");
  lines.push(
    category.naBar
      ? `May be marked not applicable ${category.naBar}, with a stated reason.`
      : "Never not applicable."
  );
  lines.push("");
  for (const q of questions) {
    lines.push(`### \`${q.id}\``);
    lines.push("");
    lines.push(`**"${q.question}"**`);
    lines.push("");
    lines.push(`- **Fires when:** ${q.firesWhen}`);
    lines.push(`- **Clears when:** ${q.clearsWhen}`);
    if (q.appliesTo) lines.push(`- **Applies to:** ${q.appliesTo.join(", ")}`);
    lines.push("");
  }
});

lines.push("---");
lines.push("");
lines.push("## Scoring");
lines.push("");
lines.push("Each category scores 1.0 to 5.0 in half-star steps.");
lines.push("");
lines.push("- **5.0** — nothing to add. James would forward this as an example of how to do it.");
lines.push("- **4.0–4.5** — answered, with one gap that costs the author something.");
lines.push("- **3.0–3.5** — partly answered. The reader gets some of what they need.");
lines.push("- **2.0–2.5** — asserted rather than answered.");
lines.push("- **1.0–1.5** — not addressed at all.");
lines.push("");
lines.push(
  "The overall is **capped by the weakest category, never averaged**: `floor(min(proposal, lowest + 1.0))`, and any"
);
lines.push(
  "category at 1.0 caps the overall at 2. A weighted mean lets a well-written document with a fake problem score 3.8,"
);
lines.push(
  "which is the failure this reviewer exists to catch. The cap is computed in `src/lib/team-types.ts`, not asked of the"
);
lines.push("model, and is tested by `scripts/test-cap.mjs`.");
lines.push("");
lines.push("| Stars | Name | Meaning |");
lines.push("|-------|------|---------|");
lines.push("| 1 | Start again | The questions are unanswered because the thinking is not done. |");
lines.push("| 2 | Not ready | Several categories unanswered. Expect more than one round. |");
lines.push("| 3 | One round away | The substance is there. Specific gaps to close. |");
lines.push("| 4 | Nearly there | Minor gaps. Fix and send. |");
lines.push("| 5 | Send it | Nothing here James sends back. |");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## Adding a question");
lines.push("");
lines.push("1. Add the entry to `QUESTIONS` in `src/lib/questions.ts`, with a stable `id`.");
lines.push("2. Run `node scripts/gen-questions-md.mjs` to regenerate this file.");
lines.push("3. Deploy. The prompt, the tool schema and the ledger all pick it up with no other change.");
lines.push("");
lines.push(
  "Write `clearsWhen` so it can be checked against the page. \"Has a risks section\" is not a bar; \"each risk names an owner and a mitigation date\" is."
);
lines.push("");

writeFileSync(new URL("../QUESTIONS.md", import.meta.url), lines.join("\n"));
console.log(
  `QUESTIONS.md written: ${CATEGORIES.length} categories, ${QUESTIONS.length} questions`
);
