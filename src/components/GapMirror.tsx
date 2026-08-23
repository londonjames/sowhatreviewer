import { GapMirror as GapMirrorData } from "@/lib/types";

const LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.15em] text-gray";

interface GapMirrorProps {
  gap: GapMirrorData;
}

export default function GapMirror({ gap }: GapMirrorProps) {
  return (
    <section
      className="rounded-lg border p-6"
      style={{ borderColor: "#1a5a8a", backgroundColor: "#f7fafc" }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className={LABEL_CLASS} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            What you meant
          </p>
          <p className="mt-2 text-lg leading-relaxed text-gray">
            {gap.intended}
          </p>
        </div>
        <div>
          <p className={LABEL_CLASS} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            What landed
          </p>
          <p className="mt-2 text-lg leading-relaxed text-gray">{gap.landed}</p>
        </div>
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: "#cbd9e4" }}>
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ fontFamily: "var(--font-inter), sans-serif", color: "#1a5a8a" }}
        >
          The gap
        </p>
        <p className="mt-2 text-xl font-semibold leading-snug text-foreground">
          {gap.gap}
        </p>
      </div>
    </section>
  );
}
