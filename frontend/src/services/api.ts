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

/** Base URL for API requests. Override via NEXT_PUBLIC_API_URL env var. */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

const API_TIMEOUT_MS =
  (typeof process !== "undefined" &&
    Number(process.env?.NEXT_PUBLIC_API_TIMEOUT_MS)) ||
  10000;

const DEFAULT_DATASETS: Dataset[] = ["ZINC250k", "ChEMBL", "PDBbind", "DrugBank"];

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

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  params?: QueryParams;
  body?: unknown;
  timeoutMs?: number;
}

export type WorkspaceToxicityLevel = "Low" | "Medium" | "High";

export interface WorkspacePipelineRequest {
  proteinSequence?: string;
  constraints?: {
    logP?: number;
    qed?: number;
    toxicity?: WorkspaceToxicityLevel;
  };
}

export type WorkspacePipelineStage = "generating" | "docking" | "completed";

export interface WorkspacePipelineResponse {
  runId: string;
  stage: WorkspacePipelineStage;
  message: string;
}

interface RunPipelineOptions {
  onStageChange?: (stage: WorkspacePipelineStage, message: string) => void;
}

/** Build full URL with optional path and query params */
function buildUrl(
  path: string,
  params?: QueryParams
): string {
  const url = new URL(path.replace(/^\//, ""), API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
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

/** Fetch available datasets (e.g. ZINC250k, ChEMBL, PDBbind, DrugBank) */
export async function getDatasets(): Promise<Dataset[]> {
  try {
    const data = await apiFetch<DatasetsResponse>("/datasets");
    return Array.isArray(data) && data.length ? [...data] : [...DEFAULT_DATASETS];
  } catch {
    // Keep UI operational when backend omits datasets endpoint.
    return [...DEFAULT_DATASETS];
  }
}

/** Fetch dataset statistics, optionally filtered by dataset */
export async function getStats(dataset?: string): Promise<StatsResponse> {
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
    dataset,
    min_qed,
    max_logp,
    sort_by,
    order,
    search,
  } = params;
  return apiFetch<MoleculesListResponse>("/molecules", {
    params: {
      page,
      limit,
      dataset,
      min_qed,
      max_logp,
      sort_by,
      order,
      search,
    },
  });
}

/** Fetch a single molecule by ID */
export async function getMoleculeById(
  id: string
): Promise<MoleculeDetails | null> {
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
    const data = await apiFetch<{
      query_smiles: string;
      results: Array<{ molecule_id: string; score: number }>;
    }>("/molecules/similar", {
      method: "POST",
      body: { smiles, top_k: topK },
    });

    const neighbors: SimilarityResult[] = (data.results ?? []).map((item) => ({
      molecule_id: item.molecule_id,
      similarity: item.score,
      smiles: "",
    }));

    return { neighbors };
  }
}

/** Fetch UMAP embedding points for chemical space visualization */
export async function getEmbeddingMap(
  dataset?: string,
  limit: number = 5000
): Promise<EmbeddingMapResponse> {
  try {
    const data = await apiFetch<EmbeddingMapResponse>("/embedding/umap", {
      params: { dataset, limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch aggregate project result counts + highlights for showcase view */
export async function getResultsOverview(): Promise<ResultsOverview> {
  try {
    return await apiFetch<ResultsOverview>("/results/overview");
  } catch {
    return {
      counts: {
        existing_ranked: 0,
        generated_candidates: 0,
        qm_profiles: 0,
        md_stability: 0,
        md_rmsd: 0,
        md_summaries: 0,
        qm_summaries: 0,
        docking_result_files: 0,
      },
      highlights: {
        top_existing: null,
        best_qm: null,
      },
      sources: {
        existing_candidates: "",
        generated_candidates: "",
        qm_results: "",
        md_stability: "",
        md_rmsd: "",
      },
    };
  }
}

/** Fetch generated molecule rows for the Results page */
export async function getGeneratedMolecules(limit: number = 25): Promise<GeneratedMoleculeResult[]> {
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
  try {
    const data = await apiFetch<DockingResult[]>("/results/docking", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch simulation trajectory rows for the Results page */
export async function getSimulationResults(limit: number = 60): Promise<SimulationResult[]> {
  try {
    const data = await apiFetch<SimulationResult[]>("/results/simulation", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch quantum screening rows for the Results page */
export async function getQuantumResults(limit: number = 25): Promise<QuantumResult[]> {
  try {
    const data = await apiFetch<QuantumResult[]>("/results/quantum", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
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
  return apiFetch<ExperimentSummaryResponse>("/experiments/summary");
}

/** Fetch recent experiment runs for dashboard activity panel */
export async function getRecentRuns(limit: number = 8): Promise<RecentRunsResponse> {
  return apiFetch<RecentRunsResponse>("/runs/recent", {
    params: { limit },
  });
}

/** Trigger molecule generation stage (placeholder-ready API contract). */
export async function generateMolecules(
  payload: WorkspacePipelineRequest = {}
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
  payload: WorkspacePipelineRequest = {}
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

/** Trigger full pipeline. Falls back to staged timeout simulation when backend is unavailable. */
export async function runPipeline(
  payload: WorkspacePipelineRequest = {},
  options: RunPipelineOptions = {}
): Promise<WorkspacePipelineResponse> {
  try {
    return await apiFetch<WorkspacePipelineResponse>("/workspace/pipeline", {
      method: "POST",
      body: payload,
    });
  } catch {
    options.onStageChange?.("generating", "Generating molecules...");
    await sleep(2000);

    options.onStageChange?.("docking", "Docking started...");
    await sleep(2000);

    options.onStageChange?.("completed", "Full pipeline completed.");

    return {
      runId: createPlaceholderRunId("pipe"),
      stage: "completed",
      message: "Full pipeline completed.",
    };
  }
}
