const pipelineSteps = [
  {
    title: "Molecular Generation",
    detail:
      "The platform proposes many new molecule ideas to start the search faster.",
  },
  {
    title: "Drug-Likeness Filtering",
    detail:
      "It keeps the molecules that look safer and more practical for real medicine use.",
  },
  {
    title: "Docking & Interaction",
    detail:
      "Each molecule is tested virtually to see how well it can fit the target protein.",
  },
  {
    title: "Molecular Dynamics Simulation",
    detail:
      "Promising candidates are checked over time to see if interactions stay stable.",
  },
  {
    title: "Quantum Validation",
    detail:
      "Final candidates are validated with deeper quantum checks for extra confidence.",
  },
];

export function ProductOverviewSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-surface-subtle/60 px-6 py-12 md:px-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl tracking-tight text-text md:text-4xl">
          Product Overview
        </h2>
        <p className="mt-4 max-w-3xl font-body text-base leading-7 text-text-muted">
          QuinfosysTM QuDrugForge, Quantum AI for Drug Discovery, guides teams
          from idea to validated candidates in one AI-driven workflow. It is
          designed to be clear enough for non-experts while still useful for
          research professionals.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pipelineSteps.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-2xl border border-border bg-background-muted/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/55 hover:bg-surface/70"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/60 bg-accent/10 font-heading text-sm text-accent">
                {index + 1}
              </div>
              <h3 className="font-heading text-lg leading-snug text-text">{step.title}</h3>
              <p className="mt-3 font-body text-sm leading-6 text-text-muted">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}