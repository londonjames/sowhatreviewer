"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EvaluationResult, ratingName as computeRatingName } from "@/lib/types";
import ReviewBody from "@/components/ReviewBody";
import PageShell, { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/PageShell";

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
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ui-line)] border-t-[var(--ui-accent)]" />
        </div>
      </PageShell>
    );
  }

  if (error || !stored) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-[var(--ui-ink-2)]">{error || "Review not found."}</p>
          <button onClick={() => router.push("/")} className={SECONDARY_BUTTON}>
            Review a document
          </button>
        </div>
      </PageShell>
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
    <PageShell>
      <ReviewBody result={result} truncated={stored.truncated} />

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => router.push(`/?previous=${reviewId}`)} className={PRIMARY_BUTTON}>
          Re-review
        </button>
        <button onClick={share} className={SECONDARY_BUTTON}>
          {copied ? "Link copied" : "Share"}
        </button>
        <button onClick={() => router.push("/")} className={SECONDARY_BUTTON}>
          New review
        </button>
      </div>

      <p className="mt-10 text-center text-sm text-[var(--ui-muted)]">
        Reviewed against James Raybould&apos;s bar for executive documents.{" "}
        <a href="/instructions" className="underline decoration-[var(--ui-line)] underline-offset-4 hover:text-[var(--ui-accent-text)]">
          How documents are scored
        </a>
      </p>
    </PageShell>
  );
}
