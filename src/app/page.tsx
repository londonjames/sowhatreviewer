import Image from "next/image";
import InputArea from "@/components/InputArea";

const SERIF = { fontFamily: "var(--font-garamond), Georgia, serif" };

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

        {/* Rating scale */}
        <div className="mt-6 w-full">
          <div className="flex items-end">
            {SCALE_ITEMS.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 justify-center overflow-visible">
                {item.stamp ? (
                  <Image
                    src={item.stamp}
                    alt={item.label}
                    width={400}
                    height={200}
                    className="h-auto w-[96px] max-w-none shrink-0 sm:w-[160px]"
                    priority
                  />
                ) : (
                  <div className="h-[40px] sm:h-[64px]" />
                )}
              </div>
            ))}
          </div>

          {/* Line and seven tick marks */}
          <div className="relative mt-1 h-4">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black" />
            <div className="relative flex h-full">
              {SCALE_ITEMS.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 items-start justify-center">
                  <div
                    className={`w-px bg-black ${item.stamp ? "h-4" : "mt-[3px] h-2.5"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Numbers at 0, 50 and 100; names under the four unstamped ticks */}
          <div className="mt-1 flex">
            {SCALE_ITEMS.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center overflow-visible">
                {item.stamp ? (
                  <span className="text-base font-medium text-foreground">{item.n}</span>
                ) : (
                  <span
                    className="whitespace-nowrap text-sm font-semibold italic sm:text-base"
                    style={{ ...SERIF, color: item.color }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
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
