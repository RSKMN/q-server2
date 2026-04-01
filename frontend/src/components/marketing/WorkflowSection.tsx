const steps = [
  {
    title: "Generate",
    description: "Create a broad set of promising molecule candidates.",
  },
  {
    title: "Filter",
    description: "Keep molecules with strong drug-like properties.",
  },
  {
    title: "Dock",
    description: "Check how each molecule fits the target protein.",
  },
  {
    title: "Simulate",
    description: "Test interaction stability over virtual time.",
  },
  {
    title: "Quantum",
    description: "Run deeper quantum validation for top hits.",
  },
];

export function WorkflowSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-surface/60 px-6 py-12 md:px-10 md:py-14">
      <h2 className="font-heading text-3xl text-text md:text-4xl">Workflow</h2>
      <p className="mt-4 max-w-3xl font-body text-base leading-7 text-text-muted">
        From idea generation to quantum validation, each stage narrows the search
        to the best therapeutic candidates.
      </p>

      <ol className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex-1">
            <article className="h-full rounded-2xl border border-border/80 bg-background-muted/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/70">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/60 bg-accent/10 font-heading text-xs text-accent">
                {index + 1}
              </div>
              <h3 className="mt-4 font-heading text-lg text-text">{step.title}</h3>
              <p className="mt-2 font-body text-sm leading-6 text-text-muted">
                {step.description}
              </p>
            </article>

            {index < steps.length - 1 && (
              <>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 h-4 w-px -translate-x-1/2 bg-border lg:hidden" />
                <span className="pointer-events-none absolute right-[-0.9rem] top-1/2 hidden -translate-y-1/2 font-heading text-lg text-text-subtle lg:block">
                  →
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}