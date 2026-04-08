const steps = [
  {
    icon: "GN",
    title: "Generate",
    description: "Create a broad set of promising molecule candidates.",
  },
  {
    icon: "FL",
    title: "Filter",
    description: "Keep molecules with strong drug-like properties.",
  },
  {
    icon: "DK",
    title: "Dock",
    description: "Check how each molecule fits the target protein.",
  },
  {
    icon: "SM",
    title: "Simulate",
    description: "Test interaction stability over virtual time.",
  },
  {
    icon: "QN",
    title: "Quantum",
    description: "Run deeper quantum validation for top hits.",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="glass-card rounded-3xl px-6 py-12 md:px-10 md:py-14">
      <h2 className="font-heading text-3xl text-text md:text-4xl">Workflow</h2>
      <p className="mt-4 max-w-3xl font-body text-base leading-8 text-text-muted">
        From idea generation to quantum validation, each stage narrows the search
        to the best therapeutic candidates.
      </p>

      <ol className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex-1">
            <article className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_14px_30px_rgba(34,211,238,0.12)]">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/55 bg-accent/10 font-heading text-[11px] font-semibold tracking-[0.16em] text-accent">
                {step.icon}
              </div>
              <h3 className="mt-4 font-heading text-lg text-text">{step.title}</h3>
              <p className="mt-2 font-body text-sm leading-6 text-text-muted">
                {step.description}
              </p>

              <p className="mt-4 text-xs uppercase tracking-[0.14em] text-text-subtle">
                Stage {index + 1}
              </p>
            </article>

            {index < steps.length - 1 && (
              <>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 h-4 w-px -translate-x-1/2 bg-white/20 lg:hidden" />
                <span className="pointer-events-none absolute right-[-0.9rem] top-1/2 hidden -translate-y-1/2 font-heading text-lg text-text-subtle lg:block">
                  {">"}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}