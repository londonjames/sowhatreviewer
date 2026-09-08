# Team Reviewer — Design

**Date:** 8 September 2026
**Status:** awaiting review
**Repo:** `~/sowhat` (new route, not a new project)

---

## 1. The problem

James reviews documents his team sends him and gives the same feedback repeatedly.
Each round of that feedback costs him a read and costs the author a week. The goal is
to remove at least one of those rounds by putting his questions in front of the author
before the document reaches him.

`whatsthesowhat.jamesraybould.me` already reviews documents against `TASTE.md`, but it
answers a different question. TASTE asks whether the argument is well made. It cannot
tell you the author has assumed a constraint nobody imposed, has proposed more headcount
without testing a cheaper path, or is solving a problem no one asked for. Those are the
things that actually cost James an edit round, and they are what this reviewer adds.

## 2. The two axes

The reviewer runs two layers over every document.

- **Challenge** — the seventeen questions James asks, grouped into seven categories.
  This is new, and it is the point of the product.
- **Craft** — the existing TASTE rubric: Intent 20%, Delivery 50%, Narrative 30%.
  Unchanged. It becomes one of the seven categories rather than the headline.

`TASTE.md` section 2 states the three dimensions and weights are settled and not to be
added to. This design honours that. The seven categories sit above the rubric, not
inside it, and `whatsthesowhat` is not modified.

## 3. The seven categories

Each category absorbs several underlying questions. The author sees a category verdict.
The questions run underneath and are reported as a ledger.

| # | Category | Questions | The question behind it |
|---|----------|-----------|------------------------|
| 1 | The Ask | 2, 6, 15 | What do you want from me, and what am I on the hook for beyond saying yes? |
| 2 | The Problem | 5, 8, 12 | Is this real, is it ours, and why now? |
| 3 | The Thinking | 1, 4, 16, 17 | Is this ambitious and rigorous, or hedged, lazy and already tried? |
| 4 | The Cost | 7, 14 | What does this displace, and who else does it land on? |
| 5 | The Plan | 9, 10, 13 | Who owns it, what is true by when, and how much do we spend before we know? |
| 6 | The Room | 11 | Who has seen this, and who disagrees? |
| 7 | The Craft | 3 + TASTE | Does the length earn itself, and does it read? |

## 4. The question library

### Where it lives

A new canonical file, `QUESTIONS.md` at the repo root, sibling to `TASTE.md`.

The split is deliberate. `TASTE.md` records how James judges prose and argument, and it
changes rarely. The question library is an operational checklist that will grow every time
he notices himself repeating a note. Keeping them apart means the checklist can grow weekly
without touching canonical taste. `TASTE.md` gains a pointer to it and lists this reviewer
as consumer 6.

`QUESTIONS.md` is the human-editable source of truth. `src/lib/questions.ts` holds the same
content as a typed array and is what the code reads. The array is the shipped artefact because
it gives the prompt, the JSON schema and the UI one shared definition, and because reading a
markdown file from disk at runtime on Vercel needs file-tracing configuration that is not worth
the fragility. Editing a question is a data edit in one file, never a code change.

### The shape of a question

```ts
interface ReviewQuestion {
  id: string;              // "q1-false-limitations"
  category: CategoryId;    // which of the seven it rolls up to
  question: string;        // in James's words, as the reviewer puts it
  firesWhen: string;       // what in a document makes it apply
  clearsWhen: string;      // the substantive bar that answers it
  appliesTo?: DocType[];   // absent means every document
}
```

`clearsWhen` must always describe substance, never the presence of a section. A reviewer built
from completeness checks gets gamed by adding a "Risks" heading with nothing under it.

### Document types

The reviewer infers the type, states it in the header, and the type governs two things: which
questions apply, and the length threshold used by The Craft.

| Type | Length threshold |
|------|------------------|
| Board paper or investment proposal | 8 pages |
| Strategy memo | 5 pages |
| Project or product brief | 4 pages |
| Status update | 2 pages |
| Client deliverable | no fixed threshold, judged against the ask |
| Internal comms | 1 page |

If the type is unclear the reviewer says so and applies the board-paper set, which is the
strictest. Guessing generously is the failure mode that lets a weak document through.

### The seventeen at launch

**James's five**

1. **False limitations.** *"Which of these constraints did someone actually impose, and which did you assume?"*
   Fires when a constraint is stated as given with no source, when targets are last year plus a bit,
   or when a scoped-down option is presented as the only option.
   Clears when every constraint is sourced (a named person said no, a contract, a hard technical limit)
   or explicitly tested, and an ambition case sits beside the base case.

2. **Goal and ask.** *"What do you need from me, and by when?"*
   Fires always.
   Clears when page one names the decision, the person who makes it, and the date. "For information,
   no action" clears it if stated.

3. **Length earning itself.** *"Why is this eleven pages?"*
   Fires when length exceeds the threshold for the document type, when sections do not feed the ask,
   or when appendix material sits in the body.
   Clears when every section is load-bearing: deleting it would change the decision. The reviewer names
   the sections that fail and states a target length.

4. **Cheaper paths.** *"What is the version of this that does not need more people or money?"*
   Fires on any resource request: headcount, budget, tooling, vendor, time.
   Clears when at least one no-new-resource option is named and rejected with a reason, and the ask
   states its marginal return. Stopping or deprioritising existing work counts as an option and is
   usually the one missing.

5. **Fake problems.** *"Who asked for this, and how do we know the problem is real?"*
   Fires when a problem has no evidence, no size and no requester, when work sits outside the stated
   remit, or when a solution arrives before the problem is sized.
   Clears when each problem names a source and a size. Anything outside remit is flagged as such.

**Executive expectations**

6. **Recommendation, not a menu.** *"What do you actually think we should do?"*
   Fires when options are laid out neutrally with the choice left to the reader.
   Clears when one option is recommended and the others are rejected with reasons.

7. **What we stop doing.** *"If we do this, what comes off the list?"*
   Fires on any proposal that adds work.
   Clears when the displaced work is named, or the doc states explicitly that there is spare capacity
   and says where.

8. **The do-nothing case.** *"What happens if we do not?"*
   Fires on any proposal.
   Clears when the cost of inaction is stated with a number or a dated consequence.

9. **Named owner and dates.** *"Who owns this, and what is true by when?"*
   Fires on any plan.
   Clears when a named individual owns each workstream and dated milestones exist. "The team will"
   does not clear it.

10. **How we will know it worked.** *"What is the number that tells us this was right, and when do we check it?"*
    Fires on any proposal.
    Clears when a success metric with a target value and a review date is stated before the work starts.
    Merged with TASTE section 1 question 6 so it is not asked twice.

11. **Who has seen this and who disagrees.** *"Has finance seen this? Who is against it?"*
    Fires on any document that will be decided in a room.
    Clears when the document names who has reviewed it and states any unresolved objection.

12. **Why now.** *"What makes this the right quarter rather than next?"*
    Fires on any proposal with a start date.
    Clears when the urgency is tied to something dated and external.

13. **Reversibility and the checkpoint.** *"How much do we spend before we know if it is working?"*
    Fires on any commitment above a material threshold or any one-way door.
    Clears when the commitment is staged with a named decision point and a stop condition.

14. **What this does to everyone else.** *"Who else does this land on?"*
    Fires when the proposal creates work or dependencies outside the proposing team.
    Clears when affected teams are named and their cost is counted.

15. **What you need from me beyond approval.** *"What am I on the hook for?"*
    Fires always where the reader is an approver.
    Clears when every call on the reader's time is listed in one place: introductions, calls,
    board slots, escalations.

16. **Precedent.** *"Have we tried this before, and what happened?"*
    Fires when the proposal resembles prior work.
    Clears when prior attempts are named with what happened and what is different now.

17. **Which numbers do you believe.** *"Which of these are known and which are guesses?"*
    Fires when estimates and actuals appear in the same table or paragraph.
    Clears when each figure is marked actual, estimate or assumption, with a source for the actuals.

James will add more. Adding one is a single entry in `QUESTIONS.md` plus the mirrored entry in
`questions.ts`. No other file changes.

## 5. Scoring

### Per category

`1.0` to `5.0` in half-star steps, plus a headline and a body, matching Profiler's
`SectionEvaluation` and reusing `StarRating.tsx`, which exists in both repos.

Calibration is stated explicitly in the prompt, as Profiler does, because a model given a
1 to 5 scale without anchors returns 3.5 for everything:

- **5.0** — nothing to add. James would forward this as an example.
- **4.0–4.5** — answered, with one gap that costs the author something.
- **3.0–3.5** — partly answered. A reader gets some of what they need.
- **2.0–2.5** — asserted rather than answered.
- **1.0–1.5** — not addressed at all.

Do not round up. If torn, take the lower band. The number and the words must agree.

### Overall

Also out of 5, named by the edit round it implies:

| Stars | Name | Meaning |
|-------|------|---------|
| 1 | Start again | The questions are unanswered because the thinking is not done. |
| 2 | Not ready | Several categories unanswered. Expect more than one round. |
| 3 | One round away | Substance is there, specific gaps to close. |
| 4 | Nearly there | Minor gaps. Fix and send. |
| 5 | Send it | Nothing here James sends back. |

**The overall is capped by the weakest category, not averaged.** A weighted mean lets a
well-written document with a fake problem score 3.8, which is the exact failure this is built
to catch.

The model proposes an overall. The code then caps it and floors it to a whole star, because the
named ladder has five rungs and no half positions:

```
cap      = min(lowest applicable category + 1.0,
               any category <= 1.0 ? 2.0 : 5.0)
overall  = floor(min(modelProposal, cap))     // integer 1-5
```

The cap is computed in TypeScript from the category scores, never asked of the model, so it cannot
be talked around by a review that likes the document.

### Not applicable

A category may be marked N/A, but only against a stated bar, and the reviewer must say why.

- The Cost is N/A only if the document requests no resources and proposes no new work.
- The Plan is N/A only if the document asks for no decision and proposes no action.
- The Ask, The Problem, The Thinking, The Room and The Craft are never N/A.

N/A categories drop out of the cap calculation. Without an explicit bar the model uses N/A to
duck, in the same way Profiler needed its ceiling rules.

## 6. The output

Top of page, which is the part that removes the edit round:

```
BOARD PAPER · Q4 PLATFORM INVESTMENT              reviewed 8 Sep

★★☆☆☆  NOT READY
The ask is clear. The case for it is not.

Three things before this reaches James:
1. Source or drop the headcount constraint (p.4). Every option
   downstream is scoped to an assumption nobody has confirmed.
2. Add the do-nothing case. There is no baseline to judge £1.65M
   against.
3. Name who has seen this. Finance appears nowhere in 11 pages.
```

Then the seven categories, each with stars, a headline and a body citing page or slide numbers.
Categories scoring 4.5 or above collapse to a single line so the review is only as long as the
problems. The Craft category expands to the existing TASTE output: Intent, Delivery, Narrative,
the Mirror, the prescriptions and the rewrites.

Below that, the question ledger: all seventeen listed with answered, partly, not answered or
not applicable, collapsed by default. This is what lets an author see that fourteen passed rather
than reading three criticisms and assuming the document is broken.

At most three fixes at the top, ranked by how badly each would derail the meeting. Never more.

## 7. Architecture

New surface inside `~/sowhat`. Nothing existing is modified except `TASTE.md`'s consumer list
and `middleware.ts`.

```
QUESTIONS.md                          new, canonical, human-edited
src/lib/questions.ts                  new, the seventeen as typed data
src/lib/team-types.ts                 new, TeamReviewResult and the cap function
src/lib/team-prompt.ts                new, built from questions.ts + TASTE craft rules
src/lib/team-evaluate.ts              new, the streaming call and tool schema
src/app/team/page.tsx                 new, upload and paste
src/app/team/login/page.tsx           new, the password screen
src/app/t/[id]/page.tsx               new, the shareable review
src/app/api/team-evaluate/route.ts    new, streams the result
src/app/api/team-login/route.ts       new, checks the password, sets the cookie
src/components/team/*.tsx             new, overall verdict, category card, ledger
src/middleware.ts                     modified, password gate on /team, /t, /api/team-evaluate

src/lib/extract.ts                    reused unchanged
src/lib/redis.ts                      reused, new `teamreview:<id>` prefix
src/lib/partial-json.ts               reused unchanged
src/lib/usage-logger.ts               reused, tagged app "sowhat", feature "team-review"
src/components/StarRating.tsx         reused unchanged
```

**Model.** `claude-opus-5`, `max_tokens: 16000`, `thinking: { type: "adaptive" }`, matching the
existing reviewer. One call produces both layers; splitting into two calls doubles cost and lets
the two halves contradict each other.

**Streaming.** The existing partial-JSON streaming and `ProgressBanner` pattern, so a 60 to 90
second review shows the verdict and categories as they arrive rather than a spinner.

**Access.** One shared password in `TEAM_PASSWORD`. A request to `/team`, `/t/*` or
`/api/team-evaluate` without the cookie is rewritten by `middleware.ts` to `/team/login`, which
posts to `/api/team-login`; a correct password sets an httpOnly year-long cookie and redirects
back. The existing `?internal=1` behaviour in `middleware.ts` is left intact. Same pattern as
Mettle. Reviews stay shareable within the team because everyone holds the same password.

**Cost.** This runs on the API, not James's subscription, and the team can submit freely. A daily
request counter in Redis caps submissions and returns a plain message when hit. Spend is logged
through `trackStream` under feature `team-review`, so `/jamesusage` reports it separately from
James's own use.

**Re-review.** `TeamReviewResult` carries a `progress` block of the same shape as the existing
`EvaluationResult.progress`, so the pattern is copied rather than invented. On resubmission with a
`previousId`, the review opens with which questions moved from not answered to answered and which
did not, keyed on question id rather than on prose. That loop is the product: the author is meant to resubmit until the questions stop firing.

## 8. Error handling

- Extraction failure: the existing message, telling the author to paste the content instead.
- Document under 100 characters or over 300,000: existing limits and messages.
- Model returns a malformed or partial tool block: `shape.ts` and `completeness()` already handle
  this. Never render a fabricated score.
- Redis unavailable: the review renders, the share link does not. Say so rather than failing.
- Daily cap reached: a plain message naming when it resets.

## 9. Verification

No feature is called done without these run against the deployed site.

1. A deliberately weak fixture document that fails The Thinking, The Problem, The Cost and The Room.
   Expect two stars or fewer, the cap rule visibly binding, and the three named fixes matching the
   planted flaws.
2. A strong fixture document. Expect four or five stars, most categories collapsed, and no invented
   criticism. TASTE section 6: right, or silent.
3. A pure status update with no ask. Expect The Cost and The Plan marked N/A with stated reasons,
   and no manufactured resource critique.
4. The cap rule unit-tested directly: one category at 1.0 with six at 5.0 must produce an overall of 2.0.
5. Resubmission of the fixed weak document. Expect the progress block to name what moved.
6. `npm run build` and `npm run lint` clean.
7. Password gate confirmed: the route returns the login screen without the cookie.
8. Browser screenshot of the deployed review page before reporting done.

## 10. Open questions

1. **Name and route.** Placeholder is `/team`. Alternatives: `/first-read` (the read before James's
   read), `/redline`. Needs James's call.
2. **The rest of James's questions.** He is writing more. The design does not block on them; each
   new one is a single entry.
3. **A feed of what the team submits.** Deferred. It needs per-person logins, which shared-password
   access cannot give. Worth revisiting once the reviewer is in use.
