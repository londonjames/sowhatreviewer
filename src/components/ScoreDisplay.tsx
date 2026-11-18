import Image from "next/image";
import { EvaluationResult } from "@/lib/types";

const STAMP_IMAGES: Record<string, string> = {
  "Crystal Clear": "/stamps/crystal-clear.png",
  "On Point": "/stamps/on-point.png",
  "Getting There": "/stamps/getting-there.png",
  "Hazy": "/stamps/hazy.png",
  "Muddled": "/stamps/muddled.png",
  "Lost": "/stamps/lost.png",
  "Nope": "/stamps/nope.png",
};

interface ScoreDisplayProps {
  result: EvaluationResult;
}

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const stampSrc = STAMP_IMAGES[result.rating_name] || STAMP_IMAGES["Muddled"];

  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src={stampSrc}
        alt={result.rating_name}
        width={500}
        height={200}
        className="h-auto w-[420px] mix-blend-multiply"
        priority
      />
      <p
        className="max-w-xl text-center text-[1.7rem] leading-snug"
        style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}
      >
        <span className="font-bold">{result.overall}/100</span>
        {result.verdict && (
          <>
            {" — "}
            <span className="font-bold italic">{result.verdict}</span>
          </>
        )}
      </p>
    </div>
  );
}
