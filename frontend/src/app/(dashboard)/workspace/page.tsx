import WorkspaceInputPanel from "@/components/workspace/WorkspaceInputPanel";
import WorkspaceActionButtons from "@/components/workspace/WorkspaceActionButtons";
import WorkspaceOutputPanel from "@/components/workspace/WorkspaceOutputPanel";

export default function WorkspacePage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-10">
      <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-7 shadow-[0_20px_90px_-40px_rgba(56,189,248,0.45)] transition-shadow duration-300">
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">AI Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 sm:text-[2.05rem]">
          Drug Discovery Control Panel
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-[0.95rem]">
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
