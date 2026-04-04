import { create } from "zustand";

export type PipelineState =
  | "idle"
  | "generating"
  | "docking"
  | "running_full_pipeline"
  | "completed"
  | "error";

export type PipelineAction = "generate" | "docking" | "pipeline";

export interface IntermediateResultItem {
  id: string;
  label: string;
  value: string;
  status: "queued" | "processing" | "ready";
  progress: number;
}

interface WorkspaceStoreState {
  pipelineState: PipelineState;
  lastAction: PipelineAction | null;
  errorMessage: string | null;
  pipelineLogs: string[];
  intermediateResults: IntermediateResultItem[];
  setPipelineState: (state: PipelineState) => void;
  startAction: (action: PipelineAction) => void;
  setCompleted: () => void;
  setError: (message: string) => void;
  resetPipeline: () => void;
  appendLog: (entry: string) => void;
  clearLogs: () => void;
  setIntermediateResults: (items: IntermediateResultItem[]) => void;
  updateIntermediateResult: (
    id: string,
    updates: Partial<Pick<IntermediateResultItem, "value" | "status" | "progress">>,
  ) => void;
}

const ACTION_TO_STATE: Record<PipelineAction, PipelineState> = {
  generate: "generating",
  docking: "docking",
  pipeline: "running_full_pipeline",
};

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  pipelineState: "idle",
  lastAction: null,
  errorMessage: null,
  pipelineLogs: ["System ready. Select a pipeline action to begin."],
  intermediateResults: [],

  setPipelineState: (pipelineState) => set({ pipelineState }),

  startAction: (action) =>
    set({
      pipelineState: ACTION_TO_STATE[action],
      lastAction: action,
      errorMessage: null,
    }),

  setCompleted: () => set({ pipelineState: "completed", errorMessage: null }),

  setError: (message) =>
    set({
      pipelineState: "error",
      errorMessage: message,
    }),

  resetPipeline: () =>
    set({
      pipelineState: "idle",
      lastAction: null,
      errorMessage: null,
      pipelineLogs: ["System reset. Waiting for next action."],
      intermediateResults: [],
    }),

  appendLog: (entry) =>
    set((state) => ({
      pipelineLogs: [...state.pipelineLogs, entry],
    })),

  clearLogs: () => set({ pipelineLogs: [] }),

  setIntermediateResults: (items) => set({ intermediateResults: items }),

  updateIntermediateResult: (id, updates) =>
    set((state) => ({
      intermediateResults: state.intermediateResults.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    })),
}));
