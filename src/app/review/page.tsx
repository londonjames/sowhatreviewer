"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { EvaluationResult } from "@/lib/types";
import ReviewBody from "@/components/ReviewBody";

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <ReviewBody
          result={stored.evaluation}
          truncated={stored.truncated}
        />

        <div className="flex justify-center pt-12">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-border px-8 py-3 text-sm uppercase tracking-[0.15em] text-[#1a5a8a] transition-colors hover:border-[#1a5a8a] hover:bg-[#1a5a8a] hover:text-white"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            Review another document
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
