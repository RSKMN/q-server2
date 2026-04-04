import { EmptyState } from "@/components/shared";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-kicker text-cyan-300/80">Settings</p>
        <h1 className="page-title text-slate-100">Workspace Settings</h1>
        <p className="page-subtitle text-slate-400">
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
