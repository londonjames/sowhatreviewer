/**
 * Tolerant parse of an in-flight JSON object.
 *
 * The model streams the evaluation as a partial JSON string, so at any moment
 * the tail is usually mid-key, mid-string or mid-array. Closing the open
 * structures gives us a valid object containing every field that has finished
 * arriving, which is what drives the progressive reveal on the review page.
 *
 * Returns null when the fragment cannot be salvaged; callers treat that as
 * "nothing new to show yet" and fall back to the completed response.
 */
export function parsePartialJson(
  fragment: string
): Record<string, unknown> | null {
  if (!fragment.trim()) return null;

  try {
    return JSON.parse(fragment) as Record<string, unknown>;
  } catch {
    // Expected while streaming; fall through and repair.
  }

  const repaired = repair(fragment);
  if (!repaired) return null;

  try {
    return JSON.parse(repaired) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function repair(fragment: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  // Index just past the last structurally complete value, so we can discard a
  // half-written key or value rather than emitting a truncated one.
  let safeEnd = 0;

  for (let i = 0; i < fragment.length; i++) {
    const ch = fragment[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      if (!inString) safeEnd = i + 1;
      continue;
    }
    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      const expected = ch === "}" ? "{" : "[";
      if (stack[stack.length - 1] !== expected) return null;
      stack.pop();
      safeEnd = i + 1;
    } else if (ch === "," || /[0-9truefalsn]/.test(ch)) {
      // Numbers, literals and separators all end a complete value.
      safeEnd = i + 1;
    }
  }

  if (stack.length === 0) return fragment.slice(0, safeEnd) || null;

  let head = fragment.slice(0, Math.max(safeEnd, 0));

  // Drop a trailing separator or a dangling key such as `"verdict":`.
  head = head.replace(/,\s*$/, "").replace(/,?\s*"[^"]*"\s*:\s*$/, "");
  if (!head.trim()) return null;

  const closers = stack
    .slice()
    .reverse()
    .map((open) => (open === "{" ? "}" : "]"))
    .join("");

  return head + closers;
}
