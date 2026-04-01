export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border/70 bg-surface/55 px-6 py-16 shadow-2xl shadow-black/25 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 -z-20 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/15" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl md:h-96 md:w-96" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,140,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(126,140,184,0.14) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight text-transparent md:text-6xl lg:text-7xl bg-gradient-to-r from-accent via-text to-primary bg-clip-text">
          QuinfosysTM QuDrugForge
        </h1>

        <p className="mt-5 font-heading text-xl font-semibold text-text md:text-3xl">
          Quantum AI for Drug Discovery
        </p>

        <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-7 text-text-muted md:text-lg">
          Accelerate lead identification with an AI-driven pipeline for molecular
          screening, similarity search, and experiment intelligence.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="w-full rounded-xl bg-primary px-7 py-3 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:w-auto">
            Get Started
          </button>
          <button className="w-full rounded-xl border border-border-strong bg-background-muted/70 px-7 py-3 font-body text-sm font-semibold text-text transition hover:border-accent/80 hover:text-accent sm:w-auto">
            View Demo
          </button>
        </div>
      </div>
    </section>
  );
}