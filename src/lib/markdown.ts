import { EvaluationResult } from "./types";

/** Plain-text export so a review can be pasted into email, Slack or a doc. */
export function reviewToMarkdown(result: Partial<EvaluationResult>): string {
  const out: string[] = [];

  out.push("# So What Review");
  if (result.overall !== undefined) {
    out.push(`**${result.overall}/100 — ${result.rating_name || ""}**`.trim());
  }
  if (result.verdict) out.push(result.verdict);

  if (result.gap) {
    out.push("\n## The Gap");
    out.push(`**What you meant:** ${result.gap.intended}`);
    out.push(`**What landed:** ${result.gap.landed}`);
    out.push(`**The gap:** ${result.gap.gap}`);
  }

  if (result.mirror_lead) {
    out.push("\n## The Main So What Your Doc Conveys");
    out.push(result.mirror_lead);
    for (const bullet of result.mirror_bullets || []) out.push(`- ${bullet}`);
  }

  for (const category of result.categories || []) {
    out.push(`\n## ${category.name} — ${category.score}/5`);
    if (category.headline) {
      out.push(`**${category.headline.replace(/\*\*/g, "")}**`);
    }
    if (category.feedback) out.push(category.feedback);
    if (category.actions?.length) {
      out.push("\nActions:");
      category.actions.forEach((action, i) => out.push(`${i + 1}. ${action}`));
    }
  }

  if (result.rewrites?.length) {
    out.push("\n## Rewrites You Can Paste In");
    for (const rewrite of result.rewrites) {
      out.push(`\n### ${rewrite.label}`);
      if (rewrite.why) out.push(`_${rewrite.why}_`);
      if (rewrite.before) out.push(`\n> Currently: ${rewrite.before}`);
      out.push(`\n${rewrite.after}`);
    }
  }

  if (result.red_team?.length) {
    out.push("\n## What You'll Get Asked");
    result.red_team.forEach((q, i) => out.push(`${i + 1}. ${q}`));
  }

  out.push("\n---\nReviewed against James Raybould's bar.");
  return out.join("\n");
}
