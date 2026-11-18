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

/**
 * The top of a review: stamp, score, verdict. Every slot has a fixed size and
 * shows a placeholder until its value streams in, so the header is the same
 * shape from the first moment and nothing below it moves when the score lands.
 */
export default function ScoreDisplay({
  overall,
  rating,
  verdict,
}: {
  overall?: number;
  rating?: string;
  verdict?: string;
}) {
  const stampSrc = rating ? STAMP_IMAGES[rating] || STAMP_IMAGES.Muddled : undefined;

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full justify-center rounded-[20px] border border-[var(--ui-panel-border)] bg-[var(--ui-panel)] px-6 py-7">
        <div className="flex h-[76px] items-center sm:h-[104px]">
          {stampSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stampSrc} alt={rating} className="h-full w-auto mix-blend-multiply" />
          ) : (
            <div className="h-[60%] w-[200px] animate-pulse rounded-xl bg-black/[0.06] sm:w-[260px]" />
          )}
        </div>
      </div>

      <div className="mt-6 flex h-[44px] items-end">
        {overall !== undefined ? (
          <p className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-[var(--ui-ink)] tabular-nums">
            {overall}
            <span className="ml-0.5 text-2xl font-medium text-[var(--ui-muted)]">/100</span>
          </p>
        ) : (
          <div className="h-[36px] w-[120px] animate-pulse rounded-lg bg-[var(--ui-line)]" />
        )}
      </div>

      {/* Two lines reserved: the verdict is one sentence of at most 20 words. */}
      <div className="mt-4 flex min-h-[55px] w-full max-w-[600px] justify-center">
        {verdict ? (
          <p className="text-balance text-center text-[20px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ui-ink)]">
            {verdict}
          </p>
        ) : (
          <div className="h-[22px] w-[70%] animate-pulse rounded-md bg-[var(--ui-line)]" />
        )}
      </div>
    </div>
  );
}
