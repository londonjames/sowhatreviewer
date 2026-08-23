"use client";

import { useState } from "react";
import { Rewrite } from "@/lib/types";

/** Render a markdown table when the rewrite is one, otherwise plain paragraphs. */
function RewriteBody({ text }: { text: string }) {
  const lines = text.trim().split("\n");
  const isTable =
    lines.length >= 2 &&
    lines[0].trim().startsWith("|") &&
    /^\s*\|[\s:|-]+\|\s*$/.test(lines[1]);

  if (isTable) {
    const cells = (line: string) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
    const header = cells(lines[0]);
    const rows = lines.slice(2).filter((l) => l.trim().startsWith("|")).map(cells);

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th
                  key={i}
                  className="border-b px-3 py-2 text-left font-semibold text-foreground"
                  style={{ borderColor: "#cbd9e4" }}
                >
                  {cell}
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
                    className="border-b px-3 py-2 align-top text-gray"
                    style={{ borderColor: "#e8eef3" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      {lines
        .filter((line) => line.trim())
        .map((line, i) => (
          <p key={i} className={i > 0 ? "mt-3" : undefined}>
            {line}
          </p>
        ))}
    </>
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
    <div className="rounded-lg border border-gray-border p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3
          className="text-sm font-semibold uppercase tracking-[0.15em]"
          style={{ fontFamily: "var(--font-inter), sans-serif", color: "#1a5a8a" }}
        >
          {rewrite.label}
        </h3>
        <button
          onClick={copy}
          className="shrink-0 rounded border border-gray-border px-3 py-1 text-xs uppercase tracking-[0.1em] text-gray transition-colors hover:border-[#1a5a8a] hover:text-[#1a5a8a]"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {rewrite.why && (
        <p className="mt-2 text-base italic text-gray-light">{rewrite.why}</p>
      )}

      {rewrite.before && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-light"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            Currently
          </p>
          <p className="mt-1.5 border-l-2 pl-3 text-base leading-relaxed text-gray-light line-through decoration-gray-light/40">
            {rewrite.before}
          </p>
        </div>
      )}

      <div className="mt-4">
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em] text-gray"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          {rewrite.before ? "Use this instead" : "Add this"}
        </p>
        <div className="mt-1.5 border-l-2 pl-3 text-lg leading-relaxed text-foreground" style={{ borderColor: "#1a5a8a" }}>
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
      <h2
        className="text-xl uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--font-inter), sans-serif", color: "#1a5a8a" }}
      >
        Rewrites You Can Paste In
      </h2>
      <div className="mt-5 space-y-4">
        {rewrites.map((rewrite, i) => (
          <RewriteCard key={i} rewrite={rewrite} />
        ))}
      </div>
    </section>
  );
}
