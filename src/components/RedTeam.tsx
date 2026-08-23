export default function RedTeam({ questions }: { questions: string[] }) {
  if (!questions.length) return null;

  return (
    <section>
      <h2
        className="text-xl uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--font-inter), sans-serif", color: "#8b3a3a" }}
      >
        What You&apos;ll Get Asked
      </h2>
      <p className="mt-2 text-base italic text-gray-light">
        Questions this document leaves you unable to answer.
      </p>
      <ol className="mt-5 space-y-4">
        {questions.map((question, i) => (
          <li key={i} className="flex gap-4">
            <span
              className="shrink-0 text-2xl font-semibold leading-none"
              style={{
                fontFamily: "var(--font-garamond), Georgia, serif",
                color: "#8b3a3a",
              }}
            >
              {i + 1}
            </span>
            <p className="text-lg leading-relaxed text-foreground">{question}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
