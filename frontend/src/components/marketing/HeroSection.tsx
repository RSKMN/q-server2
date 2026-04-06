export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border/70 bg-surface/55 px-6 py-18 shadow-2xl shadow-black/25 md:px-12 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-20 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-20 rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.24),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(99,102,241,0.22),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl md:h-[26rem] md:w-[26rem]" />
      <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] -z-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,140,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(126,140,184,0.14) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="bg-gradient-to-r from-accent via-text to-primary bg-clip-text font-heading text-4xl font-bold leading-[1.05] tracking-tight text-transparent md:text-6xl lg:text-7xl">
          Quinfosys<span style={{ verticalAlign: "super", fontSize: "0.65em", lineHeight: 0 }}>™</span> QuDrugForge
        </h1>

        <p className="mt-6 font-heading text-xl font-semibold tracking-wide text-text-muted md:text-2xl">
          Quantum AI for Drug Discovery
        </p>

        <p className="mx-auto mt-7 max-w-2xl font-body text-base leading-8 text-text-muted md:text-lg">
          Accelerate lead identification with an AI-driven pipeline for molecular
          screening, similarity search, and experiment intelligence.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="w-full rounded-xl bg-primary px-7 py-3 font-body text-sm font-semibold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 sm:w-auto">
            Get Started
          </button>
          <button className="w-full rounded-xl border border-border-strong bg-background-muted/70 px-7 py-3 font-body text-sm font-semibold text-text transition duration-300 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent hover:shadow-lg hover:shadow-accent/10 sm:w-auto">
            View Demo
          </button>
        </div>
      </div>
    </section>
  );
}