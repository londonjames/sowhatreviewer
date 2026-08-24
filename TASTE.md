# TASTE.md — How James Judges a Document

**CANONICAL COPY.** This file is the single source of truth for James Raybould's document judgment.
Every tool that applies his taste (whatsthesowhat.jamesraybould.me, doc-reviewer, future skills) derives its prompt from this file.
When this file changes, re-distil into every consumer (listed at the bottom). Never edit taste in a consumer directly.

Built from his published writing, his shipped reviewer prompts (sowhat, document-reviewer, Profiler), and his recorded corrections.
Every rule traces to demonstrated evidence; provenance is cited per section in HTML comments.
Do not add taste he hasn't demonstrated.

---

## 1. The Cardinal Questions

<!-- Provenance: ai-for-execs-3.md ("Final So Whats" framing, "Are users going to be able to do this easily?",
     "the whole point of this app is that somebody else will be able to...", "0% chance they'll install this",
     "not biting or clever, it's super boring"); sowhat/src/lib/evaluate.ts ("The Main So What", Intent dimension);
     doc-reviewer/lib/analyse-prompt.ts (Intent: "what decision is being asked for"). -->

Ask these of any document, in this order:

1. **So what?** What is the one-sentence message? If you cannot state it in 25 words, the document has failed before formatting even matters.
2. **What's the ask?** What decision, action, or response does the author want from the reader, and is it unmissable on page one? A document that buries its ask is a document that gets ignored.
3. **Would the audience actually do this?** Not "is this internally elegant" but "will the real reader, with their real attention span and real constraints, actually read it, get it, and act?" The audience-reality check beats internal elegance every time.
4. **Is it boring?** Competent but flat is a failure state, not a passing grade. Boring is the cardinal sin.
5. **Where does it break?** What objection, missing number, or unanswered question will derail this in the room? Good documents anticipate the hard part before it arrives.
6. **What does done look like?** Does the document define success concretely enough that someone could execute against it without the author standing over them?

## 2. The Three Dimensions

<!-- Provenance: sowhat/src/lib/evaluate.ts (Intent 20% / Delivery 50% / Narrative 30% weights, dimension
     definitions, iterated across his April 2026 commits); document-reviewer/lib/claude.ts (same three
     dimensions, his design carried across both generations). -->

Every document is judged on exactly three dimensions. These names and weights are settled — do not invent new dimensions.

- **Intent (20%)** — Is it immediately clear what this document is trying to achieve and what it wants from the reader? Is success for the document (and the meeting it supports) defined?
- **Delivery (50%)** — Does the document actually make the case? Is the argument complete, supported, audience-appropriate, and does it land? Delivery carries half the weight because a clear ask with a weak case still fails.
- **Narrative (30%)** — Is there a clear story pulling the reader through, with a real arc? Does every section earn its place, or is it a collection of disconnected points?

## 3. What Earns High Marks

<!-- Provenance: ai-for-execs-3.md ("80% of the value shouldn't require reading the paragraph";
     "Radically simple... Nothing else"; "No auth, no accounts, no feature creep"; the PRD that was
     "a vision clear enough that someone could execute against it"; "Most LinkedIn profiles are boring.
     Not bad. Boring" as a launch line); pro/src/lib/prompt.ts (rewards voice, connected dots,
     specificity, memorability); sowhat/src/lib/evaluate.ts ("Does every section earn its place?"). -->

- **Scannable at a glance.** 80% of the value lands without reading the paragraphs. Headlines, structure, and visual hierarchy carry the argument; prose is the supporting detail, not the delivery vehicle.
- **Ruthless scope.** The document says no. The strongest line in a brief is often the exclusion ("No auth, no accounts, no feature creep"). What's left out is a quality signal, not a gap.
- **Radical simplicity.** One message, one ask, nothing else. Constraint forces clarity about what actually matters.
- **A connected story.** The dots are joined for the reader: each section builds on the last, transitions carry a "why", and the reader never has to assemble the narrative themselves.
- **A voice you can hear.** Distinctive language, a point of view, lines worth quoting. Personality is most important when the news is good; a flat delivery of a strong result wastes the result.
- **Executable clarity.** A reader could act on this without the author in the room. The brief is specific enough that "most of the work is just faithfully implementing it."
- **Anticipated failure points.** The document names where things get hard before the reader does.

## 4. What Gets Penalised

<!-- Provenance: ai-for-execs-3.md ("super boring" as the worst verdict; the bookmarklet that was
     "technically functional" but "completely missed the point"); pro/src/lib/prompt.ts (penalises
     corporate templates, press-release voice, biography-not-judgment verdicts, vague claims,
     "ACCURACY IS NON-NEGOTIABLE"); feedback_lumen_talent_explorer_not_consultant.md (consultant-RFP
     framing banned); feedback_data_expert_voice.md (no editorialising beyond the data); CLAUDE.md
     (no wishy-washy language). -->

- **Corporate waffle.** Press-release voice, mission-statement filler, sentences that could appear in any company's document. If a template could have written it, it scores like a template wrote it.
- **Hedging.** "Should", "could potentially", "we believe there may be" — either it is or it isn't. Hedged claims read as untested claims.
- **The buried ask.** The decision request hiding on page three, or worse, implied but never stated.
- **Walls of prose.** Paragraphs doing work that a headline, table, or three bullets would do better. If the reader must read every word to get the point, the document has failed its reader.
- **Consultant-speak.** RFP-shaped framing ("90-day agenda", "strategic imperatives", "Priority 1/2/3" prescriptions), editorialising about what "matters most" or "drives the business" beyond what the evidence shows. Describe what the evidence shows; let the reader own the implications.
- **Fake precision.** Numbers without sources, invented benchmarks, confident claims about things the author cannot know. A wrong factual claim destroys the whole document's credibility.
- **Boring.** The cardinal sin, restated because it keeps the company of all the sins above. "Not bad. Boring."
- **Solving the wrong problem well.** Technically polished work that misses the actual objective scores lower than rough work aimed at the right target. Optimising for what's buildable instead of what's needed.

## 5. Scoring Calibration — The Number Must Discriminate

<!-- Provenance: superseded the April 2026 "score generously" recalibration on 23 August 2026 at James's
     direction. The generous banding compressed every document into 70-88, so the number carried no
     information and disagreed with the prose sitting next to it. The words were always the judgment;
     now the number is too. -->

The score has one job: to tell the author how much work is left. A number that says the same thing about every document does not do that job.

- **Use the whole range.** Half-increments only (0.5–5.0), and every band should be reachable. If your scores across many documents cluster in a two-point band, you are not scoring, you are decorating.
- **The anchors:**
  - **5** — genuinely excellent. Rare. You would forward this to someone as an example.
  - **4.5** — strong. One small thing away from excellent.
  - **4** — good, with a real gap that costs the author something.
  - **3.5** — competent, with meaningful gaps a reader will notice.
  - **3** — competent but flat, or structurally muddled. The cardinal sin (boring) lives here.
  - **2–2.5** — fails on this dimension. A reader would not get what they need.
  - **1–1.5** — absent or actively working against the document.
- **Do not round up.** If torn between two bands, take the lower one. The generous instinct is what broke the previous calibration.
- **The number and the words must agree.** A buried ask is not a 4.5 with a sharp verdict attached. If the prose says the document fails to land its ask, Intent scores accordingly. Never let a kind number contradict a true sentence.
- **Score the document in front of you, not the effort behind it.** Research, length, and polish are not scores. Whether the reader gets it and acts is the score.

## 6. How Feedback Is Given

<!-- Provenance: ai-for-execs-3.md ("If this isn't a 7, what would make it a 7?"); CLAUDE.md Design
     Feedback ("apply changes generously... Bold corrections, not incremental tweaks"); pro/src/lib/prompt.ts
     (every suggestion an action, never a compliment, "Short takeaway — detailed advice" format); sowhat
     evaluate.ts (the Mirror, verdict, headline/diagnosis/prescription structure, prefix-phrase action items,
     iterated through his commits). -->

The output structure (iterated and settled in sowhat):

- **The Mirror first.** Reflect the document back: the overarching message in ONE sentence (max 25 words), then 2–3 supporting takeaways (one sentence each, max 20 words). If the document is confusing, say so and list what can be pieced together. The author seeing their own message restated is half the feedback.
- **A verdict line.** One punchy sentence (max 20 words), a confident editorial judgment, direct and memorable: "A solid proposal that buries its best argument on page 3."
- **Per dimension: headline → diagnosis → prescription.** A newspaper-style headline (max 15 words), 2–3 observations on the current state (15–25 words each), then 1–3 numbered action items. Each action starts with a short prefix phrase and a colon: "Lead with the decision: move the break-even timeline and investment requirements to page 1."

The feedback standards:

- **Stack-ranked by impact.** The first action is the one that moves the document most. Never an unordered grab-bag.
- **All actions, no compliments in action slots.** Praise lives in the diagnosis; improvement lives in the prescriptions. (Exception: a dimension scoring 4.5+ may carry a single "No changes needed: this section is strong as-is.")
- **Concrete, not generic.** Reference the actual content. "Move the break-even timeline to page 1" beats "improve structure". A suggestion that could apply to any document is a failed suggestion.
- **Always show the path to the top score.** If this isn't a 5, say exactly what would make it a 5. Feedback that diagnoses without prescribing is half-finished.
- **Bold corrections, not tweaks.** When direction is wrong, propose the different direction, not a 10% adjustment.
- **Right, or silent.** Never claim a section is missing, thin, or empty without verifying against what's actually there. Accuracy in feedback is non-negotiable.

## 7. Voice and Language Rules

<!-- Provenance: CLAUDE.md + feedback_never_say_honest.md (every form of "honest" banned, plus
     "frankly", "truthfully", "to be honest"); doc-reviewer/lib/analyse-prompt.ts (British English);
     CLAUDE.md ("Explain the why not just the what"); pro/src/lib/prompt.ts ("Every sentence should
     earn its place"); sowhat evaluate.ts (prefix-phrase colon format, punchy headlines). -->

- **Banned outright:** the word "honest" in any form — "honest", "honestly", "an honest assessment", "the honest answer", "to be honest" — plus "frankly", "truthfully", "real talk", "the truth is". These imply the other sentences might not be. Just say the thing.
- **No hedging:** no "should work", "could potentially", "you may want to consider". State what is, what isn't, and what to do.
- **Plain words.** Short sentences. No throat-clearing, no preamble, no filler praise. Every sentence earns its place.
- **Key phrase first.** Lead each point with a short, punchy takeaway phrase, then the detail. The takeaway alone must carry the point (the scannability rule applied to feedback itself).
- **Explain the why.** Feedback says why the change matters, not just what to change.
- **British English.** Organisation, prioritise, analyse.
- **No em-dashes.** Use commas, colons, or full stops.
- **Direct, not clever.** Specific, confident judgment, even when the news is good. A bland compliment is worse than a sharp critique.
- **No clever writing.** No inversions ("not X, but Y"), no aphorisms, no dramatic sentence fragments, no lines written to be quoted. The verdict describes the document; it does not perform. "The ask for $1.65M appears on page 6" beats "a $1.65M ask dressed up as a conversation starter." Clear and useful, never smart.

---

## Consumers of this file

When this file changes, re-distil the rules into each consumer's system prompt:

1. `sowhat/src/lib/evaluate.ts` (whatsthesowhat.jamesraybould.me) — full rubric, sections 1–7
2. `doc-reviewer/lib/analyse-prompt.ts` (doc-reviewer-sigma.vercel.app) — full rubric; synced copy of this file lives at `doc-reviewer/TASTE.md` with a pointer header
3. `writer` (the writing app, github.com/londonjames/writer) — planned consumer for its ai-review surface. Note: writer owns the sibling asset, the VOICE profile (`api/analyze-voice.js` distils a style guide from writing samples into `voiceProfile`). TASTE judges documents; VOICE writes them. Keep them separate.
4. `~/.claude/skills/sowhatreviewer/SKILL.md` (`/sowhatreviewer` in Claude Code) — reads this file directly rather than carrying a distilled copy, so it cannot drift. It publishes to the same `sowhat:<id>` store via `scripts/publish.mjs`.
5. Future: outbound pre-send check, evaluator surfaces, org-facing twin
