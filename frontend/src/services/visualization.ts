import type { SimulationResult } from "@/types/api";

export interface VisualizationMoleculeStructure {
  molecule_id: string;
  dataset: string;
  smiles: string;
  mw: number;
  logp: number;
  qed: number;
  pdb: string;
}

export interface VisualizationEmbeddingPoint {
  molecule_id: string;
  dataset: string;
  smiles: string;
  x: number;
  y: number;
  activity: number;
  drugLikeness: number;
}

const PLACEHOLDER_MOLECULES: VisualizationMoleculeStructure[] = [
  {
    molecule_id: "MOL-001",
    dataset: "Placeholder-A",
    smiles: "CC(=O)Oc1ccccc1C(=O)O",
    mw: 180.16,
    logp: 1.19,
    qed: 0.55,
    pdb: "HEADER    PLACEHOLDER STRUCTURE\nATOM      1  C1  MOL A   1       0.000   0.000   0.000  1.00  0.00           C\nEND",
  },
  {
    molecule_id: "MOL-002",
    dataset: "Placeholder-B",
    smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    mw: 194.19,
    logp: -0.07,
    qed: 0.54,
    pdb: "HEADER    PLACEHOLDER STRUCTURE\nATOM      1  C1  MOL A   1       0.300   0.000   0.000  1.00  0.00           C\nEND",
  },
  {
    molecule_id: "MOL-003",
    dataset: "Placeholder-C",
    smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
    mw: 206.29,
    logp: 3.97,
    qed: 0.74,
    pdb: "HEADER    PLACEHOLDER STRUCTURE\nATOM      1  C1  MOL A   1      -0.250   0.300   0.000  1.00  0.00           C\nEND",
  },
  {
    molecule_id: "MOL-004",
    dataset: "Placeholder-A",
    smiles: "CC(=O)NC1=CC=C(C=C1)O",
    mw: 151.16,
    logp: 0.46,
    qed: 0.73,
    pdb: "HEADER    PLACEHOLDER STRUCTURE\nATOM      1  C1  MOL A   1       0.120  -0.220   0.000  1.00  0.00           C\nEND",
  },
  {
    molecule_id: "MOL-005",
    dataset: "Placeholder-B",
    smiles: "CC(=O)OC1=CC=CC=C1C(=O)OC",
    mw: 194.18,
    logp: 1.89,
    qed: 0.68,
    pdb: "HEADER    PLACEHOLDER STRUCTURE\nATOM      1  C1  MOL A   1       0.420   0.150   0.000  1.00  0.00           C\nEND",
  },
];

const PLACEHOLDER_EMBEDDINGS: VisualizationEmbeddingPoint[] = PLACEHOLDER_MOLECULES.map(
  (molecule, index) => {
    const angle = (index + 1) * 1.05;
    const radial = 0.85 + index * 0.24;
    return {
      molecule_id: molecule.molecule_id,
      dataset: molecule.dataset,
      smiles: molecule.smiles,
      x: Number((Math.cos(angle) * radial + molecule.logp * 0.2).toFixed(3)),
      y: Number((Math.sin(angle) * radial + (molecule.mw - 180) / 260).toFixed(3)),
      activity: Number((0.22 + molecule.qed * 0.7).toFixed(3)),
      drugLikeness: Number(molecule.qed.toFixed(3)),
    };
  },
);

const PLACEHOLDER_SIMULATION: SimulationResult[] = PLACEHOLDER_MOLECULES.flatMap(
  (molecule, moleculeIndex) => {
    const frames = 26;
    const baseline = 1.05 + (moleculeIndex % 4) * 0.2;

    return Array.from({ length: frames }, (_, frameIndex) => {
      const time = frameIndex * 2;
      const oscillation = Math.sin((frameIndex + moleculeIndex) * 0.52) * 0.12;
      const drift = frameIndex * 0.012;
      const rmsd = Number((baseline + oscillation + drift).toFixed(3));

      return {
        molecule_id: molecule.molecule_id,
        smiles: molecule.smiles,
        time,
        rmsd,
      };
    });
  },
);

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Placeholder implementation for future backend integration. */
export async function getMoleculeStructure(
  moleculeId: string,
): Promise<VisualizationMoleculeStructure | null> {
  await wait(60);
  return (
    PLACEHOLDER_MOLECULES.find((molecule) => molecule.molecule_id === moleculeId) ?? null
  );
}

/** Placeholder implementation for future backend integration. */
export async function getEmbeddings(): Promise<VisualizationEmbeddingPoint[]> {
  await wait(80);
  return PLACEHOLDER_EMBEDDINGS;
}

/** Placeholder implementation for future backend integration. */
export async function getSimulationData(): Promise<SimulationResult[]> {
  await wait(90);
  return PLACEHOLDER_SIMULATION;
}
