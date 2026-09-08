"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TeamReviewResult } from "@/lib/team-types";
import TeamReviewBody from "@/components/team/TeamReviewBody";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

const ACTION_CLASS =
  "rounded-lg border border-gray-border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[#1a5a8a] transition-colors hover:border-[#1a5a8a] hover:bg-[#1a5a8a] hover:text-white";

interface Stored {
  review: TeamReviewResult;
  truncated?: boolean;
}

/**
 * The review the author was just shown, handed over from the submit page so the
 * result renders instantly instead of waiting on a round trip to Redis.
 */
function takeSessionResult(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("sowhat_team_result");
    if (!raw) return null;
    sessionStorage.removeItem("sowhat_team_result");
    const parsed = JSON.parse(raw);
    return parsed?.review ? parsed : null;
  } catch {
    return null;
  }
}

export default function TeamReviewPage() {
  const params = useParams();
  const router = useRouter();
  const cached = useMemo(() => takeSessionResult(), []);
  const [stored, setStored] = useState<Stored | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cached) return;
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/team-review?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setStored({ review: data.review });
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
        <button onClick={() => router.push("/team")} className={ACTION_CLASS}>
          New document
        </button>
      </div>
    );
  }

  const copyLink = async () => {
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
        <TeamReviewBody
          result={stored.review}
          truncated={stored.truncated}
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/team?previous=${params.id}`)}
            className="rounded-lg border border-[#1a5a8a] bg-[#1a5a8a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-[#1a5a8a]"
            style={SANS}
          >
            Re-review after edits
          </button>
          <button onClick={copyLink} className={ACTION_CLASS} style={SANS}>
            {copied ? "Link copied" : "Share this review"}
          </button>
          <button
            onClick={() => router.push("/team")}
            className={ACTION_CLASS}
            style={SANS}
          >
            New document
          </button>
        </div>

        <p className="mt-10 text-center text-sm text-gray-light" style={SANS}>
          The questions James asks, run against your document before he sees it.
        </p>
      </div>
    </div>
  );
}
