/**
 * The cap rule is the one piece of arithmetic the model cannot talk its way past,
 * so it is the one piece that gets tested directly.
 */
import { readFileSync } from "node:fs";

// team-types.ts is TypeScript; the cap function is plain arithmetic, so it is
// transpiled by stripping the annotations rather than pulling in a build step.
const src = readFileSync(new URL("../src/lib/team-types.ts", import.meta.url), "utf8");
const body = src
  .slice(src.indexOf("export function capOverall"))
  .slice(0, src.slice(src.indexOf("export function capOverall")).indexOf("export function overallName"));

const js = body
  .replace(/export function capOverall\([\s\S]*?\): number \{/, "function capOverall(proposed, categories) {")
  .replace(/\.filter\(\(s\): s is number =>/, ".filter((s) =>")
  .replace(/function clampStars\(n: number\): number \{/, "function clampStars(n) {")
  .replace(/Pick<CategoryVerdict, "score">\[\]/g, "");

const capOverall = new Function(`${js}; return capOverall;`)();

const cat = (...scores) => scores.map((score) => ({ score }));
let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} → ${actual} (expected ${expected})`);
}

check(
  "one category at 1.0 with six at 5.0 caps at 2",
  capOverall(5, cat(1, 5, 5, 5, 5, 5, 5)),
  2
);
check(
  "lowest 2.0 caps a proposed 5 at 3",
  capOverall(5, cat(2, 4.5, 5, 5, 4, 4.5, 5)),
  3
);
check(
  "lowest 3.5 caps a proposed 5 at 4",
  capOverall(5, cat(3.5, 4.5, 5, 5, 4, 4.5, 5)),
  4
);
check(
  "all fives allow a five",
  capOverall(5, cat(5, 5, 5, 5, 5, 5, 5)),
  5
);
check(
  "the model's own low proposal is never raised by the cap",
  capOverall(2, cat(5, 5, 5, 5, 5, 5, 5)),
  2
);
check(
  "not-applicable categories drop out of the cap",
  capOverall(5, cat(4.5, 4.5, null, null, 4.5, 4.5, 4.5)),
  5
);
check(
  "a half-star lowest floors rather than rounds up",
  capOverall(5, cat(2.5, 5, 5, 5, 5, 5, 5)),
  3
);
check("nothing scored falls back to the proposal", capOverall(4, cat(null, null)), 4);

console.log(failures ? `\n${failures} failing` : "\nAll cap-rule assertions pass");
process.exit(failures ? 1 : 0);
