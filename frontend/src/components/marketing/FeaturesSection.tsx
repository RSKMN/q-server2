const features = [
  {
    title: "AI Molecular Generation",
    text: "Generate high-potential molecular candidates rapidly from target-driven objectives.",
    icon: "GN",
  },
  {
    title: "ADMET Prediction",
    text: "Estimate absorption, safety, and metabolism early to reduce downstream failure.",
    icon: "AD",
  },
  {
    title: "Docking & Binding Analysis",
    text: "Evaluate how molecules fit and interact with target proteins before lab testing.",
    icon: "DK",
  },
  {
    title: "Quantum Simulation",
    text: "Refine top compounds with deeper simulation for higher confidence decisions.",
    icon: "QS",
  },
  {
    title: "Research Copilot",
    text: "Ask natural-language questions across candidates, experiments, and molecular trends.",
    icon: "CP",
  },
  {
    title: "Experiment Intelligence",
    text: "Track outputs, compare runs, and move faster with reproducible scientific workflows.",
    icon: "EX",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="glass-card rounded-3xl px-6 py-14 md:px-10 md:py-16">
      <h2 className="font-heading text-3xl tracking-tight text-text md:text-4xl">Features</h2>
      <p className="mt-5 max-w-3xl font-body text-base leading-8 text-text-muted md:text-lg">
        Core capabilities engineered for fast, reliable, and explainable scientific discovery.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-[0_18px_44px_rgba(34,211,238,0.12)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(109,123,255,0.08) 45%, transparent 72%)" }} />
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/45 bg-accent/10 font-heading text-xs font-semibold tracking-[0.18em] text-accent transition group-hover:border-accent group-hover:bg-accent/20">
              {feature.icon}
            </div>
            <h3 className="mt-5 font-heading text-xl text-text">{feature.title}</h3>
            <p className="mt-3 font-body text-sm leading-7 text-text-muted md:text-base">
              {feature.text}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-text-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Production workflow ready
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}