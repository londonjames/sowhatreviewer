/**
 * Recent reviews, kept in localStorage so a returning author can re-review an
 * edited document against their previous pass. There are no accounts, so this
 * is per-browser and best-effort by design.
 */

const KEY = "sowhat_history";
const MAX_ENTRIES = 10;

export interface ReviewSummary {
  id: string;
  overall: number;
  verdict: string;
  createdAt: string;
}

export function getHistory(): ReviewSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReviewSummary[]) : [];
  } catch {
    return [];
  }
}

export function rememberReview(summary: ReviewSummary): void {
  if (typeof window === "undefined") return;
  try {
    const next = [
      summary,
      ...getHistory().filter((entry) => entry.id !== summary.id),
    ].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing and blocked site data both land here; not worth surfacing.
  }
}
