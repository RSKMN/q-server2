const plans = [
  {
    name: "Free Tier",
    price: "$0",
    cycle: "/month",
    points: [
      "1 research workspace",
      "Basic molecule generation",
      "Community support",
      "Limited monthly simulations",
    ],
    cta: "Start Free",
  },
  {
    name: "Research Tier",
    price: "$299",
    cycle: "/month",
    points: [
      "Up to 10 researchers",
      "Advanced ADMET and docking",
      "Higher simulation capacity",
      "Experiment analytics dashboard",
    ],
    cta: "Choose Research",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cycle: "pricing",
    points: [
      "Unlimited researchers",
      "Private deployment options",
      "Security and compliance controls",
      "Dedicated scientific success team",
    ],
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-surface-subtle/60 px-6 py-12 md:px-10 md:py-14">
      <h2 className="font-heading text-3xl text-text md:text-4xl">Pricing</h2>
      <p className="mt-4 max-w-3xl font-body text-base leading-7 text-text-muted">
        Flexible plans for individuals, research teams, and enterprise-scale drug
        discovery programs.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-6 transition duration-300 ${
              plan.featured
                ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
                : "border-border bg-background-muted/55"
            }`}
          >
            {plan.featured && (
              <p className="mb-3 inline-flex rounded-full border border-accent/70 bg-accent/15 px-3 py-1 font-body text-xs uppercase tracking-wider text-accent">
                Recommended
              </p>
            )}
            <h3 className="font-heading text-xl text-text">{plan.name}</h3>
            <p className="mt-4 font-heading text-3xl text-accent">
              {plan.price}
              <span className="ml-1 font-body text-base text-text-muted">{plan.cycle}</span>
            </p>
            <ul className="mt-5 space-y-2">
              {plan.points.map((point) => (
                <li key={point} className="flex items-start gap-2 font-body text-sm text-text-muted">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button
              className={`mt-7 w-full rounded-xl px-4 py-3 font-body text-sm font-semibold transition ${
                plan.featured
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "border border-border-strong bg-background-muted/70 text-text hover:border-accent/60 hover:text-accent"
              }`}
            >
              {plan.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}