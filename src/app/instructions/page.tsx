import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import SectionHeading, { Label } from "@/components/SectionHeading";
import { SYSTEM_PROMPT } from "@/lib/evaluate";

export const metadata: Metadata = {
  title: "How documents are scored · What's the So What?",
  description: "The rubric behind the So What reviewer, and the exact instructions it runs on",
};

const DIMENSIONS = [
  {
    name: "Intent",
    weight: "20%",
    text: "Is it clear straight away what the document is for and what it wants from the reader?",
  },
  {
    name: "Delivery",
    weight: "50%",
    text: "Does it make the case? Is the argument complete, supported, and right for this audience? Half the score sits here because a clear ask with a weak case still fails",
  },
  {
    name: "Narrative",
    weight: "30%",
    text: "Is there a story that pulls the reader through, where each section builds on the last?",
  },
];

const BANDS = [
  ["90 to 100", "Crystal Clear"],
  ["80 to 89", "On Point"],
  ["70 to 79", "Getting There"],
  ["60 to 69", "Hazy"],
  ["40 to 59", "Muddled"],
  ["20 to 39", "Lost"],
  ["0 to 19", "Nope"],
];

const QUESTIONS = [
  ["What is it for?", "The occasion (decision memo, pre-read, deck presented live, first meeting) and what the author wants from this audience. Everything after is judged against that goal"],
  ["So what?", "The one-sentence message. If it cannot be said in 25 words, the document has a problem before formatting matters"],
  ["What's the ask?", "The decision or action wanted, and whether it is unmissable on page one"],
  ["Would this audience act on it?", "The real reader, with their real attention span: will they read it, get it, and act?"],
  ["Is it boring?", "Competent but flat is marked down"],
  ["Where does it break?", "The questions this audience will raise in the room that the document cannot answer"],
  ["What does done look like?", "Whether success is defined clearly enough for the occasion"],
];

const ANCHORS = [
  ["5", "Excellent. Rare. You would send it to someone as an example"],
  ["4.5", "Strong. One small thing away from excellent"],
  ["4", "Good, with a real gap that costs the author something"],
  ["3.5", "Competent, with gaps a reader will notice"],
  ["3", "Competent but flat, or muddled in structure"],
  ["2 to 2.5", "Fails on this dimension. The reader would not get what they need"],
  ["1 to 1.5", "Missing, or working against the document"],
];

const SCORES_WELL = [
  "The point lands from the headlines alone, without reading every paragraph",
  "It says no: what is left out shows judgment",
  "One message, one ask",
  "Each section builds on the one before",
  "Someone could act on it without the author in the room",
  "It names where things get hard before the reader does",
];

const MARKED_DOWN = [
  "Corporate filler that could sit in any company's document",
  "Hedging: “could potentially”, “we believe there may be”",
  "An ask buried on page three, or never stated",
  "Paragraphs doing work a heading, table, or three bullets would do better",
  "Consultant framing and claims beyond what the evidence shows",
  "Numbers without sources",
  "Polished work aimed at the wrong problem",
];

const RETURNS = [
  ["The So What", "The message the document actually conveys, read back in one sentence with two or three supporting points"],
  ["Score and verdict", "The three scores, the overall out of 100, and one sentence on the document"],
  ["Per dimension", "What works, what doesn't, and up to three actions ranked by impact"],
  ["Rewrites", "Finished replacement text for the weakest passages, using the document's own facts"],
  ["What you'll get asked", "Three questions this audience will ask that the document cannot yet answer"],
];

export default function InstructionsPage() {
  return (
    <PageShell>
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em] sm:text-[40px]">
        How the reviewer scores a document
      </h1>
      <p className="mt-3 text-[18px] leading-relaxed text-[var(--ui-ink-2)]">
        The reviewer applies James Raybould&apos;s bar for executive documents. This page sets out that bar so you
        can score a document the same way yourself, and ends with the exact instructions the reviewer runs on
      </p>

      <div className="mt-10 space-y-12">
        <section>
          <SectionHeading number="01">Three scores</SectionHeading>
          <p className="mt-2 text-base leading-relaxed text-[var(--ui-ink-2)]">
            Each is scored from 0.5 to 5 in half steps, then weighted into a score out of 100
          </p>
          <div className="mt-4 space-y-3">
            {DIMENSIONS.map((d) => (
              <div key={d.name} className="rounded-2xl border border-[var(--ui-line)] p-5">
                <p className="text-[17px] font-semibold text-[var(--ui-ink)]">
                  {d.name} <span className="ml-1.5 font-medium text-[var(--ui-accent-text)]">{d.weight}</span>
                </p>
                <p className="mt-1 text-base leading-relaxed text-[var(--ui-ink-2)]">{d.text}</p>
              </div>
            ))}
          </div>
          <Label className="mt-6">The seven ratings</Label>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-base">
            {BANDS.map(([range, name]) => (
              <div key={name} className="contents">
                <span className="tabular-nums text-[var(--ui-ink-2)]">{range}</span>
                <span className="font-medium text-[var(--ui-ink)]">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading number="02">The questions it asks first</SectionHeading>
          <ol className="mt-4 space-y-3">
            {QUESTIONS.map(([q, a], i) => (
              <li key={q} className="flex gap-3 text-base leading-relaxed">
                <span className="w-4 shrink-0 font-semibold text-[var(--ui-accent-text)] tabular-nums">{i + 1}</span>
                <span className="text-[var(--ui-ink-2)]">
                  <span className="font-semibold text-[var(--ui-ink)]">{q}</span> {a}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionHeading number="03">The bar follows the occasion</SectionHeading>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-[var(--ui-ink-2)]">
            <li>
              <span className="font-semibold text-[var(--ui-ink)]">Decision memos and pre-reads</span> must work
              without the author in the room: owners, dates, numbers, and the ask on page one
            </li>
            <li>
              <span className="font-semibold text-[var(--ui-ink)]">Decks presented live, first meetings, and working
              sessions</span> need a clear point of view, a reason this audience should care, and a next step. Detail
              the room is meant to fill in, such as goals marked for discussion, is not counted as a gap
            </li>
            <li>
              <span className="font-semibold text-[var(--ui-ink)]">Data the audience already owns</span>, such as a
              team&apos;s own survey shown to that team, needs no note on method
            </li>
          </ul>
        </section>

        <section>
          <SectionHeading number="04">How each score is set</SectionHeading>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base leading-relaxed">
            {ANCHORS.map(([n, text]) => (
              <div key={n} className="contents">
                <span className="font-semibold tabular-nums text-[var(--ui-ink)]">{n}</span>
                <span className="text-[var(--ui-ink-2)]">{text}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-base leading-relaxed text-[var(--ui-ink-2)]">
            When torn between two scores, take the lower. The number and the words have to agree: a document whose
            ask never lands cannot score well on Intent. Length, research, and polish are not scored; whether the
            reader gets it and acts is
          </p>
        </section>

        <section>
          <SectionHeading number="05">What scores well, and what is marked down</SectionHeading>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:gap-8">
            {[
              ["Scores well", SCORES_WELL],
              ["Marked down", MARKED_DOWN],
            ].map(([title, items]) => (
              <div key={title as string}>
                <Label>{title as string}</Label>
                <ul className="mt-2.5 space-y-2.5">
                  {(items as string[]).map((item) => (
                    <li key={item} className="flex gap-2.5 text-base leading-relaxed text-[var(--ui-ink-2)]">
                      <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-muted)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading number="06">What you get back</SectionHeading>
          <div className="mt-4 space-y-2.5">
            {RETURNS.map(([name, text]) => (
              <p key={name} className="text-base leading-relaxed text-[var(--ui-ink-2)]">
                <span className="font-semibold text-[var(--ui-ink)]">{name}:</span> {text}
              </p>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading number="07">The exact instructions</SectionHeading>
          <p className="mt-2 text-base leading-relaxed text-[var(--ui-ink-2)]">
            Word for word, the instructions the reviewer is given before it reads a document. This text is read from
            the live code, so it always matches what the reviewer is using
          </p>
          <details className="group mt-4 rounded-2xl border border-[var(--ui-line)] bg-[var(--ui-card)]">
            <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-[var(--ui-accent-text)]">
              <span className="group-open:hidden">Show the full instructions</span>
              <span className="hidden group-open:inline">Hide the full instructions</span>
            </summary>
            <pre className="whitespace-pre-wrap border-t border-[var(--ui-line)] px-5 py-4 font-[family-name:var(--font-geist)] text-[14px] leading-relaxed text-[var(--ui-ink-2)]">
              {SYSTEM_PROMPT}
            </pre>
          </details>
        </section>
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/"
          className="rounded-[14px] bg-[var(--ui-accent)] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Review a document
        </Link>
      </div>
    </PageShell>
  );
}
