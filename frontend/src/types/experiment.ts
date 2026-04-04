export type ExperimentStatus = "Completed" | "Running" | "Failed";

export type PipelineStageState = "pending" | "running" | "completed" | "failed";

export interface ExperimentInput {
  protein: string;
  constraints: Record<string, string | number | boolean>;
}

export interface ExperimentResultsSummary {
  overview: string;
  topHit: string;
  hitRate: number;
  shortlistedCandidates: number;
}

export interface Experiment {
  id: string;
  name: string;
  input: ExperimentInput;
  status: ExperimentStatus;
  resultsSummary: ExperimentResultsSummary;
  createdAt: string;
}

export interface ExperimentPipelineStages {
  generated: PipelineStageState;
  docking: PipelineStageState;
  simulation: PipelineStageState;
  quantum: PipelineStageState;
}

export interface ExperimentRecord extends Experiment {
  pipelineStages: ExperimentPipelineStages;
}