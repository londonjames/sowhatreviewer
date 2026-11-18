"use client";

import { useState } from "react";
import { Rewrite } from "@/lib/types";
import SectionHeading, { Label } from "./SectionHeading";

/** Render **bold** spans; the model writes rewrites in light markdown. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

type Block = { kind: "text"; line: string } | { kind: "table"; lines: string[] };

/** Split a rewrite into paragraphs and markdown tables, in order. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.trim().split("\n")) {
    if (!line.trim()) continue;
    const last = blocks[blocks.length - 1];
    if (line.trim().startsWith("|")) {
      if (last?.kind === "table") last.lines.push(line);
      else blocks.push({ kind: "table", lines: [line] });
    } else {
      blocks.push({ kind: "text", line });
    }
  }
  // A table needs a header and a separator row; anything less is just text.
  return blocks.flatMap((b) =>
    b.kind === "table" && !(b.lines.length >= 2 && /^\s*\|[\s:|-]+\|\s*$/.test(b.lines[1]))
      ? b.lines.map((line) => ({ kind: "text" as const, line }))
      : [b]
  );
}

/** Render a rewrite: paragraphs, with any markdown tables drawn as tables. */
function RewriteBody({ text }: { text: string }) {
  return (
    <>
      {toBlocks(text).map((block, i) => (
        <div key={i} className={i > 0 ? "mt-3" : undefined}>
          {block.kind === "table" ? (
            <RewriteTable lines={block.lines} />
          ) : (
            <p>
              <InlineText text={block.line} />
            </p>
          )}
        </div>
      ))}
    </>
  );
}

function RewriteTable({ lines }: { lines: string[] }) {
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const header = cells(lines[0]);
  const rows = lines.slice(2).map(cells);

  return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[15px]">
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th
                  key={i}
                  className="border-b border-[var(--ui-line)] px-3 py-2 text-left font-semibold text-[var(--ui-ink)]"
                >
                  <InlineText text={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className="border-b border-[var(--ui-line)] px-3 py-2 align-top text-[var(--ui-ink-2)]"
                  >
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}

function RewriteCard({ rewrite }: { rewrite: Rewrite }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rewrite.after);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the text is selectable either way.
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--ui-line)] p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[17px] font-semibold text-[var(--ui-ink)]">{rewrite.label}</h3>
        <button
          onClick={copy}
          className="shrink-0 rounded-lg border border-[var(--ui-field-border)] px-3 py-1 text-[13px] font-medium text-[var(--ui-ink-2)] transition-colors hover:border-[var(--ui-accent)] hover:text-[var(--ui-accent-text)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {rewrite.why && <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--ui-ink-2)]">{rewrite.why}</p>}

      {rewrite.before && (
        <div className="mt-4">
          <Label>Currently</Label>
          <p className="mt-1.5 border-l-2 border-[var(--ui-line)] pl-3 text-[15px] leading-relaxed text-[var(--ui-ink-2)]">
            {rewrite.before}
          </p>
        </div>
      )}

      <div className="mt-4">
        <Label>{rewrite.before ? "Use this instead" : "Add this"}</Label>
        <div className="mt-1.5 border-l-2 border-[var(--ui-accent)] pl-3 text-[17px] leading-relaxed text-[var(--ui-ink)]">
          <RewriteBody text={rewrite.after} />
        </div>
      </div>
    </div>
  );
}

export default function RewritePanel({ rewrites }: { rewrites: Rewrite[] }) {
  if (!rewrites.length) return null;

  return (
    <section>
      <SectionHeading>Rewrites you can paste in</SectionHeading>
      <div className="mt-4 space-y-4">
        {rewrites.map((rewrite, i) => (
          <RewriteCard key={i} rewrite={rewrite} />
        ))}
      </div>
    </section>
  );
}
