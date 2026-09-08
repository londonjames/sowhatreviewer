"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TeamReviewResult } from "@/lib/team-types";
import { parsePartialJson } from "@/lib/partial-json";
import { partialFromChallenge } from "@/lib/team-shape";
import TeamReviewBody from "./TeamReviewBody";

const ACCEPTED = ".pdf,.docx,.doc,.pptx,.ppt,.txt,.md";
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "doc", "pptx", "ppt", "txt", "md"];

export default function TeamInput({ previousId }: { previousId?: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [partial, setPartial] = useState<Partial<TeamReviewResult>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(
        "Unsupported file type. Upload a PDF, DOC, DOCX, PPT, PPTX, TXT or MD file."
      );
      return;
    }
    setFile(f);
    setText("");
    setError("");
  }, []);

  const buildRequest = (): RequestInit => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      if (previousId) formData.append("previousId", previousId);
      return { method: "POST", body: formData };
    }
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), previousId }),
    };
  };

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      setError("Paste a document or add a file.");
      return;
    }

    setLoading(true);
    setError("");
    setPartial({});

    try {
      const res = await fetch("/api/team-evaluate", buildRequest());

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
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
            // A fragment that cannot be salvaged just means nothing new yet.
            if (parsed) setPartial(partialFromChallenge(parsed));
          } else if (event.type === "error") {
            setError((event.error as string) || "Something went wrong. Try again.");
            setLoading(false);
            finished = true;
          } else if (event.type === "done") {
            const review = event.review as TeamReviewResult;
            const id = event.id as string | undefined;
            sessionStorage.setItem(
              "sowhat_team_result",
              JSON.stringify({ review, truncated: !!event.truncated })
            );
            router.push(id ? `/t/${id}` : "/team/result");
            finished = true;
          }
        }
      }

      if (!finished) {
        setError("The review ended early. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  if (loading) {
    const hasContent = Object.keys(partial).some(
      (k) => partial[k as keyof TeamReviewResult]
    );
    return (
      <div className="flex w-full flex-col items-center gap-8 py-8">
        {!hasContent ? (
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
          </>
        ) : (
          <div className="w-full text-left">
            <TeamReviewBody result={partial} streaming />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value) {
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
          setError("");
        }}
        placeholder="Paste your document here..."
        rows={5}
        autoFocus
        className="w-full resize-y rounded-lg border border-gray-border bg-white px-5 py-3 text-base leading-relaxed text-foreground placeholder:text-gray-light outline-none transition-colors focus:border-foreground"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-lg border py-5 transition-colors ${
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
            Or drop a file here (PDF, DOC, DOCX, PPT, PPTX)
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
