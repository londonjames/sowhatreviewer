"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { EvaluationResult } from "@/lib/types";
import ReviewBody from "@/components/ReviewBody";
import PageShell, { SECONDARY_BUTTON } from "@/components/PageShell";

interface StoredResult {
  evaluation: EvaluationResult;
  truncated?: boolean;
}

/**
 * Fallback route for when a review could not be persisted (no Redis
 * configured), so there is no shareable /r/[id] to send the author to.
 */
function getStoredResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("sowhat_result");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.evaluation ? parsed : { evaluation: parsed };
  } catch {
    return null;
  }
}

export default function ReviewPage() {
  const router = useRouter();
  const stored = useMemo(() => getStoredResult(), []);

  if (!stored) {
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ui-line)] border-t-[var(--ui-accent)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ReviewBody result={stored.evaluation} truncated={stored.truncated} />
      <div className="flex justify-center pt-12">
        <button onClick={() => router.push("/")} className={SECONDARY_BUTTON}>
          Review another document
        </button>
      </div>
      <p className="mt-10 text-center text-sm text-[var(--ui-muted)]">
        Reviewed against James Raybould&apos;s bar for executive documents.
      </p>
    </PageShell>
  );
}
