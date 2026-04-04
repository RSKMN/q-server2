"use client";

import { useWorkspaceStore } from "@/store";

const statusMeta: Record<
  ReturnType<typeof useWorkspaceStore.getState>["pipelineState"],
  {
    badgeLabel: string;
    badgeClassName: string;
    detail: string;
  }
> = {
  idle: {
    badgeLabel: "Idle",
    badgeClassName:
      "border-slate-600 bg-slate-700/40 text-slate-200",
    detail: "Waiting for a pipeline action.",
  },
  generating: {
    badgeLabel: "Generating",
    badgeClassName:
      "border-cyan-400/40 bg-cyan-500/20 text-cyan-200",
    detail: "Creating new candidate molecules from input constraints.",
  },
  docking: {
    badgeLabel: "Docking",
    badgeClassName:
      "border-amber-300/40 bg-amber-500/20 text-amber-200",
    detail: "Evaluating binding affinity across selected targets.",
  },
  running_full_pipeline: {
    badgeLabel: "Full Pipeline",
    badgeClassName:
      "border-blue-400/40 bg-blue-500/20 text-blue-200",
    detail: "Running generation, docking, and post-processing steps.",
  },
  completed: {
    badgeLabel: "Completed",
    badgeClassName:
      "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
    detail: "Latest run finished successfully.",
  },
  error: {
    badgeLabel: "Error",
    badgeClassName:
      "border-rose-400/40 bg-rose-500/20 text-rose-200",
    detail: "Run failed. Inspect logs and retry.",
  },
};

function formatPipelineState(state: ReturnType<typeof useWorkspaceStore.getState>["pipelineState"]) {
  return state.replace(/_/g, " ");
}

const actionDisplayMap = {
  generate: "generate molecules",
  docking: "run docking",
  pipeline: "run full pipeline",
} as const;

export default function WorkspaceStatusPanel() {
  const pipelineState = useWorkspaceStore((s) => s.pipelineState);
  const lastAction = useWorkspaceStore((s) => s.lastAction);
  const errorMessage = useWorkspaceStore((s) => s.errorMessage);

  const meta = statusMeta[pipelineState];
  const isRunning =
    pipelineState === "generating" ||
    pipelineState === "docking" ||
    pipelineState === "running_full_pipeline";

  const statusCards = [
    {
      label: "Run State",
      value: formatPipelineState(pipelineState),
      detail: meta.detail,
    },
    {
      label: "Model",
      value: "qforge-v4",
      detail: "Latent diffusion with property guidance",
    },
    {
      label: "Last Action",
      value: lastAction ? actionDisplayMap[lastAction] : "none",
      detail: "Most recent action triggered from controls",
    },
    {
      label: "Execution",
      value: isRunning ? "In progress" : "Stopped",
      detail: isRunning ? "Pipeline task currently running" : "No active pipeline task",
    },
  ];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Output</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Run Status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Current status: <span className="font-semibold text-slate-200">{formatPipelineState(pipelineState)}</span>
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.badgeClassName}`}
        >
          {meta.badgeLabel}
        </span>
      </div>

      {pipelineState === "error" && errorMessage ? (
        <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {statusCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-100">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
