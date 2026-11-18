import Image from "next/image";
import InputArea from "@/components/InputArea";

const SERIF = { fontFamily: "var(--font-garamond), Georgia, serif" };

/**
 * The 0-100 scale, with three stamps sitting over the middle of their bands
 * (Nope 0-19, Hazy 60-69, Crystal Clear 90-100). The other four ratings are
 * shown on the result page, not here.
 */
const STAMPS = [
  { at: 10, label: "Nope", src: "/stamps/nope.png" },
  { at: 65, label: "Hazy", src: "/stamps/hazy.png" },
  { at: 95, label: "Crystal Clear", src: "/stamps/crystal-clear.png" },
];

const TICKS = [0, 50, 100];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previous?: string }>;
}) {
  const { previous } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pt-10 pb-8">
      <div className="w-full max-w-2xl text-center">
        <h1
          className="text-3xl font-medium italic tracking-tight md:text-4xl"
          style={{ ...SERIF, color: "#1a5a8a" }}
        >
          Does Your Document Convey A Clear So What?
        </h1>
        <p className="mt-3 text-xl text-gray md:text-2xl">
          Is its <span className="font-bold">intent</span> clear? Does it{" "}
          <span className="font-bold">deliver</span>? Is there a strong{" "}
          <span className="font-bold">narrative</span>?
        </p>

        {/* 0-100 scale */}
        <div className="relative mx-auto mt-6 w-full max-w-xl px-8">
          <div className="relative h-[64px]">
            {STAMPS.map((s) => (
              <Image
                key={s.label}
                src={s.src}
                alt={s.label}
                width={200}
                height={100}
                className="absolute bottom-0 h-auto w-[128px] max-w-none -translate-x-1/2"
                style={{ left: `${s.at}%` }}
              />
            ))}
          </div>
          <div className="relative mt-2 h-px bg-black">
            {TICKS.map((t) => (
              <div
                key={t}
                className="absolute top-0 h-3 w-px -translate-y-1/2 bg-black"
                style={{ left: `${t}%` }}
              />
            ))}
          </div>
          <div className="relative mt-2 h-6">
            {TICKS.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2 text-base font-medium text-foreground"
                style={{ left: `${t}%` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 w-full max-w-xl">
        <InputArea previousId={previous} />
      </div>
      <p
        className="mt-6 text-center text-sm text-gray-light"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        Reviewed against James Raybould&apos;s bar for executive documents.
      </p>
    </div>
  );
}
