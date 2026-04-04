import { EmptyState } from "@/components/shared";

export default function SimulationPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-kicker text-cyan-300/80">Simulation</p>
        <h1 className="page-title text-slate-100">Simulation Workspace</h1>
        <p className="page-subtitle text-slate-400">
          Simulation controls are being finalized. Use Workspace to run and monitor active pipelines.
        </p>
      </header>

      <EmptyState
        title="Simulation module coming soon"
        description="Run pipeline to see data and simulation timelines in this section."
        ctaLabel="Go to Workspace"
        ctaHref="/workspace"
      />
    </div>
  );
}
