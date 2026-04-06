import { EmptyState } from "@/components/shared";

export default function SimulationPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-kicker" style={{ color: "var(--accent)" }}>Simulation</p>
        <h1 className="page-title" style={{ color: "var(--text)" }}>Simulation Workspace</h1>
        <p className="page-subtitle" style={{ color: "var(--muted-text)" }}>
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
