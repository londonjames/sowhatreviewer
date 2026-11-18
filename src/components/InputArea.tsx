"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EvaluationResult } from "@/lib/types";
import { parsePartialJson } from "@/lib/partial-json";
import { shapeResult } from "@/lib/shape";
import ReviewBody from "./ReviewBody";
import { rememberReview } from "@/lib/history";
import { parseGoogleLink } from "@/lib/google-link";

const ACCEPTED = ".pdf,.docx,.doc,.pptx,.ppt,.txt,.md";
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "doc", "pptx", "ppt", "txt", "md"];

const FIELD_CLASS =
  "w-full resize-none rounded-xl border border-[var(--ui-field-border)] bg-[var(--ui-field)] px-4 py-3 text-base leading-relaxed text-[var(--ui-ink)] placeholder:text-[var(--ui-muted)] outline-none transition focus:border-[var(--ui-accent)] focus:ring-4 focus:ring-[var(--ui-accent)]/15";


function StepHeading({ n, title, note }: { n: number; title: string; note?: string }) {
  return (
    <h2 className="mb-2 text-left text-[19px] font-semibold tracking-[-0.01em] text-[var(--ui-ink)]">
      <span className="mr-2.5 text-[var(--ui-accent)]">{String(n).padStart(2, "0")}</span>
      {title}
      {note && <span className="ml-2 text-[15px] font-normal text-[var(--ui-muted)]">{note}</span>}
    </h2>
  );
}

interface InputAreaProps {
  /** Set when re-reviewing an edited document against an earlier review. */
  previousId?: string;
}

export default function InputArea({ previousId }: InputAreaProps) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [partial, setPartial] = useState<Partial<EvaluationResult>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // The home title and scale hide while a review streams (globals.css). Show
  // them again if the review fails, and when leaving for the finished review.
  useEffect(() => {
    const root = document.documentElement;
    if (loading) root.dataset.reviewing = "1";
    else delete root.dataset.reviewing;
    return () => {
      delete root.dataset.reviewing;
    };
  }, [loading]);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(
        "Unsupported file type. Please upload a PDF, DOC, DOCX, PPT, PPTX, TXT or MD file."
      );
      return;
    }
    setFile(f);
    setText("");
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setError("");
  };

  const buildRequest = (): RequestInit => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      if (audience.trim()) formData.append("audience", audience.trim());
      if (previousId) formData.append("previousId", previousId);
      return { method: "POST", body: formData };
    }
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        audience: audience.trim() || undefined,
        previousId,
      }),
    };
  };

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      setError("Please paste some text or upload a file.");
      return;
    }

    setLoading(true);
    setError("");
    setPartial({});
    window.scrollTo({ top: 0 });

    const shapeOptions = {
      context: {
        audience: audience.trim() || undefined,
      },
    };

    try {
      const res = await fetch("/api/evaluate", buildRequest());

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      if (!res.body) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Newline-delimited JSON: the last piece may be a partial line.
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === "partial") {
            const parsed = parsePartialJson(event.json as string);
            // A fragment that can't be salvaged just means nothing new yet.
            if (parsed) setPartial(shapeResult(parsed, shapeOptions));
          } else if (event.type === "error") {
            setError(
              (event.error as string) ||
                "Something went wrong. Please try again."
            );
            setLoading(false);
            finished = true;
          } else if (event.type === "done") {
            const evaluation = event.evaluation as EvaluationResult;
            const id = event.id as string | undefined;
            sessionStorage.setItem(
              "sowhat_result",
              JSON.stringify({ evaluation, truncated: !!event.truncated })
            );
            if (id) {
              rememberReview({
                id,
                overall: evaluation.overall,
                verdict: evaluation.verdict,
                createdAt: new Date().toISOString(),
              });
              router.push(`/r/${id}`);
            } else {
              router.push("/review");
            }
            finished = true;
          }
        }
      }

      if (!finished) {
        setError("The review ended early. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (loading) {
    // Same layout as the finished review page: the header holds its shape with
    // placeholders and sections arrive below it, so nothing jumps.
    return <ReviewBody result={partial} streaming />;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="flex flex-col gap-2">
      <StepHeading
        n={1}
        title={previousId ? "Paste your revised doc or a Google link, or attach a file" : "Paste your doc or a Google link, or attach a file"}
      />
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Paste your content, or a Google Slides or Docs link"
        rows={3}
        autoFocus
        className={FIELD_CLASS}
      />
      {parseGoogleLink(text) && (
        <p className="text-left text-sm text-[var(--ui-accent-text)]">
          {`Google ${parseGoogleLink(text)?.kind === "slides" ? "Slides" : "Docs"} link: we'll open it and review the file. It needs to be shared as ‘Anyone with the link’.`}
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed py-3 transition-colors ${
          dragOver || file
            ? "border-[var(--ui-accent)]"
            : "border-[var(--ui-drop-border)] hover:border-[var(--ui-accent)]"
        }`}
      >
        {file ? (
          <p className="text-sm text-[var(--ui-ink)]">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-[var(--ui-muted)]">(click to replace)</span>
          </p>
        ) : (
          <p className="text-sm text-[var(--ui-drop-text)]">
            or drop a PDF, Word or PowerPoint file
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
      </div>

      </section>

      <section className="flex flex-col">
        <StepHeading n={2} title="Describe your audience and goal" note="optional" />
        <textarea
          id="audience"
          aria-label="Your audience and goal"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          rows={3}
          placeholder="e.g. My board. Wary of new headcount. Goal: approve two hires."
          className={FIELD_CLASS}
        />
      </section>

      {error && <p className="text-center text-sm text-[#dc2626]">{error}</p>}

      <button
        onClick={handleSubmit}
        className="rounded-[14px] bg-[var(--ui-accent)] px-10 py-4 text-[17px] font-bold text-white transition hover:bg-[#1d4ed8] active:translate-y-px"
      >
        {previousId ? "Re-review my document" : "Review my document"}
      </button>
    </div>
  );
}
