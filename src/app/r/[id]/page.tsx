"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EvaluationResult, ratingName as computeRatingName } from "@/lib/types";
import { reviewToMarkdown } from "@/lib/markdown";
import ReviewBody from "@/components/ReviewBody";

interface StoredResult {
  evaluation: EvaluationResult;
  truncated?: boolean;
}

function takeSessionResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("sowhat_result");
    if (!stored) return null;
    sessionStorage.removeItem("sowhat_result");
    const parsed = JSON.parse(stored);
    // Older entries stored the evaluation directly.
    return parsed?.evaluation ? parsed : { evaluation: parsed };
  } catch {
    return null;
  }
}

export default function SavedReviewPage() {
  const params = useParams();
  const router = useRouter();
  const cached = useMemo(() => takeSessionResult(), []);
  const [stored, setStored] = useState<StoredResult | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cached) return;
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/review?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setStored({ evaluation: data.evaluation });
        setLoading(false);
      })
      .catch(() => {
        setError("Review not found.");
        setLoading(false);
      });
  }, [params.id, cached]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-accent" />
      </div>
    );
  }

  if (error || !stored) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray">{error || "Review not found."}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl border border-gray-border px-6 py-2 text-sm text-foreground hover:bg-surface"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <ReviewLayout
      stored={stored}
      reviewId={params.id as string}
      router={router}
    />
  );
}

const ACTION_CLASS =
  "rounded-lg border border-gray-border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[#1a5a8a] transition-colors hover:border-[#1a5a8a] hover:bg-[#1a5a8a] hover:text-white";

function ReviewLayout({
  stored,
  reviewId,
  router,
}: {
  stored: StoredResult;
  reviewId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  // Backward compat: early evaluations used a single `mirror` string.
  const raw = stored.evaluation as EvaluationResult & { mirror?: string };
  const result: EvaluationResult = {
    ...raw,
    mirror_lead: raw.mirror_lead || raw.mirror || "",
    mirror_bullets: raw.mirror_bullets || [],
    rating_name: raw.rating_name || computeRatingName(raw.overall),
    verdict: raw.verdict || "",
    rewrites: raw.rewrites || [],
    red_team: raw.red_team || [],
  };

  const copy = async (kind: "link" | "text") => {
    const payload =
      kind === "link" ? window.location.href : reviewToMarkdown(result);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard access can be denied; nothing useful to say here.
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <ReviewBody result={result} truncated={stored.truncated} />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/?previous=${reviewId}`)}
            className="rounded-lg border border-[#1a5a8a] bg-[#1a5a8a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-[#1a5a8a]"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            Re-review after edits
          </button>
          <button
            onClick={() => copy("link")}
            className={ACTION_CLASS}
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {copied === "link" ? "Link copied" : "Share this review"}
          </button>
          <button
            onClick={() => copy("text")}
            className={ACTION_CLASS}
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {copied === "text" ? "Copied" : "Copy as text"}
          </button>
          <button
            onClick={() => router.push("/")}
            className={ACTION_CLASS}
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            New document
          </button>
        </div>

        <p
          className="mt-10 text-center text-sm text-gray-light"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          Reviewed against James Raybould&apos;s bar for executive documents.
        </p>
      </div>
    </div>
  );
}
