export function HeroSection() {
  return (
    <section className="glass-card relative isolate overflow-hidden rounded-3xl px-6 py-12 md:px-10 md:py-16 lg:px-12 lg:py-20">
      <div className="pointer-events-none absolute -left-20 top-[-6rem] h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-4rem] h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
        <div>
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Investor-ready AI platform
          </p>

          <h1 className="mt-6 bg-[linear-gradient(110deg,#9be7ff_0%,#7dd3fc_28%,#d3ccff_58%,#8ea2ff_100%)] bg-clip-text font-heading text-4xl font-bold leading-[1.02] tracking-tight text-transparent sm:text-5xl lg:text-6xl xl:text-7xl">
            Quinfosys<span style={{ verticalAlign: "super", fontSize: "0.65em", lineHeight: 0 }}>™</span> QuDrugForge
          </h1>

          <p className="mt-5 max-w-xl text-lg font-semibold text-text/95 md:text-xl">
            Quantum AI for Drug Discovery
          </p>

          <p className="mt-5 max-w-2xl font-body text-base leading-8 text-text-muted md:text-lg">
            Move from molecular ideation to validated candidates with a unified platform for generation,
            screening, docking, simulation, and quantum-informed decision support.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="btn-primary-glow w-full rounded-xl px-7 py-3 text-sm font-semibold sm:w-auto">
              Start Building
            </button>
            <button className="btn-ghost-fill w-full rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-text sm:w-auto">
              Explore Live Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-text-subtle">
            <span>97% candidate filtering precision</span>
            <span>25x faster lead triage</span>
            <span>Enterprise ready</span>
          </div>
        </div>

        <div className="relative">
          <article className="glass-card hover-glow relative overflow-hidden rounded-2xl border border-white/15 p-5 transition duration-300 hover:-translate-y-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base text-text">Pipeline Signal Dashboard</h3>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {[88, 74, 96].map((value, index) => (
                <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
                    <span>{["Docking confidence", "ADMET safety", "Quantum stability"][index]}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#22d3ee,#7c83ff)]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-text-subtle">Top candidate</p>
                <p className="mt-1 font-heading text-lg text-text">QDF-127A</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-text-subtle">Binding score</p>
                <p className="mt-1 font-heading text-lg text-accent">-11.4</p>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_80%_0%,rgba(124,131,255,0.2),transparent_48%)]" />
          </article>
        </div>
      </div>
    </section>
  );
}