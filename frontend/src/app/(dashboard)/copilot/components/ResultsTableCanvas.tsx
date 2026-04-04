const ROWS = [
  { id: "CMP-1021", score: 0.92, status: "Ready" },
  { id: "CMP-1134", score: 0.88, status: "Review" },
  { id: "CMP-1202", score: 0.84, status: "Ready" },
  { id: "CMP-0988", score: 0.81, status: "Flagged" },
  { id: "CMP-0774", score: 0.79, status: "Review" },
];

export default function ResultsTableCanvas() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <section className="rounded-2xl border border-emerald-300/30 bg-slate-900/70 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">Results Table</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-100">Top Candidate Ranking</h3>
        <p className="mt-2 text-sm text-slate-400">
          Sorted candidates based on similarity, docking performance, and quality filters.
        </p>
      </section>

      <section className="min-h-0 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Composite Score</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.id} className="border-b border-white/5 text-slate-200">
                <td className="px-3 py-3 font-medium">{row.id}</td>
                <td className="px-3 py-3">{row.score.toFixed(2)}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
