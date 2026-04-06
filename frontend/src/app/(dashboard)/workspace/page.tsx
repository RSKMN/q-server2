import WorkspaceInputPanel from "@/components/workspace/WorkspaceInputPanel";
import WorkspaceActionButtons from "@/components/workspace/WorkspaceActionButtons";
import WorkspaceOutputPanel from "@/components/workspace/WorkspaceOutputPanel";

export default function WorkspacePage() {
  return (
    <div className="page-shell max-w-[1500px]">
      <div
        className="rounded-2xl border p-7 shadow-[0_20px_90px_-40px_rgba(56,189,248,0.45)] transition-shadow duration-300"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 20%, var(--border))",
          background: "linear-gradient(90deg, color-mix(in srgb, var(--bg) 20%, var(--card)), color-mix(in srgb, var(--accent) 8%, var(--card)), color-mix(in srgb, var(--accent) 14%, var(--bg)))",
        }}
      >
        <p className="page-kicker" style={{ color: "var(--accent)" }}>AI Workspace</p>
        <h1 className="page-title mt-2 sm:text-[2.05rem]" style={{ color: "var(--text)" }}>
          Drug Discovery Control Panel
        </h1>
        <p className="page-subtitle mt-3 max-w-3xl sm:text-[0.95rem]" style={{ color: "var(--muted-text)" }}>
          Configure generation tasks, monitor live execution logs, and evaluate high-priority molecular
          candidates in one unified workspace.
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-6">
          <WorkspaceInputPanel />
          <WorkspaceActionButtons />
        </section>

        <section className="space-y-6">
          <WorkspaceOutputPanel />
        </section>
      </div>
    </div>
  );
}
