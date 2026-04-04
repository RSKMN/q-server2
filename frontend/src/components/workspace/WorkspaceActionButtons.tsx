"use client";

import { useRef } from "react";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import { createExperiment, generateMolecules, runDocking, runPipeline } from "@/services";
import { useWorkspaceStore } from "@/store";
import type { IntermediateResultItem } from "@/store/workspaceStore";
import type { ExperimentRecord } from "@/types";

type WorkspaceAction = "generate" | "docking" | "pipeline";

const actionConfig: Array<{
  key: WorkspaceAction;
  label: string;
  loadingText: string;
  variant: "primary" | "secondary" | "outline";
}> = [
  {
    key: "generate",
    label: "Generate Molecules",
    loadingText: "Generating...",
    variant: "secondary",
  },
  {
    key: "docking",
    label: "Run Docking",
    loadingText: "Running Docking...",
    variant: "outline",
  },
  {
    key: "pipeline",
    label: "Run Full Pipeline",
    loadingText: "Running Full Pipeline...",
    variant: "primary",
  },
];

export default function WorkspaceActionButtons() {
  const actionLockRef = useRef(false);

  const pipelineState = useWorkspaceStore((s) => s.pipelineState);
  const lastAction = useWorkspaceStore((s) => s.lastAction);
  const startAction = useWorkspaceStore((s) => s.startAction);
  const setPipelineState = useWorkspaceStore((s) => s.setPipelineState);
  const setCompleted = useWorkspaceStore((s) => s.setCompleted);
  const setError = useWorkspaceStore((s) => s.setError);
  const clearLogs = useWorkspaceStore((s) => s.clearLogs);
  const appendLog = useWorkspaceStore((s) => s.appendLog);
  const setIntermediateResults = useWorkspaceStore((s) => s.setIntermediateResults);
  const workspaceInput = useWorkspaceStore((s) => s.workspaceInput);

  const pipelineInProgress =
    lastAction === "pipeline" &&
    (pipelineState === "generating" ||
      pipelineState === "docking" ||
      pipelineState === "running_full_pipeline");

  const buildInitialResults = (action: WorkspaceAction): IntermediateResultItem[] => {
    if (action === "generate") {
      return [
        { id: "gen-sample", label: "Sample Pool", value: "0 candidates generated", status: "queued", progress: 0 },
        { id: "gen-filter", label: "Constraint Filter", value: "Awaiting LogP/QED screening", status: "queued", progress: 0 },
      ];
    }

    if (action === "docking") {
      return [
        { id: "dock-grid", label: "Docking Grid", value: "Preparing receptor site", status: "queued", progress: 0 },
        { id: "dock-score", label: "Affinity Scoring", value: "No poses scored", status: "queued", progress: 0 },
      ];
    }

    return [
      { id: "pipe-gen", label: "Generation", value: "Bootstrapping molecular generation", status: "queued", progress: 0 },
      { id: "pipe-dock", label: "Docking", value: "Docking workers are idle", status: "queued", progress: 0 },
      { id: "pipe-rank", label: "Ranking", value: "Waiting for upstream outputs", status: "queued", progress: 0 },
    ];
  };

  const actionLogLabel: Record<WorkspaceAction, string> = {
    generate: "Generate Molecules",
    docking: "Run Docking",
    pipeline: "Run Full Pipeline",
  };

  const timestamped = (message: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss} | ${message}`;
  };

  const runningAction: WorkspaceAction | null =
    pipelineInProgress
      ? "pipeline"
      : pipelineState === "generating"
      ? "generate"
      : pipelineState === "docking"
        ? "docking"
        : pipelineState === "running_full_pipeline"
          ? "pipeline"
          : null;

  const handleActionClick = async (action: WorkspaceAction) => {
    if (runningAction || actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;

    startAction(action);
    clearLogs();
    setIntermediateResults(buildInitialResults(action));
    appendLog(timestamped(`Action accepted: ${actionLogLabel[action]}`));

    try {
      if (action === "pipeline") {
        await runPipeline({}, {
          onStageChange: (stage, message) => {
            if (stage === "generating" || stage === "docking") {
              setPipelineState(stage);
            }

            if (stage === "generating") {
              const generationProgress = useWorkspaceStore
                .getState()
                .intermediateResults.map((item, index) => {
                  if (index === 0) {
                    return {
                      ...item,
                      value: "124 candidates generated",
                      status: "ready" as const,
                      progress: 100,
                    };
                  }

                  return {
                    ...item,
                    status: "processing" as const,
                    progress: Math.max(item.progress, 45),
                  };
                });
              setIntermediateResults(generationProgress);
            }

            if (stage === "docking") {
              const dockingProgress = useWorkspaceStore
                .getState()
                .intermediateResults.map((item, index) => {
                  if (index === 1) {
                    return {
                      ...item,
                      value: "Docking workers running on top 40 molecules",
                      status: "processing" as const,
                      progress: Math.max(item.progress, 70),
                    };
                  }

                  return item;
                });
              setIntermediateResults(dockingProgress);
            }

            appendLog(timestamped(message));
          },
        });

        const finalizedPipelineResults = useWorkspaceStore.getState().intermediateResults.map((item, index) => ({
          ...item,
          value:
            index === 1
              ? "Top affinity: -10.7 kcal/mol"
              : index === 2
                ? "Ranking stabilized for top 20 candidates"
                : item.value,
          status: "ready" as const,
          progress: 100,
        }));
        setIntermediateResults(finalizedPipelineResults);

        const topHit = finalizedPipelineResults[1]?.value ?? "Pending";
        const completedExperiment: ExperimentRecord = {
          id: `EXP-${Date.now()}`,
          name: "Workspace Full Pipeline Run",
          input: workspaceInput,
          status: "Completed",
          createdAt: new Date().toISOString(),
          pipelineStages: {
            generated: "completed",
            docking: "completed",
            simulation: "completed",
            quantum: "completed",
          },
          resultsSummary: {
            overview: "Pipeline completed successfully from Workspace action controls.",
            topHit,
            hitRate: 10.4,
            shortlistedCandidates: 20,
          },
        };
        await createExperiment(completedExperiment);
        setCompleted();
        return;
      }

      if (action === "generate") {
        const response = await generateMolecules({});
        appendLog(timestamped(response.message));
      }

      if (action === "docking") {
        const response = await runDocking({});
        appendLog(timestamped(response.message));
      }

      const finalized = useWorkspaceStore
        .getState()
        .intermediateResults.map((item) => ({
          ...item,
          status: "ready" as const,
          progress: 100,
        }));

      setIntermediateResults(finalized);
      appendLog(timestamped("Pipeline completed successfully"));
      setCompleted();
    } catch {
      const errorMessage = "Failed to trigger the selected pipeline action.";
      appendLog(timestamped(`Error: ${errorMessage}`));
      setError(errorMessage);
    } finally {
      actionLockRef.current = false;
    }
  };

  const isBusy = runningAction !== null;

  return (
    <Card className="border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/40 transition-all duration-300">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Actions</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">Execution Controls</h2>
        <p className="mt-1.5 text-xs leading-6 text-slate-400">
          Launch a focused step or run the complete discovery pipeline.
        </p>
      </CardHeader>

      <CardContent className="grid gap-3.5 sm:grid-cols-2">
        {actionConfig.map((action) => {
          const isCurrent = runningAction === action.key;

          return (
            <Button
              key={action.key}
              type="button"
              variant={action.variant}
              className={action.key === "pipeline" ? "sm:col-span-2 shadow-[0_0_24px_-14px_rgba(56,189,248,0.7)]" : undefined}
              onClick={() => handleActionClick(action.key)}
              isLoading={isCurrent}
              loadingText={action.loadingText}
              disabled={isBusy && !isCurrent}
            >
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
