import Image from "next/image";
import InputArea from "@/components/InputArea";

/**
 * The seven ratings, low to high. Three carry a stamp; the other four show
 * their name. Only the two ends and the middle carry a number.
 */
const SCALE_ITEMS = [
  { label: "Nope", color: "#8b3a3a", stamp: "/stamps/nope.png", n: "0" },
  { label: "Lost", color: "#8b3a3a" },
  { label: "Muddled", color: "#8b6914" },
  { label: "Hazy", color: "#1a5a8a", stamp: "/stamps/hazy.png", n: "50" },
  { label: "Getting There", color: "#1a5a8a" },
  { label: "On Point", color: "#1a6b35" },
  { label: "Crystal Clear", color: "#1a6b35", stamp: "/stamps/crystal-clear.png", n: "100" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previous?: string }>;
}) {
  const { previous } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pt-8 pb-6 md:pt-12">
      <h1 className="w-full max-w-4xl text-center text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[#14324d] text-balance md:text-[2.5rem] lg:whitespace-nowrap">
        Does your document convey a clear So&nbsp;What?
      </h1>
      <div className="w-full max-w-2xl text-center">
        <p className="mt-3 text-lg text-gray md:text-xl">
          Is its <span className="font-semibold text-foreground">intent</span> clear? Does it{" "}
          <span className="font-semibold text-foreground">deliver</span>? Is there a strong{" "}
          <span className="font-semibold text-foreground">narrative</span>?
        </p>

        {/* Rating scale */}
        <div className="mt-6 w-full md:mt-8">
          <div className="flex items-end">
            {SCALE_ITEMS.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 justify-center overflow-visible">
                {item.stamp ? (
                  <Image
                    src={item.stamp}
                    alt={item.label}
                    width={400}
                    height={200}
                    className="h-auto w-[80px] max-w-none shrink-0 mix-blend-multiply sm:w-[160px]"
                    priority
                  />
                ) : (
                  <div className="h-[40px] sm:h-[64px]" />
                )}
              </div>
            ))}
          </div>

          {/* Line and seven tick marks */}
          <div className="relative mt-2 h-4">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#bdb7ab]" />
            <div className="relative flex h-full">
              {SCALE_ITEMS.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 items-start justify-center">
                  <div
                    className={`w-px ${item.stamp ? "h-4 bg-[#14324d]" : "mt-[3px] h-2.5 bg-[#bdb7ab]"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Numbers at 0, 50 and 100; names under the four unstamped ticks */}
          <div className="mt-2 flex">
            {SCALE_ITEMS.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 justify-center overflow-visible">
                {item.stamp ? (
                  <span className="text-sm font-semibold tabular-nums text-[#14324d]">{item.n}</span>
                ) : (
                  <span
                    className="hidden whitespace-nowrap text-sm font-medium sm:inline"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-xl">
        <InputArea previousId={previous} />
      </div>
      <p className="mt-6 text-center text-sm text-gray-light">
        Reviewed against James Raybould&apos;s bar for executive documents.
      </p>
    </div>
  );
}
