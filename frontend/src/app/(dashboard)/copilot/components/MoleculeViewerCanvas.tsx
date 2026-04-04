export default function MoleculeViewerCanvas() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <section className="rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Molecule Viewer</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-100">QN-473 Lead Scaffold</h3>
        <p className="mt-2 text-sm text-slate-400">
          Interactive molecular summary for physicochemical and screening metrics.
        </p>
      </section>

      <section className="grid min-h-0 gap-4 md:grid-cols-[1.1fr_1fr]">
        <article className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 p-6">
          <div className="relative h-56 w-56 rounded-full border border-cyan-300/40 bg-cyan-400/5">
            <div className="absolute left-1/2 top-3 h-7 w-7 -translate-x-1/2 rounded-full border border-cyan-200/80 bg-cyan-300/20" />
            <div className="absolute bottom-4 left-5 h-6 w-6 rounded-full border border-cyan-200/80 bg-cyan-300/20" />
            <div className="absolute bottom-4 right-5 h-6 w-6 rounded-full border border-cyan-200/80 bg-cyan-300/20" />
            <div className="absolute left-8 top-20 h-6 w-6 rounded-full border border-cyan-200/80 bg-cyan-300/20" />
            <div className="absolute right-8 top-20 h-6 w-6 rounded-full border border-cyan-200/80 bg-cyan-300/20" />
          </div>
        </article>

        <article className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          {[
            ["Potency", "8.9 pIC50"],
            ["Selectivity", "34x"],
            ["LogP", "2.3"],
            ["TPSA", "69 A^2"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">{value}</p>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
