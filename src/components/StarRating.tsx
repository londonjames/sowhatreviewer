"use client";

import { useId } from "react";

const PATH =
  "M10 1.5l2.47 5.01L18.5 7.4l-4.25 4.14 1 5.83L10 14.48l-5.25 2.89 1-5.83L1.5 7.4l6.03-.89L10 1.5z";

/** Five stars in half steps, drawn in the accent colour (currentColor). */
export default function StarRating({ rating }: { rating: number }) {
  const id = useId();
  return (
    <div className="flex items-center gap-[3px] text-[var(--ui-accent-text)]" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rating >= star ? "full" : rating >= star - 0.5 ? "half" : "empty";
        const clip = `${id}-star-${star}`;
        return (
          <svg key={star} width="18" height="18" viewBox="0 0 20 20" fill="none">
            {fill === "half" && (
              <defs>
                <clipPath id={clip}>
                  <rect x="0" y="0" width="10" height="20" />
                </clipPath>
              </defs>
            )}
            {fill !== "empty" && (
              <path d={PATH} fill="currentColor" clipPath={fill === "half" ? `url(#${clip})` : undefined} />
            )}
            <path d={PATH} fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        );
      })}
    </div>
  );
}
