import InputArea from "@/components/InputArea";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * The rating strip. Stamps are trimmed to their ink and sized by height, so all
 * three look the same size. The end ticks sit under the centres of the end
 * stamps, so NOPE and CRYSTAL CLEAR sit the same distance from the panel edges.
 * Ratios are width / height of the trimmed images in public/stamps/trim.
 */
const NOPE = 2.5329;
const HAZY = 2.4301;
const CLEAR = 2.8355;
const NUDGE = 0; // px: adjust if the measured edge gaps differ.

const left = `calc(var(--h) * ${NOPE / 2})`;
const right = `calc(var(--h) * ${CLEAR / 2} + ${NUDGE}px)`;

const TICKS: { text: string; color?: string }[] = [
  { text: "0" },
  { text: "Lost", color: "#b42318" },
  { text: "Muddled", color: "#b54708" },
  { text: "50" },
  { text: "Getting There", color: "#175cd3" },
  { text: "On Point", color: "#067647" },
  { text: "100" },
];

function Stamp({ src, alt, ratio, style }: { src: string; alt: string; ratio: number; style: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute bottom-0 mix-blend-multiply"
      style={{ height: "var(--h)", width: `calc(var(--h) * ${ratio})`, ...style }}
    />
  );
}

function Scale() {
  return (
    <div className="rounded-[20px] border border-[var(--ui-panel-border)] bg-[var(--ui-panel)] px-4 pt-5 pb-3 scale-h sm:px-7 sm:pt-6">
      <div className="relative" style={{ height: "var(--h)" }}>
        <Stamp src="/stamps/trim/nope.png" alt="Nope" ratio={NOPE} style={{ left: 0 }} />
        <Stamp
          src="/stamps/trim/hazy.png"
          alt="Hazy"
          ratio={HAZY}
          style={{ left: `calc(${left} + (100% - ${left} - ${right}) / 2)`, transform: "translateX(-50%)" }}
        />
        <Stamp src="/stamps/trim/crystal-clear.png" alt="Crystal Clear" ratio={CLEAR} style={{ right: NUDGE }} />
      </div>

      <div className="relative mt-3 h-10" style={{ marginLeft: left, marginRight: right }}>
        <div
          className="absolute top-[7px] h-px bg-[#d4d4d4]"
          style={{ left: `calc(-1 * ${left})`, right: `calc(-1 * ${right})` }}
        />
        {TICKS.map((t, i) => {
          const at = `${(i / 6) * 100}%`;
          const anchor = !t.color;
          return (
            <div key={t.text}>
              <i
                className={`absolute w-px -translate-x-1/2 ${anchor ? "top-0 h-3.5 bg-[#111]" : "top-[3px] h-2 bg-[#d4d4d4]"}`}
                style={{ left: at }}
              />
              <span
                className={`absolute top-6 -translate-x-1/2 whitespace-nowrap text-[12.5px] tracking-[-0.01em] tabular-nums ${
                  anchor ? "font-semibold text-[#111]" : "hidden font-medium sm:inline"
                }`}
                style={{ left: at, color: t.color }}
              >
                {t.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previous?: string }>;
}) {
  const { previous } = await searchParams;

  return (
    <div className="themed min-h-screen bg-[var(--ui-page)] px-6 pt-16 pb-8 sm:pt-8 text-[var(--ui-ink)] transition-colors">
      <ThemeToggle />
      <div className="mx-auto w-full max-w-[680px]">
        <h1 className="text-balance text-center text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[40px] lg:whitespace-nowrap">
          Does your doc have a clear{" "}
          <span className="whitespace-nowrap text-[var(--ui-accent)]">So What?</span>
        </h1>
        <p className="mt-3 text-center text-[17px] text-[var(--ui-ink-2)] sm:text-[20px]">
          Is its <strong className="font-semibold text-[var(--ui-ink)]">intent</strong> clear? Does it{" "}
          <strong className="font-semibold text-[var(--ui-ink)]">deliver</strong>? Is there a strong{" "}
          <strong className="font-semibold text-[var(--ui-ink)]">narrative</strong>?
        </p>

        <div className="mt-6">
          <Scale />
        </div>

        <div className="mt-6">
          <InputArea previousId={previous} />
        </div>
      </div>
    </div>
  );
}
