import { EmptyState } from "@/components/shared";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-kicker" style={{ color: "var(--accent)" }}>Settings</p>
        <h1 className="page-title" style={{ color: "var(--text)" }}>Workspace Settings</h1>
        <p className="page-subtitle" style={{ color: "var(--muted-text)" }}>
          Configure your research workspace defaults and environment preferences.
        </p>
      </header>

      <EmptyState
        title="No settings configured yet"
        description="Start from Workspace and Dashboard, then return here to tune your defaults."
        ctaLabel="Go to Workspace"
        ctaHref="/workspace"
      />
    </div>
  );
}
