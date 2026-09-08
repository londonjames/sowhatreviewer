import TeamInput from "@/components/team/TeamInput";
import { CATEGORIES, QUESTIONS } from "@/lib/questions";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ previous?: string }>;
}) {
  const { previous } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-16 pt-16">
      <div className="w-full max-w-2xl text-center">
        <h1
          className="text-3xl font-medium italic tracking-tight md:text-4xl"
          style={{
            fontFamily: "var(--font-garamond), Georgia, serif",
            color: "#1a5a8a",
          }}
        >
          What James Will Ask
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-gray md:text-2xl">
          {previous
            ? "Paste your revised document. You will get the same questions, and what has moved since last time."
            : "Put your document through the questions before he does, so you can answer them first."}
        </p>

        {!previous && (
          <div className="mt-10 flex flex-wrap justify-center gap-x-3 gap-y-2">
            {CATEGORIES.map((category, i) => (
              <span
                key={category.id}
                className="rounded-full border border-gray-border px-4 py-1.5 text-sm uppercase tracking-[0.12em] text-gray"
                style={SANS}
              >
                {i + 1}. {category.name}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 text-base text-gray-light" style={SANS}>
          {QUESTIONS.length} questions, {CATEGORIES.length} categories, scored out
          of five. Takes about a minute.
        </p>
      </div>

      <div className="mt-10 w-full max-w-lg">
        <TeamInput previousId={previous} />
      </div>

      <p className="mt-12 max-w-lg text-center text-sm text-gray-light" style={SANS}>
        Nothing you paste here is shared with anyone. This is the review before
        the review.
      </p>
    </div>
  );
}
