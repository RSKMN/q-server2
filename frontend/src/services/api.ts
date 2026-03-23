/**
 * API service layer for the scientific dashboard.
 * Uses fetch with typed responses and centralized error handling.
 * Aligned with P5 ↔ P3 API Contract.
 */

import type {
  Dataset,
  DatasetsResponse,
  EmbeddingMapResponse,
  MoleculeDetails,
  MoleculesListResponse,
  SimilaritySearchResponse,
  StatsResponse,
} from "@/types/api";

/** Base URL for API requests. Override via NEXT_PUBLIC_API_URL env var. */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

/** Custom error for API failures */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Build full URL with optional path and query params */
function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>
): string {
  const url = new URL(path.replace(/^\//, ""), API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/** Generic fetch wrapper with error handling */
async function apiFetch<T>(
  path: string,
  options?: RequestInit & {
    params?: Record<string, string | number | undefined>;
  }
): Promise<T> {
  const { params, ...fetchOptions } = options ?? {};
  const url = params ? buildUrl(path, params) : buildUrl(path);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status,
      body
    );
  }

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid JSON response", response.status, text);
  }
}

// ─── API functions ───────────────────────────────────────────────────────────

/** Fetch available datasets (e.g. ZINC250k, ChEMBL, PDBbind, DrugBank) */
export async function getDatasets(): Promise<Dataset[]> {
  const data = await apiFetch<DatasetsResponse>("/datasets");
  return Array.isArray(data) ? [...data] : [];
}

/** Fetch dataset statistics, optionally filtered by dataset */
export async function getStats(dataset?: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/stats", {
    params: dataset ? { dataset } : undefined,
  });
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
  const data = await apiFetch<
    SimilaritySearchResponse | { neighbors: SimilaritySearchResponse["neighbors"] }
  >("/embedding/search", {
    method: "POST",
    body: JSON.stringify({ smiles, top_k: topK }),
  });
  if ("neighbors" in data) {
    return { neighbors: data.neighbors };
  }
  return data as SimilaritySearchResponse;
}

/** Fetch UMAP embedding points for chemical space visualization */
export async function getEmbeddingMap(
  dataset?: string,
  limit: number = 5000
): Promise<EmbeddingMapResponse> {
  const data = await apiFetch<EmbeddingMapResponse>("/embedding/umap", {
    params: { dataset, limit },
  });
  return Array.isArray(data) ? data : [];
}
