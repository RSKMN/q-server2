"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { useWorkspaceStore } from "@/store";
import type { PipelineState } from "@/store";

const STATUS_META: Record<
  PipelineState,
  {
    label: string;
    badgeClassName: string;
    detail: string;
  }
> = {
  idle: {
    label: "Idle",
    badgeClassName: "border-slate-600 bg-slate-700/40 text-slate-200",
    detail: "Awaiting pipeline execution.",
  },
  generating: {
    label: "Generating",
    badgeClassName: "border-cyan-400/40 bg-cyan-500/20 text-cyan-200",
    detail: "Synthesizing candidate molecules from sequence and constraints.",
  },
  docking: {
    label: "Docking",
    badgeClassName: "border-amber-300/40 bg-amber-500/20 text-amber-200",
    detail: "Scoring molecular binding interactions across targets.",
  },
  running_full_pipeline: {
    label: "Full Pipeline",
    badgeClassName: "border-blue-400/40 bg-blue-500/20 text-blue-200",
    detail: "Running generation, docking, and downstream ranking end-to-end.",
  },
  completed: {
    label: "Completed",
    badgeClassName: "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
    detail: "Run completed successfully.",
  },
  error: {
    label: "Error",
    badgeClassName: "border-rose-400/40 bg-rose-500/20 text-rose-200",
    detail: "Run failed. Review logs for diagnostics.",
  },
};

const LOG_TEMPLATES: Record<
  Extract<PipelineState, "generating" | "docking" | "running_full_pipeline">,
  string[]
> = {
  generating: [
    "Encoding target sequence embeddings",
    "Sampling latent molecular candidates",
    "Applying LogP and QED constraints",
    "Filtering unstable scaffolds",
  ],
  docking: [
    "Preparing receptor pocket conformations",
    "Launching docking workers",
    "Aggregating binding affinity predictions",
    "Calibrating score confidence intervals",
  ],
  running_full_pipeline: [
    "Orchestrator started for full pipeline",
    "Generation stage active with guided constraints",
    "Docking stage queued with top candidates",
    "Post-processing and ranking intermediate outputs",
  ],
};

const MOCK_GENERATED_MOLECULES = [
  {
    id: "CND-1042",
    smiles: "CCN(CC)CCOC(=O)c1ccc(Cl)cc1",
    score: 0.931,
    docking: -10.7,
    qed: 0.82,
  },
  {
    id: "CND-0988",
    smiles: "CC(=O)Nc1ccc(O)cc1",
    score: 0.918,
    docking: -10.2,
    qed: 0.79,
  },
  {
    id: "CND-1120",
    smiles: "COc1ccc2nc(S(N)(=O)=O)sc2c1",
    score: 0.904,
    docking: -9.9,
    qed: 0.81,
  },
  {
    id: "CND-0876",
    smiles: "CN1CCC(CC1)C2=NC=CC(=N2)Cl",
    score: 0.891,
    docking: -9.5,
    qed: 0.76,
  },
  {
    id: "CND-1211",
    smiles: "CCOC(=O)N1CCN(CC1)c2ncc(Cl)cc2F",
    score: 0.884,
    docking: -9.2,
    qed: 0.78,
  },
];

function timestamped(message: string) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} | ${message}`;
}

export default function WorkspaceOutputPanel() {
  const pipelineState = useWorkspaceStore((s) => s.pipelineState);
  const pipelineLogs = useWorkspaceStore((s) => s.pipelineLogs);
  const intermediateResults = useWorkspaceStore((s) => s.intermediateResults);
  const errorMessage = useWorkspaceStore((s) => s.errorMessage);
  const appendLog = useWorkspaceStore((s) => s.appendLog);
  const updateIntermediateResult = useWorkspaceStore((s) => s.updateIntermediateResult);

  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const status = STATUS_META[pipelineState];
  const isRunning =
    pipelineState === "generating" ||
    pipelineState === "docking" ||
    pipelineState === "running_full_pipeline";

  const statusGlowClassName = isRunning
    ? "shadow-[0_0_45px_-22px_rgba(34,211,238,0.7)]"
    : pipelineState === "completed"
      ? "shadow-[0_0_45px_-24px_rgba(16,185,129,0.65)]"
      : pipelineState === "error"
        ? "shadow-[0_0_45px_-24px_rgba(244,63,94,0.55)]"
        : "shadow-xl shadow-slate-950/40";

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const templates = LOG_TEMPLATES[pipelineState];
    let tick = 0;

    const intervalId = window.setInterval(() => {
      const message = templates[tick % templates.length];
      appendLog(timestamped(message));

      const store = useWorkspaceStore.getState();
      const target = store.intermediateResults[tick % Math.max(store.intermediateResults.length, 1)];

      if (target) {
        const nextStatus = target.status === "queued" ? "processing" : "ready";
        const nextProgress = Math.min(target.progress + (target.status === "processing" ? 35 : 20), 100);
        updateIntermediateResult(target.id, { status: nextStatus, progress: nextProgress });
      }

      tick += 1;
    }, 1250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [appendLog, isRunning, pipelineState, updateIntermediateResult]);

  useEffect(() => {
    if (!logsContainerRef.current) {
      return;
    }

    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [pipelineLogs]);

  const checkpointCards = useMemo(() => intermediateResults, [intermediateResults]);

  const rankedCandidates = useMemo(
    () => [...MOCK_GENERATED_MOLECULES].sort((a, b) => b.score - a.score),
    [],
  );

  const bestCandidate = rankedCandidates[0];

  const visibleCandidates =
    pipelineState === "idle" ? rankedCandidates.slice(0, 3) : rankedCandidates;

  return (
    <div className="space-y-6">
      <Card className={`border-slate-800 bg-slate-900/80 transition-all duration-500 ${statusGlowClassName}`}>
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Status</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">Pipeline Stage</h2>
            <p className="mt-1.5 text-xs leading-6 text-slate-400">{status.detail}</p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ${status.badgeClassName} ${isRunning ? "ring-1 ring-cyan-300/25" : ""}`}
          >
            {status.label}
          </span>
        </CardHeader>
        {pipelineState === "error" && errorMessage ? (
          <CardContent className="pt-0">
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {errorMessage}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/40 transition-all duration-300">
        <CardHeader>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Logs</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">Execution Stream</h2>
        </CardHeader>
        <CardContent>
          <div
            ref={logsContainerRef}
            className="h-64 space-y-1.5 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/80 p-3.5"
          >
            {pipelineLogs.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className={`font-mono text-xs leading-5 transition-colors duration-300 ${index === pipelineLogs.length - 1 ? "text-cyan-300" : "text-slate-300"}`}
              >
                {line}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/40 transition-all duration-300">
        <CardHeader>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Intermediate Results</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">Generated Molecules</h2>
          <p className="mt-1.5 text-xs leading-6 text-slate-400">
            Mock candidate outputs with ranking scores for integration-ready UI behavior.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {bestCandidate ? (
            <article className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-4 shadow-[0_0_36px_-24px_rgba(34,211,238,0.75)] transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Best Candidate</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-100">{bestCandidate.id}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-300">{bestCandidate.smiles}</p>
                </div>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                  Top Score
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Score</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{bestCandidate.score.toFixed(3)}</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Docking</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{bestCandidate.docking.toFixed(1)} kcal/mol</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">QED</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{bestCandidate.qed.toFixed(2)}</p>
                </div>
              </div>
            </article>
          ) : null}

          {checkpointCards.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {checkpointCards.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 transition-all duration-300 hover:border-slate-600">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{item.label}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.status === "ready"
                          ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                          : item.status === "processing"
                            ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                            : "border-slate-600 bg-slate-700/30 text-slate-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">{item.value}</p>
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-cyan-400 transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{item.progress}% complete</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCandidates.map((candidate) => (
              <article
                key={candidate.id}
                className={`rounded-xl border p-3 ${
                  candidate.id === bestCandidate?.id
                    ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_32px_-24px_rgba(34,211,238,0.7)]"
                    : "border-slate-700 bg-slate-950/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">{candidate.id}</h4>
                  <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    {candidate.score.toFixed(3)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-5 text-slate-400">{candidate.smiles}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Docking</p>
                    <p className="mt-0.5 text-slate-200">{candidate.docking.toFixed(1)}</p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">QED</p>
                    <p className="mt-0.5 text-slate-200">{candidate.qed.toFixed(2)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
