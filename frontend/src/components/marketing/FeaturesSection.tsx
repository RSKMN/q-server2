const features = [
  {
    title: "AI Molecular Generation",
    text: "Generate high-potential molecular candidates rapidly from target-driven objectives.",
    icon: "AI",
  },
  {
    title: "ADMET Prediction",
    text: "Estimate absorption, safety, and metabolism early to reduce downstream failure.",
    icon: "AD",
  },
  {
    title: "Docking & Binding Analysis",
    text: "Evaluate how molecules fit and interact with target proteins before lab testing.",
    icon: "DB",
  },
  {
    title: "Quantum Simulation",
    text: "Refine top compounds with deeper simulation for higher confidence decisions.",
    icon: "QS",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="rounded-3xl border border-border/70 bg-surface/50 px-6 py-14 md:px-10 md:py-16">
      <h2 className="font-heading text-3xl tracking-tight text-text md:text-4xl">Features</h2>
      <p className="mt-5 max-w-3xl font-body text-base leading-8 text-text-muted md:text-lg">
        Four core capabilities built for fast, reliable, and explainable scientific discovery.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-border/80 bg-background-muted/45 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 hover:border-accent/70 hover:bg-surface-subtle/65 hover:shadow-xl hover:shadow-accent/10"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.09), transparent 55%)" }} />
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/50 bg-accent/10 font-heading text-xs font-semibold tracking-wider text-accent transition group-hover:border-accent group-hover:bg-accent/20">
              {feature.icon}
            </div>
            <h3 className="mt-5 font-heading text-xl text-text">{feature.title}</h3>
            <p className="mt-3 font-body text-sm leading-7 text-text-muted md:text-base">
              {feature.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}