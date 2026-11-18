"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EvaluationResult, ratingName as computeRatingName } from "@/lib/types";
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

const BUTTON_CLASS =
  "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors";
const SECONDARY_CLASS =
  "border-gray-border text-[#1a5a8a] hover:border-[#1a5a8a]";

function ReviewLayout({
  stored,
  reviewId,
  router,
}: {
  stored: StoredResult;
  reviewId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [copied, setCopied] = useState(false);

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

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; nothing useful to say here.
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <ReviewBody result={result} truncated={stored.truncated} />

        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/?previous=${reviewId}`)}
            className={`${BUTTON_CLASS} border-[#1a5a8a] bg-[#1a5a8a] text-white hover:bg-white hover:text-[#1a5a8a]`}
          >
            Re-review
          </button>
          <button onClick={share} className={`${BUTTON_CLASS} ${SECONDARY_CLASS}`}>
            {copied ? "Link copied" : "Share"}
          </button>
          <button onClick={() => router.push("/")} className={`${BUTTON_CLASS} ${SECONDARY_CLASS}`}>
            New review
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
