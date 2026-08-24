"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EvaluationResult } from "@/lib/types";
import { parsePartialJson } from "@/lib/partial-json";
import { shapeResult } from "@/lib/shape";
import ReviewBody from "./ReviewBody";
import { rememberReview } from "@/lib/history";

const ACCEPTED = ".pdf,.docx,.doc,.pptx,.ppt,.txt,.md";
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "doc", "pptx", "ppt", "txt", "md"];

const FIELD_CLASS =
  "w-full resize-y rounded-lg border border-gray-border bg-white px-5 py-3 text-base leading-relaxed text-foreground placeholder:text-gray-light outline-none transition-colors focus:border-foreground";

const LABEL_CLASS = "mb-1.5 block text-left text-base text-gray";

interface InputAreaProps {
  /** Set when re-reviewing an edited document against an earlier review. */
  previousId?: string;
}

/**
 * The reviewer's commentary arrives as a growing block of text. Show only the
 * tail so the reader gets a sense of progress without a wall of reasoning.
 */
function latestThought(thinking: string): string {
  const cleaned = thinking.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const tail = sentences.slice(-2).join(" ");
  return tail.length > 240 ? `${tail.slice(-240).trimStart()}` : tail;
}

export default function InputArea({ previousId }: InputAreaProps) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("");
  const [intended, setIntended] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [partial, setPartial] = useState<Partial<EvaluationResult>>({});
  const [thinking, setThinking] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      if (intended.trim()) formData.append("intended", intended.trim());
      if (previousId) formData.append("previousId", previousId);
      return { method: "POST", body: formData };
    }
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        audience: audience.trim() || undefined,
        intended: intended.trim() || undefined,
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
    setThinking("");

    const shapeOptions = {
      context: {
        audience: audience.trim() || undefined,
        intended: intended.trim() || undefined,
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

          if (event.type === "thinking") {
            setThinking((event.text as string) || "");
          } else if (event.type === "partial") {
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
    const hasContent = Object.keys(partial).length > 0;
    return (
      <div className="flex w-full flex-col items-center gap-8 py-8">
        {!hasContent && (
          <>
            <p className="text-xl italic text-foreground">
              Reading your document...
            </p>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-8 animate-pulse rounded-full bg-gray-border"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            {thinking && (
              <p className="max-w-lg text-center text-base leading-relaxed text-gray-light">
                {latestThought(thinking)}
              </p>
            )}
          </>
        )}
        {hasContent && (
          <div className="w-full text-left">
            <ReviewBody result={partial} streaming />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Paste your document here..."
        rows={4}
        autoFocus
        className={FIELD_CLASS}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-lg border py-4 transition-colors ${
          dragOver
            ? "border-foreground bg-surface"
            : file
              ? "border-foreground bg-white"
              : "border-gray-border bg-white hover:border-gray-light"
        }`}
      >
        {file ? (
          <p className="text-sm text-foreground">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-gray-light">(click to replace)</span>
          </p>
        ) : (
          <p className="text-base text-gray-light">
            Or add a file here (PDF, DOC, DOCX, PPT, PPTX)
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

      <div className="flex flex-col gap-4 border-t border-gray-border pt-5">
        <div>
          <label htmlFor="audience" className={LABEL_CLASS}>
            Describe your audience and any other context our reviewer should
            know{" "}
            <span className="text-gray-light">(optional)</span>
          </label>
          <textarea
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            rows={2}
            placeholder="e.g. My board. They asked for efficiency last quarter and are sceptical of new headcount."
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="intended" className={LABEL_CLASS}>
            In one sentence, what&apos;s the main So What you intend your doc to
            convey? <span className="text-gray-light">(optional)</span>
          </label>
          <input
            id="intended"
            type="text"
            value={intended}
            onChange={(e) => setIntended(e.target.value)}
            placeholder="We'll show you the gap between that and what actually lands."
            className={FIELD_CLASS}
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-700">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!text.trim() && !file}
        className="rounded-lg border border-foreground bg-foreground px-10 py-3 text-base font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        {previousId ? "Re-review" : "Review"}
      </button>
    </div>
  );
}
