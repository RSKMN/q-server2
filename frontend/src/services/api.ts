/**
 * API service layer for the scientific dashboard.
 * Uses fetch with typed responses and centralized error handling.
 * Aligned with P5 ↔ P3 API Contract.
 */

import type {
  CandidateProfilesResponse,
  DockingResult,
  ExperimentSummaryResponse,
  Dataset,
  DatasetDetailsResponse,
  DatasetsResponse,
  Distribution,
  EmbeddingMapResponse,
  GeneratedMoleculeResult,
  MoleculeDetails,
  MoleculesListResponse,
  QuantumResult,
  RankedCandidatesResponse,
  RecentRunsResponse,
  ResultArtifactsResponse,
  ResultsOverview,
  SimilarityResult,
  SimilaritySearchResponse,
  SimulationResult,
  StatsResponse,
} from "@/types/api";
import * as mockApi from "./mockApi";


/** Normalize base URL by trimming whitespace and trailing slashes. */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/** Resolve API base URL for both browser and server runtime contexts. */
function resolveApiBaseUrl(): string {
  const configured =
    typeof process !== "undefined"
      ? process.env?.NEXT_PUBLIC_API_URL
      : undefined;

  if (configured && configured.trim()) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  const hostFromEnv =
    (typeof process !== "undefined" &&
      (process.env?.NEXT_PUBLIC_SITE_URL || process.env?.VERCEL_URL)) ||
    "";
  if (hostFromEnv) {
    const withProtocol = hostFromEnv.startsWith("http")
      ? hostFromEnv
      : `https://${hostFromEnv}`;
    return normalizeBaseUrl(withProtocol);
  }

  return "";
}

/** Base URL for API requests; configurable via NEXT_PUBLIC_API_URL. */
const API_BASE_URL = resolveApiBaseUrl();

/** Check if the application is running in 'Demo Mode' for presentations. */
export function isDemoMode(): boolean {
  // 1. Check LocalStorage (highest priority for client-side overrides)
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem("demo_mode") === "true") return true;
    } catch (e) {}
  }

  // 2. Check Environment Variable (standard way)
  // We use a safe check that works in both server and browser bundles
  const envValue = 
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEMO_MODE) || 
    (typeof window !== "undefined" && (window as any)._NEXT_DATA_?.runtimeConfig?.NEXT_PUBLIC_DEMO_MODE);

  if (envValue === "true" || envValue === true || envValue === "1") {
    return true;
  }

  return false;
}

const API_TIMEOUT_MS =
  (typeof process !== "undefined" &&
    Number(process.env?.NEXT_PUBLIC_API_TIMEOUT_MS || process.env?.NEXT_PUBLIC_API_TIMEOUT)) ||
  10000;

const EMPTY_DISTRIBUTION: Distribution = {
  bins: [],
  counts: [],
};

/** Custom error for API failures */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
    public url?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Convert technical API errors into concise user-friendly messages. */
export function toFriendlyErrorMessage(
  error: unknown,
  fallback = "We could not load this data right now. Please try again."
): string {
  if (error instanceof ApiError) {
    if (error.status === 408) {
      return "The request took too long. Please try again.";
    }
    if (error.status === 401 || error.status === 403) {
      return "Your session needs attention. Please sign in again and retry.";
    }
    if (error.status === 404) {
      return "We could not find the requested data.";
    }
    if (error.status && error.status >= 500) {
      return "The server is busy right now. Please try again shortly.";
    }
    if (error.status && error.status >= 400) {
      return "Some data could not be loaded. Please retry.";
    }
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("network")) {
      return "Connection issue detected. Please check your network and retry.";
    }
    return fallback;
  }

  return fallback;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  params?: QueryParams;
  body?: unknown;
  timeoutMs?: number;
}

export type WorkspaceToxicityLevel = "Low" | "Medium" | "High";

export interface WorkspacePipelineRequest {
  protein: string;
  constraints?: {
    logp?: number;
    qed?: number;
    toxicity?: WorkspaceToxicityLevel;
    callback_url?: string;
  };
}

export interface WorkspacePipelineResponse {
  experimentId?: string;
  runId?: string;
  stage?: string;
  message?: string;
}

export interface WorkspacePipelineStatusResponse {
  status: string;
  stage: string;
  progress: number;
  logs: string[];
}

export interface PipelineExperimentItem {
  experiment_id: string;
  protein: string;
  status: string;
  created_at: string;
}

export interface CreatePipelineExperimentRequest {
  experiment_id: string;
  protein: string;
}

interface PipelineExperimentsResponse {
  experiments: PipelineExperimentItem[];
}

/** Build full URL with optional path and query params */
function buildUrl(
  path: string,
  params?: QueryParams
): string {
  const endpointPath = `/${path.replace(/^\/+/, "")}`;

  if (!API_BASE_URL) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return query ? `${endpointPath}?${query}` : endpointPath;
  }

  const base = new URL(`${API_BASE_URL}/`);
  const normalizedEndpoint = path.replace(/^\/+/, "");
  const basePath = base.pathname.replace(/\/+$/, "");
  base.pathname = `${basePath}/${normalizedEndpoint}`.replace(/\/+/g, "/");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        base.searchParams.set(key, String(value));
      }
    });
  }
  return base.toString();
}

/** Core request helper with timeout, JSON parsing, and normalized API errors */
async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, body, timeoutMs = API_TIMEOUT_MS, ...fetchOptions } = options;
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders = new Headers(fetchOptions.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      method,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as BodyInit)
            : JSON.stringify(body),
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408, undefined, url);
    }
    throw new ApiError("Network request failed", undefined, error, url);
  } finally {
    clearTimeout(timeout);
  }

  const rawText = await response.text();
  let parsedBody: unknown;
  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status,
      parsedBody,
      url
    );
  }

  if (!rawText) {
    return undefined as T;
  }

  if (parsedBody === rawText) {
    throw new ApiError("Invalid JSON response", response.status, rawText, url);
  }

  return parsedBody as T;
}

export async function get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("GET", path, options);
}

export async function post<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("POST", path, options);
}

export async function put<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("PUT", path, options);
}

export async function del<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("DELETE", path, options);
}

export const apiDelete = del;

export const apiClient = {
  get,
  post,
  put,
  delete: del,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPlaceholderRunId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/** Backward-compatible internal fetch wrapper for existing endpoint helpers */
async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const method = (options.method?.toUpperCase() as "GET" | "POST" | "PUT" | "DELETE" | undefined) ?? "GET";
  if (method === "GET") {
    return get<T>(path, options);
  }
  if (method === "POST") {
    return post<T>(path, options);
  }
  if (method === "PUT") {
    return put<T>(path, options);
  }
  if (method === "DELETE") {
    return del<T>(path, options);
  }
  throw new ApiError(`Unsupported HTTP method: ${method}`);
}

// ─── API functions ───────────────────────────────────────────────────────────

/** Fetch available datasets and their total count. */
export async function getDatasets(): Promise<DatasetsResponse> {
  if (isDemoMode()) {
    return { count: 3, datasets: ["ZINC250k", "ChEMBL", "DrugBank"] };
  }
  try {
    const data = await apiFetch<DatasetsResponse>("/datasets");
    return {
      count: Number(data?.count ?? 0),
      datasets: Array.isArray(data?.datasets) ? [...data.datasets] : [],
    };
  } catch {
    return {
      count: 0,
      datasets: [],
    };
  }
}

/** Fetch available dashboard metrics and recent runs with fallback */
export async function getDashboardData() {
  if (isDemoMode()) {
    return mockApi.getDashboardData();
  }
  try {
    const [summary, recent] = await Promise.all([
      getExperimentSummary(),
      getRecentRuns()
    ]);
    return { summary, recent };
  } catch {
    return mockApi.getDashboardData();
  }
}


/** Fetch a single dataset and a preview of the first 10 rows. */
export async function getDataset(name: string): Promise<DatasetDetailsResponse> {
  if (isDemoMode()) {
    return { name, file: `${name}.csv`, count: 1240, preview: [] };
  }
  return apiFetch<DatasetDetailsResponse>(`/datasets/${encodeURIComponent(name)}`);
}

/** Fetch dataset statistics, optionally filtered by dataset */
export async function getStats(dataset?: string): Promise<StatsResponse> {
  if (isDemoMode()) {
     return {
       dataset,
       summary: { molecule_count: 1240, avg_mw: 450, avg_logp: 2.8, avg_qed: 0.72 },
       distributions: { mw: EMPTY_DISTRIBUTION, logp: EMPTY_DISTRIBUTION, tpsa: EMPTY_DISTRIBUTION, qed: EMPTY_DISTRIBUTION }
     };
  }
  try {
    return await apiFetch<StatsResponse>("/stats", {
      params: dataset ? { dataset } : undefined,
    });
  } catch {
    return {
      dataset,
      summary: {
        molecule_count: 0,
        avg_mw: 0,
        avg_logp: 0,
        avg_qed: 0,
      },
      distributions: {
        mw: EMPTY_DISTRIBUTION,
        logp: EMPTY_DISTRIBUTION,
        tpsa: EMPTY_DISTRIBUTION,
        qed: EMPTY_DISTRIBUTION,
      },
    };
  }
}

/** Fetch molecules with optional filters and pagination */
export async function getMolecules(params: {
  page?: number;
  limit?: number;
  dataset?: string;
  min_qed?: number;
  max_logp?: number;
  sort_by?: "mw" | "logp" | "qed";
  order?: "asc" | "desc";
  search?: string;
} = {}): Promise<MoleculesListResponse> {
  const {
    page = 1,
    limit = 50,
  } = params;
  if (isDemoMode()) {
    return mockApi.getMolecules(page, limit);
  }
  try {
    return await apiFetch<MoleculesListResponse>("/molecules", {
      params,
    });
  } catch {
    return mockApi.getMolecules(page, limit);
  }
}

/** Fetch a single molecule by ID */
export async function getMoleculeById(
  id: string
): Promise<MoleculeDetails | null> {
  if (isDemoMode()) {
     return {
       molecule_id: id,
       dataset: "ZINC250k",
       structures: { smiles: "C", inchi: "", sdf: "", pdb: "" },
       properties: { mw: 400, logp: 2.5, tpsa: 80, qed: 0.8, hba: 5, hbd: 2, rotatable_bonds: 6 }
     };
  }
  try {
    return await apiFetch<MoleculeDetails>(
      `/molecule/${encodeURIComponent(id)}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Search for molecules similar to the given SMILES string */
export async function searchSimilar(
  smiles: string,
  topK: number = 10
): Promise<SimilaritySearchResponse> {
  try {
    const data = await apiFetch<
      SimilaritySearchResponse | { neighbors: SimilaritySearchResponse["neighbors"] }
    >("/embedding/search", {
      method: "POST",
      body: { smiles, top_k: topK },
    });

    if ("neighbors" in data) {
      return { neighbors: data.neighbors };
    }

    return data as SimilaritySearchResponse;
  } catch {
    return mockApi.getMolecularSimilarity(smiles, topK);
  }
}


/** Fetch UMAP embedding points for chemical space visualization */
export async function getEmbeddingMap(
  dataset?: string,
  limit: number = 5000
): Promise<EmbeddingMapResponse> {
  if (isDemoMode()) {
    // Return some basic random points for demo
    return Array.from({ length: 1000 }).map((_, i) => ({
      molecule_id: `MOL-${i}`,
      dataset: i % 3 === 0 ? "ZINC250k" : i % 3 === 1 ? "ChEMBL" : "DrugBank",
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      qed: 0.5 + Math.random() * 0.4,
      mw: 300 + Math.random() * 200,
      logp: 1 + Math.random() * 4,
      source: i % 3 === 0 ? "dataset" : i % 3 === 1 ? "generated" : "fda"
    }));
  }
  try {
    const data = await apiFetch<EmbeddingMapResponse>("/embedding/umap", {
      params: { dataset, limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch aggregate research summary with fallback */
export async function getResearchSummary(): Promise<ResultsOverview> {
  if (isDemoMode()) {
    return mockApi.getResearchSummary();
  }
  try {
    return await getResultsOverview();
  } catch {
    return mockApi.getResearchSummary();
  }
}


export async function getResultsOverview(): Promise<ResultsOverview> {
  try {
    return await apiFetch<ResultsOverview>("/results/overview");
  } catch {
    return mockApi.getResearchSummary();
  }
}




/** Fetch generated molecule rows for the Results page */
export async function getGeneratedMolecules(limit: number = 25): Promise<GeneratedMoleculeResult[]> {
  if (isDemoMode()) {
    return Array.from({ length: limit }).map((_, i) => ({
      molecule_id: `GEN-${i}`,
      smiles: "C",
      molecular_weight: 350 + i,
      logp: 2.1,
      qed: 0.75
    }));
  }
  try {
    const data = await apiFetch<GeneratedMoleculeResult[]>("/results/generated", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch docking result rows for the Results page */
export async function getDockingResults(limit: number = 25): Promise<DockingResult[]> {
  if (isDemoMode()) {
    return mockApi.getDockingResults(limit);
  }
  try {
    const data = await apiFetch<DockingResult[]>("/results/docking", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return mockApi.getDockingResults(limit);
  }
}

/** Fetch simulation trajectory rows for the Results page */
export async function getSimulationResults(limit: number = 60): Promise<SimulationResult[]> {
  if (isDemoMode()) {
    return Array.from({ length: limit }).map((_, i) => ({
      molecule_id: `SIM-${i}`,
      smiles: "C",
      time: i * 10,
      rmsd: 1.0 + Math.random() * 0.5
    }));
  }
  try {
    const data = await apiFetch<SimulationResult[]>("/results/simulation", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return []; // Optional: could add mock simulation data if needed
  }
}


/** Fetch quantum screening rows for the Results page */
export async function getQuantumResults(limit: number = 25): Promise<QuantumResult[]> {
  if (isDemoMode()) {
    return mockApi.getQuantumMetrics(limit);
  }
  try {
    const data = await apiFetch<QuantumResult[]>("/results/quantum", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return mockApi.getQuantumMetrics(limit);
  }
}


/** Fetch ranked candidate rows from existing or generated candidate file */
export async function getRankedCandidates(
  source: "existing" | "generated" = "existing",
  limit: number = 25
): Promise<RankedCandidatesResponse> {
  try {
    const data = await apiFetch<RankedCandidatesResponse>("/results/candidates", {
      params: { source, limit },
    });
    return data;
  } catch {
    return {
      source,
      file: "",
      count: 0,
      items: [],
    };
  }
}

/** Get ranked candidates with fallback */
export async function getCandidates(limit = 10): Promise<RankedCandidatesResponse> {
  if (isDemoMode()) {
    return mockApi.getCandidates(limit);
  }
  try {
    return await getRankedCandidates("existing", limit);
  } catch {
    return mockApi.getCandidates(limit);
  }
}


/** Fetch candidate-level profiles merged across QM + MD output tables */
export async function getCandidateProfiles(
  limit: number = 100
): Promise<CandidateProfilesResponse> {
  try {
    return await apiFetch<CandidateProfilesResponse>("/results/profiles", {
      params: { limit },
    });
  } catch {
    return {
      count: 0,
      items: [],
    };
  }
}

/** Fetch available summary and docking artifacts for browsing */
export async function getResultArtifacts(
  limit: number = 200
): Promise<ResultArtifactsResponse> {
  try {
    return await apiFetch<ResultArtifactsResponse>("/results/artifacts", {
      params: { limit },
    });
  } catch {
    return {
      count: 0,
      items: [],
    };
  }
}

/** Fetch total experiment count for dashboard summary cards */
export async function getExperimentSummary(): Promise<ExperimentSummaryResponse> {
  if (isDemoMode()) {
    return { experiment_count: 142 };
  }
  return apiFetch<ExperimentSummaryResponse>("/experiments/summary");
}

/** Fetch recent experiment runs for dashboard activity panel */
export async function getRecentRuns(limit: number = 8): Promise<RecentRunsResponse> {
  if (isDemoMode()) {
    const data = await mockApi.getDashboardData();
    return data.recent;
  }
  return apiFetch<RecentRunsResponse>("/runs/recent", {
    params: { limit },
  });
}

/** Trigger molecule generation stage (placeholder-ready API contract). */
export async function generateMolecules(
  payload: Partial<WorkspacePipelineRequest> = {}
): Promise<WorkspacePipelineResponse> {
  try {
    return await apiFetch<WorkspacePipelineResponse>("/workspace/generate", {
      method: "POST",
      body: payload,
    });
  } catch {
    await sleep(400);
    return {
      runId: createPlaceholderRunId("gen"),
      stage: "generating",
      message: "Generating molecules...",
    };
  }
}

/** Trigger docking stage (placeholder-ready API contract). */
export async function runDocking(
  payload: Partial<WorkspacePipelineRequest> = {}
): Promise<WorkspacePipelineResponse> {
  try {
    return await apiFetch<WorkspacePipelineResponse>("/workspace/docking", {
      method: "POST",
      body: payload,
    });
  } catch {
    await sleep(400);
    return {
      runId: createPlaceholderRunId("dock"),
      stage: "docking",
      message: "Docking started...",
    };
  }
}

/** Trigger full pipeline against the backend pipeline endpoint. */
export async function runPipeline(
  payload: WorkspacePipelineRequest
): Promise<{ experimentId: string }> {
  if (isDemoMode()) {
    return { experimentId: `EXP-DEMO-${Date.now()}` };
  }
  const configuredCallback =
    typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_PIPELINE_CALLBACK_URL : undefined;
  const callbackUrl =
    payload.constraints?.callback_url ||
    (typeof configuredCallback === "string" && configuredCallback.trim()
      ? configuredCallback.trim()
      : undefined);

  const requestPayload: WorkspacePipelineRequest = {
    ...payload,
    constraints: {
      ...(payload.constraints ?? {}),
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    },
  };

  const data = await apiFetch<{ experiment_id: string }>("/pipeline/run", {
    method: "POST",
    body: requestPayload,
  });

  if (!data.experiment_id) {
    throw new ApiError("Invalid pipeline response", undefined, data);
  }

  return {
    experimentId: data.experiment_id,
  };
}

/** Persist a pipeline experiment record in the backend experiments store. */
export async function createPipelineExperiment(
  payload: CreatePipelineExperimentRequest
): Promise<PipelineExperimentItem> {
  return apiFetch<PipelineExperimentItem>("/pipeline/experiments", {
    method: "POST",
    body: payload,
  });
}

/** Fetch a pipeline result for a given experiment id. */
export async function getPipelineResult(experimentId: string): Promise<unknown> {
  return apiFetch<unknown>(`/pipeline/results/${encodeURIComponent(experimentId)}`);
}

/** Fetch current status for a given pipeline experiment id. */
export async function getPipelineStatus(
  experimentId: string
): Promise<WorkspacePipelineStatusResponse> {
  return apiFetch<WorkspacePipelineStatusResponse>(
    `/pipeline/status/${encodeURIComponent(experimentId)}`
  );
}

/** Fetch validation status with fallback */
export async function getValidationStatus(experimentId: string): Promise<WorkspacePipelineStatusResponse> {
  try {
    return await getPipelineStatus(experimentId);
  } catch {
    return mockApi.getValidationStatus(experimentId);
  }
}


/** Fetch experiment history from the backend pipeline router. */
export async function getPipelineExperiments(): Promise<PipelineExperimentItem[]> {
  if (isDemoMode()) {
    return mockApi.getExperiments();
  }
  try {
    const data = await apiFetch<PipelineExperimentsResponse>("/pipeline/experiments");
    return Array.isArray(data.experiments) ? data.experiments : [];
  } catch {
    return mockApi.getExperiments();
  }
}

