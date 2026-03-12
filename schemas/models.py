"""
Pydantic models for data validation in the P3 research infrastructure.

These models correspond to the JSON schemas in the schemas/ directory and provide
type-safe validation for molecular, protein, and embedding data.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, field_validator
import re


# ============================================
# MOLECULE MODELS
# ============================================

class Hybridization(str, Enum):
    """Atom hybridization states"""
    SP = "SP"
    SP2 = "SP2"
    SP3 = "SP3"
    SP3D = "SP3D"
    SP3D2 = "SP3D2"


class Chirality(str, Enum):
    """Atom chirality"""
    R = "R"
    S = "S"
    NONE = "NONE"


class BondType(str, Enum):
    """Chemical bond types"""
    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    AROMATIC = "AROMATIC"


class Stereochemistry(str, Enum):
    """Bond stereochemistry"""
    E = "E"
    Z = "Z"
    CIS = "CIS"
    TRANS = "TRANS"
    NONE = "NONE"


class SourceDataset(str, Enum):
    """Source datasets for molecules"""
    ZINC = "zinc"
    CHEMBL = "chembl"
    PDBBIND = "pdbbind"
    DRUGBANK = "drugbank"
    GENERATED = "generated"
    OTHER = "other"


class AtomFeatures(BaseModel):
    """Atom-level features for molecular structures"""
    atom_index: int = Field(..., ge=0, description="Zero-based index of the atom")
    element: str = Field(..., pattern=r"^[A-Z][a-z]?$", description="Chemical element symbol")
    formal_charge: int = Field(..., ge=-4, le=4, description="Formal charge of the atom")
    hybridization: Optional[Hybridization] = None
    is_aromatic: Optional[bool] = None
    num_hydrogen: Optional[int] = Field(None, ge=0)
    chirality: Optional[Chirality] = Chirality.NONE

    class Config:
        use_enum_values = True


class BondFeatures(BaseModel):
    """Bond-level features for molecular structures"""
    bond_index: int = Field(..., ge=0, description="Zero-based index of the bond")
    atom_i: int = Field(..., ge=0, description="Index of the first atom")
    atom_j: int = Field(..., ge=0, description="Index of the second atom")
    bond_type: BondType = Field(..., description="Type of chemical bond")
    is_conjugated: Optional[bool] = None
    is_in_ring: Optional[bool] = None
    stereochemistry: Optional[Stereochemistry] = Stereochemistry.NONE

    class Config:
        use_enum_values = True


class MoleculeMetadata(BaseModel):
    """Additional metadata for molecules"""
    molecular_weight: Optional[float] = Field(None, ge=0, description="Molecular weight in g/mol")
    logp: Optional[float] = Field(None, description="Partition coefficient")
    hbd: Optional[int] = Field(None, ge=0, description="Hydrogen bond donors")
    hba: Optional[int] = Field(None, ge=0, description="Hydrogen bond acceptors")
    tpsa: Optional[float] = Field(None, ge=0, description="Topological polar surface area")
    num_rotatable_bonds: Optional[int] = Field(None, ge=0)
    num_aromatic_rings: Optional[int] = Field(None, ge=0)
    drug_like: Optional[bool] = Field(None, description="Passes Lipinski's rule of five")
    inchi: Optional[str] = None
    inchi_key: Optional[str] = None
    external_id: Optional[str] = None
    references: Optional[List[str]] = []
    tags: Optional[List[str]] = []

    class Config:
        extra = "allow"  # Allow additional fields


class Molecule(BaseModel):
    """Standard molecule data model"""
    molecule_id: str = Field(..., pattern=r"^MOL-[A-Z0-9]{8,16}$", description="Unique molecule identifier")
    smiles: str = Field(..., min_length=1, max_length=2000, description="SMILES representation")
    atom_features: Optional[List[AtomFeatures]] = []
    bond_features: Optional[List[BondFeatures]] = []
    source_dataset: SourceDataset
    created_at: datetime = Field(..., description="Creation timestamp")
    metadata: Optional[MoleculeMetadata] = Field(default_factory=MoleculeMetadata)

    @field_validator('created_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Parse datetime from string if needed"""
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "molecule_id": "MOL-ABC12345",
                "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
                "source_dataset": "chembl",
                "created_at": "2026-03-02T10:30:00Z",
                "metadata": {
                    "molecular_weight": 180.16,
                    "drug_like": True
                }
            }
        }


# ============================================
# PROTEIN MODELS
# ============================================

class StructureSource(str, Enum):
    """Source of protein structure"""
    EXPERIMENTAL = "experimental"
    PREDICTED = "predicted"
    HOMOLOGY_MODEL = "homology_model"
    AB_INITIO = "ab_initio"
    UNKNOWN = "unknown"


class StructureMethod(str, Enum):
    """Methods for structure determination"""
    XRAY = "X-RAY DIFFRACTION"
    NMR = "NMR"
    CRYO_EM = "CRYO-EM"
    EM = "ELECTRON MICROSCOPY"
    PREDICTED = "PREDICTED"
    OTHER = "OTHER"


class ProteinDomain(BaseModel):
    """Protein domain annotation"""
    name: str
    start: int = Field(..., ge=1, description="Start position (1-based)")
    end: int = Field(..., ge=1, description="End position (1-based)")
    database: Optional[str] = None
    accession: Optional[str] = None


class SecondaryStructure(BaseModel):
    """Secondary structure content"""
    helix_percent: Optional[float] = Field(None, ge=0, le=100)
    sheet_percent: Optional[float] = Field(None, ge=0, le=100)
    coil_percent: Optional[float] = Field(None, ge=0, le=100)


class Mutation(BaseModel):
    """Protein mutation"""
    position: int = Field(..., ge=1, description="Position (1-based)")
    wild_type: str = Field(..., pattern=r"^[ACDEFGHIKLMNPQRSTVWY]$")
    mutant: str = Field(..., pattern=r"^[ACDEFGHIKLMNPQRSTVWY]$")
    notation: Optional[str] = None


class ExternalReferences(BaseModel):
    """External database references"""
    pdb_ids: Optional[List[str]] = []
    uniprot_ids: Optional[List[str]] = []
    genbank_ids: Optional[List[str]] = []
    pubmed_ids: Optional[List[int]] = []


class ProteinMetadata(BaseModel):
    """Additional metadata for proteins"""
    name: Optional[str] = None
    organism: Optional[str] = None
    taxonomy_id: Optional[int] = None
    uniprot_id: Optional[str] = Field(None, pattern=r"^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$")
    gene_name: Optional[str] = None
    molecular_weight: Optional[float] = Field(None, ge=0)
    length: Optional[int] = Field(None, ge=1)
    isoelectric_point: Optional[float] = Field(None, ge=0, le=14)
    function: Optional[str] = None
    domains: Optional[List[ProteinDomain]] = []
    secondary_structure: Optional[SecondaryStructure] = None
    expression_system: Optional[str] = None
    resolution: Optional[float] = Field(None, ge=0)
    structure_method: Optional[StructureMethod] = None
    cofactors: Optional[List[str]] = []
    mutations: Optional[List[Mutation]] = []
    external_references: Optional[ExternalReferences] = None
    tags: Optional[List[str]] = []

    class Config:
        use_enum_values = True
        extra = "allow"


class Protein(BaseModel):
    """Standard protein data model"""
    protein_id: str = Field(..., pattern=r"^PROT-[A-Z0-9]{8,16}$", description="Unique protein identifier")
    sequence: str = Field(..., pattern=r"^[ACDEFGHIKLMNPQRSTVWY]+$", min_length=1, max_length=50000)
    structure_source: Optional[StructureSource] = StructureSource.UNKNOWN
    pdb_reference: Optional[str] = Field(None, pattern=r"^[0-9][A-Z0-9]{3}$")
    created_at: datetime = Field(..., description="Creation timestamp")
    metadata: Optional[ProteinMetadata] = Field(default_factory=ProteinMetadata)

    @field_validator('created_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Parse datetime from string if needed"""
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "protein_id": "PROT-XYZ98765",
                "sequence": "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRE",
                "structure_source": "experimental",
                "pdb_reference": "1ABC",
                "created_at": "2026-03-02T10:30:00Z"
            }
        }


# ============================================
# EMBEDDING MODELS
# ============================================

class SourceType(str, Enum):
    """Type of source entity"""
    MOLECULE = "molecule"
    PROTEIN = "protein"
    COMPLEX = "complex"
    REACTION = "reaction"
    OTHER = "other"


class ModelType(str, Enum):
    """Model architecture types"""
    TRANSFORMER = "transformer"
    GNN = "gnn"
    CNN = "cnn"
    RNN = "rnn"
    HYBRID = "hybrid"
    OTHER = "other"


class Framework(str, Enum):
    """ML frameworks"""
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    JAX = "jax"
    SKLEARN = "scikit-learn"
    OTHER = "other"


class Normalization(str, Enum):
    """Normalization methods"""
    STANDARD = "standard"
    MINMAX = "minmax"
    L2 = "l2"
    NONE = "none"


class PoolingStrategy(str, Enum):
    """Pooling strategies for embeddings"""
    MEAN = "mean"
    MAX = "max"
    CLS = "cls"
    SUM = "sum"
    ATTENTION = "attention"
    NONE = "none"


class Format(str, Enum):
    """File formats"""
    NPY = "npy"
    NPZ = "npz"
    H5 = "h5"
    PARQUET = "parquet"
    JSON = "json"
    BINARY = "binary"


class Compression(str, Enum):
    """Compression methods"""
    NONE = "none"
    GZIP = "gzip"
    LZ4 = "lz4"
    ZSTD = "zstd"


class DType(str, Enum):
    """Data types"""
    FLOAT16 = "float16"
    FLOAT32 = "float32"
    FLOAT64 = "float64"
    INT8 = "int8"
    INT16 = "int16"


class SimilarityMetric(str, Enum):
    """Similarity metrics"""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    MANHATTAN = "manhattan"
    DOT_PRODUCT = "dot_product"


class DimensionalityReductionMethod(str, Enum):
    """Dimensionality reduction methods"""
    PCA = "pca"
    UMAP = "umap"
    TSNE = "tsne"
    AUTOENCODER = "autoencoder"
    NONE = "none"


class UseCase(str, Enum):
    """Embedding use cases"""
    SIMILARITY_SEARCH = "similarity_search"
    CLUSTERING = "clustering"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    RETRIEVAL = "retrieval"
    VISUALIZATION = "visualization"


class Preprocessing(BaseModel):
    """Preprocessing configuration"""
    normalization: Optional[Normalization] = Normalization.NONE
    tokenization: Optional[str] = None
    augmentation: Optional[bool] = False

    class Config:
        use_enum_values = True


class DimensionalityReduction(BaseModel):
    """Dimensionality reduction details"""
    method: Optional[DimensionalityReductionMethod] = DimensionalityReductionMethod.NONE
    original_dimension: Optional[int] = Field(None, ge=1)
    variance_retained: Optional[float] = Field(None, ge=0, le=1)

    class Config:
        use_enum_values = True


class ValidationMetrics(BaseModel):
    """Validation metrics for embeddings"""
    reconstruction_error: Optional[float] = Field(None, ge=0)
    downstream_accuracy: Optional[float] = Field(None, ge=0, le=1)
    nearest_neighbor_recall: Optional[float] = Field(None, ge=0, le=1)


class VersionHistory(BaseModel):
    """Version history entry"""
    version: str
    created_at: datetime
    changes: Optional[str] = None


class EmbeddingMetadata(BaseModel):
    """Additional metadata for embeddings"""
    model_name: Optional[str] = None
    model_type: Optional[ModelType] = None
    framework: Optional[Framework] = None
    checkpoint_path: Optional[str] = None
    preprocessing: Optional[Preprocessing] = None
    embedding_layer: Optional[str] = None
    pooling_strategy: Optional[PoolingStrategy] = PoolingStrategy.MEAN
    computation_time: Optional[float] = Field(None, ge=0)
    gpu_used: Optional[bool] = None
    batch_size: Optional[int] = Field(None, ge=1)
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    vector_norm: Optional[float] = Field(None, ge=0)
    format: Optional[Format] = Format.NPY
    compression: Optional[Compression] = Compression.NONE
    dtype: Optional[DType] = DType.FLOAT32
    training_dataset: Optional[str] = None
    fine_tuned: Optional[bool] = False
    fine_tuning_task: Optional[str] = None
    similarity_metric: Optional[SimilarityMetric] = SimilarityMetric.COSINE
    dimensionality_reduction: Optional[DimensionalityReduction] = None
    use_cases: Optional[List[UseCase]] = []
    validation_metrics: Optional[ValidationMetrics] = None
    version_history: Optional[List[VersionHistory]] = []
    tags: Optional[List[str]] = []
    notes: Optional[str] = None

    class Config:
        use_enum_values = True
        extra = "allow"


class Embedding(BaseModel):
    """Standard embedding data model"""
    embedding_id: str = Field(..., pattern=r"^EMB-[A-Z0-9]{8,16}$", description="Unique embedding identifier")
    source_id: str = Field(..., pattern=r"^(MOL|PROT)-[A-Z0-9]{8,16}$", description="Source molecule/protein ID")
    source_type: Optional[SourceType] = SourceType.MOLECULE
    model_version: str = Field(..., pattern=r"^[a-zA-Z0-9._-]+@v[0-9]+\.[0-9]+\.[0-9]+$", description="Model version")
    vector_dimension: int = Field(..., ge=1, le=10000, description="Embedding dimension")
    storage_location: str = Field(..., description="Path/URI to stored embedding")
    created_at: datetime = Field(..., description="Creation timestamp")
    metadata: Optional[EmbeddingMetadata] = Field(default_factory=EmbeddingMetadata)

    @field_validator('created_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Parse datetime from string if needed"""
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "embedding_id": "EMB-ABC12345XYZ",
                "source_id": "MOL-ABC12345",
                "source_type": "molecule",
                "model_version": "molbert@v1.2.0",
                "vector_dimension": 768,
                "storage_location": "s3://research-lab/embeddings/2026/03/EMB-ABC12345XYZ.npy",
                "created_at": "2026-03-02T10:30:00Z"
            }
        }


# ============================================
# UTILITY FUNCTIONS
# ============================================

def validate_molecule(data: Dict[str, Any]) -> Molecule:
    """Validate molecule data against schema"""
    return Molecule(**data)


def validate_protein(data: Dict[str, Any]) -> Protein:
    """Validate protein data against schema"""
    return Protein(**data)


def validate_embedding(data: Dict[str, Any]) -> Embedding:
    """Validate embedding data against schema"""
    return Embedding(**data)


# Export all models
__all__ = [
    # Molecule models
    'Molecule',
    'MoleculeMetadata',
    'AtomFeatures',
    'BondFeatures',
    'SourceDataset',
    'Hybridization',
    'Chirality',
    'BondType',
    'Stereochemistry',
    
    # Protein models
    'Protein',
    'ProteinMetadata',
    'ProteinDomain',
    'SecondaryStructure',
    'Mutation',
    'ExternalReferences',
    'StructureSource',
    'StructureMethod',
    
    # Embedding models
    'Embedding',
    'EmbeddingMetadata',
    'Preprocessing',
    'DimensionalityReduction',
    'ValidationMetrics',
    'VersionHistory',
    'SourceType',
    'ModelType',
    'Framework',
    'PoolingStrategy',
    'Format',
    'Compression',
    'DType',
    'SimilarityMetric',
    'UseCase',
    
    # Utility functions
    'validate_molecule',
    'validate_protein',
    'validate_embedding',
]
