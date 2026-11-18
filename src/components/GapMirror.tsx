import { GapMirror as GapMirrorData } from "@/lib/types";
import { Label } from "./SectionHeading";

export default function GapMirror({ gap }: { gap: GapMirrorData }) {
  return (
    <section className="rounded-2xl border border-[var(--ui-line)] bg-[var(--ui-card)] p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label>What you meant</Label>
          <p className="mt-2 text-[17px] leading-relaxed text-[var(--ui-ink-2)]">{gap.intended}</p>
        </div>
        <div>
          <Label>What landed</Label>
          <p className="mt-2 text-[17px] leading-relaxed text-[var(--ui-ink-2)]">{gap.landed}</p>
        </div>
      </div>
      <div className="mt-6 border-t border-[var(--ui-line)] pt-5">
        <Label className="!text-[var(--ui-accent-text)]">The gap</Label>
        <p className="mt-2 text-[19px] font-semibold leading-snug text-[var(--ui-ink)]">{gap.gap}</p>
      </div>
    </section>
  );
}
