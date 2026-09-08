# QUESTIONS.md — What James Asks

**GENERATED FILE. Do not edit by hand.**

The questions live in `src/lib/questions.ts`, which is what the prompt, the tool schema and the review page all read.
This file is rendered from it by `scripts/gen-questions-md.mjs` so the library is readable without opening the code,
and so the two can never drift. Edit the TypeScript, run the script, commit both.

This is the **challenge** axis: whether the thinking behind the document holds up.
[TASTE.md](TASTE.md) is the **craft** axis: whether the argument is well made. Neither restates the other.
A document can score well on TASTE and still be conservative, over-resourced, and solving a problem nobody has.

Every question carries three parts:

- **The question** — in James's words, as the reviewer puts it to the author.
- **Fires when** — what in a document makes the question apply.
- **Clears when** — the substantive bar that answers it. Never the presence of a section: a reviewer built from
  completeness checks gets gamed by adding a "Risks" heading with nothing under it.

---

## Document types

The reviewer infers the type and states it. The type governs which questions apply and the length threshold used by The Craft.
If the type is unclear the reviewer says so and applies the board-paper set, which is the strictest.

| Type | Length threshold |
|------|------------------|
| Board paper or investment proposal (`board-paper`) | 8 pages |
| Strategy memo (`strategy-memo`) | 5 pages |
| Project or product brief (`brief`) | 4 pages |
| Status update (`status-update`) | 2 pages |
| Client deliverable (`client-deliverable`) | no fixed threshold; judge the length against the ask |
| Internal communication (`internal-comms`) | 1 page |

---

## 1. The Ask

> What do you want from me, and what am I on the hook for beyond saying yes?

Never not applicable.

### `goal-and-ask`

**"What do you need from me, and by when?"**

- **Fires when:** Always.
- **Clears when:** Page one names the decision, the person who has to make it, and the date it is needed by. A document that states 'for information, no action required' clears this too, provided it says so.

### `recommendation-not-menu`

**"What do you actually think we should do?"**

- **Fires when:** Options are laid out neutrally and the choice is left to the reader.
- **Clears when:** One option is recommended by name, and the others are rejected with a stated reason. Presenting three options and calling the third 'our preference' in an appendix does not clear it.

### `hook-beyond-approval`

**"What am I on the hook for beyond approving this?"**

- **Fires when:** Always, where the reader is an approver.
- **Clears when:** Every call on the reader's time is listed in one place: introductions, customer calls, board slots, escalations, hiring panels. Mentions scattered through the body do not clear it.

## 2. The Problem

> Is this real, is it ours, and why now?

Never not applicable.

### `fake-problems`

**"Who asked for this, and how do we know the problem is real?"**

- **Fires when:** A problem is stated with no evidence, no size and no requester; work sits outside the document's own stated remit; or a solution arrives before the problem has been sized.
- **Clears when:** Each problem names a source (a named customer, a metric, a specific request) and a size (what not fixing it costs, in money, time or risk). Anything outside remit is flagged as outside remit rather than smuggled in.

### `do-nothing-case`

**"What happens if we do not do this?"**

- **Fires when:** Any proposal.
- **Clears when:** The cost of inaction is stated with a number or a dated consequence. 'We would fall behind' does not clear it; 'we lose the two renewals due in March' does.

### `why-now`

**"What makes this the right quarter rather than next?"**

- **Fires when:** Any proposal with a start date.
- **Clears when:** The urgency is tied to something dated and external: a contract, a competitor move, a regulatory date, a customer commitment. Internal readiness is not urgency.

## 3. The Thinking

> Is this ambitious and rigorous, or hedged, lazy and already tried?

Never not applicable.

### `false-limitations`

**"Which of these constraints did someone actually impose, and which did you assume?"**

- **Fires when:** A constraint is stated as given with no source (budget, headcount, timeline, tooling, 'we can't because'); targets are last year's number plus a bit; a scoped-down option is presented as the only option.
- **Clears when:** Every stated constraint is either sourced (a named person said no, a contract, a hard technical limit) or explicitly tested with what it would be worth to break it. An ambition case sits beside the base case.

### `cheaper-paths`

**"What is the version of this that does not need more people or money?"**

- **Fires when:** Any resource request: headcount, budget, tooling, vendor, or time.
- **Clears when:** At least one no-new-resource option is named and rejected with a reason, and the ask states its marginal return (what the extra buys, per unit). Stopping or deprioritising existing work counts as an option, and is usually the one missing.

### `precedent`

**"Have we tried this before, and what happened?"**

- **Fires when:** The proposal resembles work the organisation has attempted before, or the document is silent about history in an area that plainly has some.
- **Clears when:** Prior attempts are named with what happened and what is different this time. 'This time we have executive sponsorship' is not a difference unless the last attempt lacked it.

### `which-numbers-believed`

**"Which of these numbers are known and which are guesses?"**

- **Fires when:** Estimates and actuals appear in the same table, paragraph or chart without distinction; or a figure carries more precision than its source can support.
- **Clears when:** Each figure is marked as actual, estimate or assumption, and the actuals carry a source. A single line saying which of the model's inputs are assumed also clears it.

## 4. The Cost

> What does this displace, and who else does it land on?

May be marked not applicable only if the document requests no resources and proposes no new work for anyone, with a stated reason.

### `what-we-stop`

**"If we do this, what comes off the list?"**

- **Fires when:** Any proposal that adds work.
- **Clears when:** The displaced work is named specifically, or the document states there is spare capacity and says exactly where it is. Silence assumes infinite capacity and does not clear it.

### `lands-on-others`

**"Who else does this land on?"**

- **Fires when:** The proposal creates work, dependencies or risk outside the proposing team.
- **Clears when:** Affected teams are named and their cost is counted in the total, not just the proposing team's. A dependency listed without an estimate of what it costs that team does not clear it.

## 5. The Plan

> Who owns it, what is true by when, and how much do we spend before we know?

May be marked not applicable only if the document asks for no decision and proposes no action of any kind, with a stated reason.

### `owner-and-dates`

**"Who owns this, and what is true by when?"**

- **Fires when:** Any plan.
- **Clears when:** A named individual owns each workstream and dated milestones exist. 'The team will' and 'in H2' do not clear it.

### `how-we-know-it-worked`

**"What is the number that tells us this was right, and when do we check it?"**

- **Fires when:** Any proposal.
- **Clears when:** A success metric with a target value and a review date is stated before the work starts, and it is a measure of outcome rather than of activity. Shipping the thing is not the metric.

### `reversibility-checkpoint`

**"How much do we spend before we know if it is working?"**

- **Fires when:** Any commitment above a material threshold, or any decision that is hard to reverse.
- **Clears when:** The commitment is staged, with a named decision point, what will be known at it, and a stop condition. A plan that only describes success does not clear it.

## 6. The Room

> Who has seen this, and who disagrees?

Never not applicable.

### `who-has-seen-it`

**"Who has seen this, and who disagrees?"**

- **Fires when:** Any document that will be decided in a room.
- **Clears when:** The document names who has reviewed it, particularly the functions whose budget, people or roadmap it touches, and states any unresolved objection in the objector's own terms. 'Aligned with stakeholders' does not clear it.

## 7. The Craft

> Does the length earn itself, and does it read?

Never not applicable.

### `length-earns-itself`

**"Why is this this long?"**

- **Fires when:** Length exceeds the threshold for the document type; sections do not feed the ask; appendix material sits in the body; background the reader already has is restated.
- **Clears when:** Every section is load-bearing: deleting it would change the decision. Name the sections that fail that test and state a target length.

### `taste-rubric`

**"Does it read? Is the point on the page?"**

- **Fires when:** Always.
- **Clears when:** The document clears the TASTE bar: a stateable So What, an unmissable ask, scannable structure, a connected story, no corporate waffle, no hedging, no fake precision, and not boring.

---

## Scoring

Each category scores 1.0 to 5.0 in half-star steps.

- **5.0** — nothing to add. James would forward this as an example of how to do it.
- **4.0–4.5** — answered, with one gap that costs the author something.
- **3.0–3.5** — partly answered. The reader gets some of what they need.
- **2.0–2.5** — asserted rather than answered.
- **1.0–1.5** — not addressed at all.

The overall is **capped by the weakest category, never averaged**: `floor(min(proposal, lowest + 1.0))`, and any
category at 1.0 caps the overall at 2. A weighted mean lets a well-written document with a fake problem score 3.8,
which is the failure this reviewer exists to catch. The cap is computed in `src/lib/team-types.ts`, not asked of the
model, and is tested by `scripts/test-cap.mjs`.

| Stars | Name | Meaning |
|-------|------|---------|
| 1 | Start again | The questions are unanswered because the thinking is not done. |
| 2 | Not ready | Several categories unanswered. Expect more than one round. |
| 3 | One round away | The substance is there. Specific gaps to close. |
| 4 | Nearly there | Minor gaps. Fix and send. |
| 5 | Send it | Nothing here James sends back. |

---

## Adding a question

1. Add the entry to `QUESTIONS` in `src/lib/questions.ts`, with a stable `id`.
2. Run `node scripts/gen-questions-md.mjs` to regenerate this file.
3. Deploy. The prompt, the tool schema and the ledger all pick it up with no other change.

Write `clearsWhen` so it can be checked against the page. "Has a risks section" is not a bar; "each risk names an owner and a mitigation date" is.
