import { EvaluationResult } from "@/lib/types";

/** Stamps trimmed to their ink and set to the same 4 degree tilt as the home page strip. */
const STAMP_IMAGES: Record<string, string> = {
  "Crystal Clear": "/stamps/trim/crystal-clear.png",
  "On Point": "/stamps/trim/on-point.png",
  "Getting There": "/stamps/trim/getting-there.png",
  Hazy: "/stamps/trim/hazy.png",
  Muddled: "/stamps/trim/muddled.png",
  Lost: "/stamps/trim/lost.png",
  Nope: "/stamps/trim/nope.png",
};

export default function ScoreDisplay({ result }: { result: EvaluationResult }) {
  const stampSrc = STAMP_IMAGES[result.rating_name] || STAMP_IMAGES.Muddled;

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full justify-center rounded-[20px] border border-[var(--ui-panel-border)] bg-[var(--ui-panel)] px-6 py-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stampSrc} alt={result.rating_name} className="h-[76px] w-auto mix-blend-multiply sm:h-[104px]" />
      </div>
      <p className="mt-6 text-[44px] font-semibold leading-none tracking-[-0.03em] text-[var(--ui-ink)] tabular-nums">
        {result.overall}
        <span className="ml-0.5 text-2xl font-medium text-[var(--ui-muted)]">/100</span>
      </p>
      {result.verdict && (
        <p className="mt-4 max-w-[600px] text-balance text-center text-[20px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ui-ink)]">
          {result.verdict}
        </p>
      )}
    </div>
  );
}
