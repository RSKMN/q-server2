/**
 * API response types — aligned with P5 ↔ P3 API Contract
 * @see API Contract.txt
 */

// ─── 1. Datasets ─────────────────────────────────────────────────────────────

/** Dataset name returned by GET /datasets (e.g. ZINC250k, ChEMBL, PDBbind, DrugBank) */
export type Dataset = string;

/** Response: GET /datasets */
export type DatasetsResponse = readonly Dataset[];

// ─── 2. Dataset Statistics ───────────────────────────────────────────────────

/** Histogram bin + counts for a distribution */
export interface Distribution {
  bins: number[];
  counts: number[];
}

/** Summary statistics from GET /stats */
export interface StatsSummary {
  molecule_count: number;
  avg_mw: number;
  avg_logp: number;
  avg_qed: number;
}

/** Distributions keyed by property (mw, logp, tpsa, qed) */
export interface StatsDistributions {
  mw?: Distribution;
  logp?: Distribution;
  tpsa?: Distribution;
  qed?: Distribution;
}

/** Response: GET /stats?dataset=... */
export interface StatsResponse {
  dataset?: string;
  summary: StatsSummary;
  distributions: StatsDistributions;
}

// ─── 3. Molecule List (Explorer Table) ───────────────────────────────────────

/** Molecule list item from GET /molecules */
export interface Molecule {
  molecule_id: string;
  smiles: string;
  mw: number;
  logp: number;
  qed: number;
  dataset: string;
}

/** Response: GET /molecules */
export interface MoleculesListResponse {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  items: Molecule[];
}

// ─── 4. Molecule Details (Viewer Panel) ──────────────────────────────────────

/** Structure representations from GET /molecule/{id} */
export interface MoleculeStructures {
  smiles: string;
  inchi: string;
  sdf: string;
  pdb: string;
}

/** Computed molecular properties */
export interface MoleculeProperties {
  mw: number;
  logp: number;
  tpsa: number;
  qed: number;
  hba: number;
  hbd: number;
  rotatable_bonds: number;
}

/** Response: GET /molecule/{id} */
export interface MoleculeDetails {
  molecule_id: string;
  dataset: string;
  structures: MoleculeStructures;
  properties: MoleculeProperties;
}

// ─── 5. Similarity Search ────────────────────────────────────────────────────

/** Single neighbor from similarity search */
export interface SimilarityResult {
  molecule_id: string;
  similarity: number;
  smiles: string;
  mw?: number;
  qed?: number;
}

/** Response: POST /embedding/search, GET /molecule/{id}/similar */
export interface SimilaritySearchResponse {
  neighbors: SimilarityResult[];
}

// ─── 6. Chemical Space (UMAP) ────────────────────────────────────────────────

/** Source of the molecule in chemical space */
export type EmbeddingSource = "dataset" | "generated" | "fda";

/** UMAP point for chemical space visualization */
export interface EmbeddingPoint {
  x: number;
  y: number;
  molecule_id: string;
  dataset: string;
  qed: number;
  mw: number;
  source: EmbeddingSource;
}

/** Response: GET /embedding/umap */
export type EmbeddingMapResponse = EmbeddingPoint[];

// ─── Error Format ────────────────────────────────────────────────────────────

/** Standardized error response from all endpoints */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
