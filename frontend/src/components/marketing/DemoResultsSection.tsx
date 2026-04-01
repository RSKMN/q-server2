const molecules = [
  {
    name: "QDF-127A",
    bindingScore: -11.4,
    drugLikeness: 92,
    confidence: 95,
    bestCandidate: true,
  },
  {
    name: "QDF-903C",
    bindingScore: -10.8,
    drugLikeness: 88,
    confidence: 89,
    bestCandidate: false,
  },
  {
    name: "QDF-411B",
    bindingScore: -10.2,
    drugLikeness: 84,
    confidence: 86,
    bestCandidate: false,
  },
  {
    name: "QDF-762D",
    bindingScore: -9.7,
    drugLikeness: 81,
    confidence: 82,
    bestCandidate: false,
  },
];

const summaryMetrics = [
  { label: "Best Binding", value: "-11.4 kcal/mol", delta: "+18% vs control" },
  { label: "Avg Drug-Likeness", value: "86.3 / 100", delta: "+12 points" },
  { label: "Top Candidate Confidence", value: "95%", delta: "high stability" },
];

export function DemoResultsSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-surface-subtle/70 px-6 py-12 md:px-10 md:py-14">
      <h2 className="font-heading text-3xl tracking-tight text-text md:text-4xl">
        Demo Results
      </h2>
      <p className="mt-4 max-w-3xl font-body text-base leading-7 text-text-muted">
        Mock screening output from QuinfosysTM QuDrugForge, Quantum AI for Drug
        Discovery, showing top-ranked molecules, predicted binding performance,
        and drug-likeness signals.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-border/80 bg-background-muted/50 p-5 backdrop-blur-sm transition duration-300 hover:border-primary/45 hover:bg-background-muted/60">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-xl text-text">Candidate Molecules</h3>
            <span className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-body text-xs text-accent">
              Top 4 Hits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-3 text-left font-body text-xs uppercase tracking-wider text-text-subtle">
                    Molecule
                  </th>
                  <th className="px-3 text-left font-body text-xs uppercase tracking-wider text-text-subtle">
                    Binding Score
                  </th>
                  <th className="px-3 text-left font-body text-xs uppercase tracking-wider text-text-subtle">
                    Drug-Likeness
                  </th>
                  <th className="px-3 text-left font-body text-xs uppercase tracking-wider text-text-subtle">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {molecules.map((molecule) => (
                  <tr
                    key={molecule.name}
                    className={`rounded-xl ${
                      molecule.bestCandidate
                        ? "bg-accent/10 ring-1 ring-accent/60"
                        : "bg-surface/70"
                    } transition duration-200 hover:brightness-110`}
                  >
                    <td className="rounded-l-xl px-3 py-3 font-heading text-sm text-text">
                      {molecule.name}
                      {molecule.bestCandidate && (
                        <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 font-body text-[10px] uppercase tracking-wider text-accent">
                          Best
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-body text-sm text-text-muted">
                      {molecule.bindingScore}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-border-subtle">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${molecule.drugLikeness}%` }}
                          />
                        </div>
                        <span className="font-body text-sm text-text-muted">
                          {molecule.drugLikeness}
                        </span>
                      </div>
                    </td>
                    <td className="rounded-r-xl px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-border-subtle">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${molecule.confidence}%` }}
                          />
                        </div>
                        <span className="font-body text-sm text-text-muted">
                          {molecule.confidence}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <article className="relative overflow-hidden rounded-2xl border border-border/80 bg-background-muted/55 p-5 backdrop-blur-sm transition duration-300 hover:border-primary/45 hover:bg-background-muted/65">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
            <h3 className="font-heading text-lg text-text">3D Molecule View</h3>
            <div className="mt-4 flex h-52 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface/60">
              <p className="font-body text-sm text-text-subtle">
                3D molecule visualization placeholder
              </p>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {summaryMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-border/80 bg-surface/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-accent/55"
              >
                <p className="font-body text-xs uppercase tracking-wider text-text-subtle">
                  {metric.label}
                </p>
                <p className="mt-2 font-heading text-2xl text-accent">{metric.value}</p>
                <p className="mt-2 font-body text-xs text-text-muted">{metric.delta}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}