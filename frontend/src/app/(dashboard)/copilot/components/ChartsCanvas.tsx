const BARS = [68, 82, 57, 91, 74, 63];

export default function ChartsCanvas() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <section className="rounded-2xl border border-teal-300/30 bg-slate-900/70 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-teal-200/80">Charts</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-100">Compound Distribution Insights</h3>
        <p className="mt-2 text-sm text-slate-400">
          Snapshot of potency and selectivity trends from current copilot context.
        </p>
      </section>

      <section className="grid min-h-0 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Potency Histogram</p>
          <div className="mt-4 flex h-48 items-end gap-2">
            {BARS.map((height, idx) => (
              <div key={idx} className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/70 to-cyan-200/90" style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Selectivity Trend</p>
          <div className="mt-5 h-48 rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex h-full items-end gap-2">
              {[22, 35, 31, 44, 52, 48, 61].map((point, idx) => (
                <div key={idx} className="relative flex-1">
                  <div
                    className="absolute bottom-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-teal-300"
                    style={{ height: `${point}%` }}
                  />
                  <div
                    className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-teal-100 bg-teal-300"
                    style={{ bottom: `calc(${point}% - 5px)` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
