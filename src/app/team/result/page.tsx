"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { TeamReviewResult } from "@/lib/team-types";
import TeamReviewBody from "@/components/team/TeamReviewBody";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

interface Stored {
  review: TeamReviewResult;
  truncated?: boolean;
}

/**
 * Fallback for when a review could not be persisted (no Redis configured), so
 * there is no shareable /t/[id] to send the author to.
 */
function getStoredResult(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("sowhat_team_result");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.review ? parsed : null;
  } catch {
    return null;
  }
}

export default function TeamResultPage() {
  const router = useRouter();
  const stored = useMemo(() => getStoredResult(), []);

  if (!stored) {
    if (typeof window !== "undefined") router.replace("/team");
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <TeamReviewBody result={stored.review} truncated={stored.truncated} />

        <p
          className="mt-10 rounded-lg border border-gray-border bg-surface p-4 text-center text-sm text-gray"
          style={SANS}
        >
          This review could not be saved, so it has no shareable link. Copy
          anything you need before leaving the page.
        </p>

        <div className="flex justify-center pt-8">
          <button
            onClick={() => router.push("/team")}
            className="rounded-lg border border-gray-border px-8 py-3 text-sm uppercase tracking-[0.15em] text-[#1a5a8a] transition-colors hover:border-[#1a5a8a] hover:bg-[#1a5a8a] hover:text-white"
            style={SANS}
          >
            New document
          </button>
        </div>
      </div>
    </div>
  );
}
