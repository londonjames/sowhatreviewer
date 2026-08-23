import Image from "next/image";
import InputArea from "@/components/InputArea";

const SCALE_ITEMS = [
  { n: 1, label: "Nope", color: "#8b3a3a", stamp: "/stamps/nope.png" },
  { n: 2, label: "Lost", color: "#8b3a3a" },
  { n: 3, label: "Muddled", color: "#8b6914" },
  { n: 4, label: "Hazy", color: "#1a5a8a", stamp: "/stamps/hazy.png" },
  { n: 5, label: "Getting There", color: "#1a5a8a" },
  { n: 6, label: "On Point", color: "#1a6b35" },
  { n: 7, label: "Crystal Clear", color: "#1a6b35", stamp: "/stamps/crystal-clear.png" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ previous?: string }>;
}) {
  const { previous } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pt-16 pb-16">
      <div className="w-full max-w-2xl text-center">
        {/* Headline */}
        <h1
          className="text-3xl font-medium italic tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-garamond), Georgia, serif", color: "#1a5a8a" }}
        >
          Does Your Document Convey A Clear So What?
        </h1>
        <p className="mt-4 text-xl text-gray md:text-2xl">
          Is its <span className="font-bold">intent</span> clear? Does it{" "}
          <span className="font-bold">deliver</span>? Is there a{" "}
          strong <span className="font-bold">narrative</span>?
        </p>

        {/* Stamp scale */}
        <div className="mt-8 w-full">
          {/* Stamps row */}
          <div className="flex items-end">
            {SCALE_ITEMS.map((item) => (
              <div key={item.n} className="flex min-w-0 flex-1 justify-center overflow-visible">
                {item.stamp ? (
                  <Image
                    src={item.stamp}
                    alt={item.label}
                    width={200}
                    height={100}
                    className="h-auto w-[170px] max-w-none shrink-0"
                  />
                ) : (
                  <div className="h-[70px]" />
                )}
              </div>
            ))}
          </div>

          {/* Line + 7 ticks */}
          <div className="relative mt-1" style={{ height: 16 }}>
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black" />
            <div className="relative flex h-full">
              {SCALE_ITEMS.map((item) => {
                const isAnchor = !!item.stamp;
                return (
                  <div key={item.n} className="flex min-w-0 flex-1 items-start justify-center">
                    <div
                      className={`bg-black ${isAnchor ? "h-4 w-px" : "h-2.5 w-px"}`}
                      style={{ marginTop: isAnchor ? 0 : 3 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels — only non-stamp positions (stamps already show their name) */}
          <div className="mt-1 flex">
            {SCALE_ITEMS.map((item) => {
              const isAnchor = !!item.stamp;
              return (
                <div key={item.n} className="flex min-w-0 flex-1 flex-col items-center overflow-visible">
                  {isAnchor ? (
                    <span className="text-sm font-medium text-black">{item.n}</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-light">{item.n}</span>
                      <span
                        className="mt-0.5 whitespace-nowrap text-base font-semibold italic"
                        style={{ fontFamily: "var(--font-garamond), Georgia, serif", color: item.color }}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div className="mt-8">
          <p className="text-lg text-gray md:text-xl">
            {previous
              ? "Paste your revised document below, and we'll tell you what changed."
              : "Paste your document below, or add a file."}
          </p>
        </div>
      </div>
      <div className="mt-4 w-full max-w-lg">
        <InputArea previousId={previous} />
      </div>
      <p
        className="mt-12 text-center text-sm text-gray-light"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        Reviewed against James Raybould&apos;s bar for executive documents.
      </p>
    </div>
  );
}
