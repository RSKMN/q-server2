"""
P3 Research Lab - Data Schemas Package

This package contains JSON schemas, Pydantic models, and validation utilities
for standardizing data across the research infrastructure.
"""

from schemas.models import (
    # Molecule models
    Molecule,
    MoleculeMetadata,
    AtomFeatures,
    BondFeatures,
    
    # Protein models
    Protein,
    ProteinMetadata,
    ProteinDomain,
    
    # Embedding models
    Embedding,
    EmbeddingMetadata,
    
    # Validation functions
    validate_molecule,
    validate_protein,
    validate_embedding,
)

__version__ = "1.0.0"
__author__ = "P3 Systems & Backend Team"

__all__ = [
    # Molecule
    'Molecule',
    'MoleculeMetadata',
    'AtomFeatures',
    'BondFeatures',
    
    # Protein
    'Protein',
    'ProteinMetadata',
    'ProteinDomain',
    
    # Embedding
    'Embedding',
    'EmbeddingMetadata',
    
    # Validators
    'validate_molecule',
    'validate_protein',
    'validate_embedding',
]
