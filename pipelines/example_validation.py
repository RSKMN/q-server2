"""
Example script demonstrating how to use the validation utilities.

This script shows how to validate molecule, protein, and embedding data
using both Pydantic models and JSON schemas.
"""

from datetime import datetime
from .validators import (
    MoleculeValidator,
    ProteinValidator,
    EmbeddingValidator,
    validate_batch,
    validate_json_file,
    validate_jsonl_file
)


def example_molecule_validation():
    """Example: Validate a single molecule"""
    print("\n=== Molecule Validation Example ===")
    
    # Valid molecule data
    molecule_data = {
        "molecule_id": "MOL-ABC12345",
        "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",  # Aspirin
        "source_dataset": "chembl",
        "created_at": "2026-03-02T10:30:00Z",
        "metadata": {
            "molecular_weight": 180.16,
            "drug_like": True,
            "hbd": 1,
            "hba": 4
        }
    }
    
    validator = MoleculeValidator()
    result = validator.validate(molecule_data)
    
    print(f"Validation Result: {result}")
    print(f"Is Valid: {result.is_valid}")
    print(f"Errors: {result.errors}")
    print(f"Warnings: {result.warnings}")
    
    # Invalid molecule (missing required field)
    invalid_data = {
        "molecule_id": "MOL-INVALID",
        "smiles": "CCO",
        # Missing source_dataset and created_at
    }
    
    result = validator.validate(invalid_data)
    print(f"\nInvalid Data Result: {result}")
    print(f"Errors: {result.errors}")


def example_protein_validation():
    """Example: Validate a protein"""
    print("\n=== Protein Validation Example ===")
    
    protein_data = {
        "protein_id": "PROT-XYZ98765",
        "sequence": "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRE",
        "structure_source": "experimental",
        "pdb_reference": "1ABC",
        "created_at": "2026-03-02T10:30:00Z",
        "metadata": {
            "name": "Ubiquitin",
            "organism": "Homo sapiens",
            "uniprot_id": "P62988"
        }
    }
    
    validator = ProteinValidator()
    result = validator.validate(protein_data)
    
    print(f"Validation Result: {result}")
    print(f"Is Valid: {result.is_valid}")


def example_embedding_validation():
    """Example: Validate an embedding"""
    print("\n=== Embedding Validation Example ===")
    
    embedding_data = {
        "embedding_id": "EMB-XYZ123ABC456",
        "source_id": "MOL-ABC12345",
        "source_type": "molecule",
        "model_version": "molbert@v1.2.0",
        "vector_dimension": 768,
        "storage_location": "s3://research-lab/embeddings/2026/03/EMB-XYZ123ABC456.npy",
        "created_at": "2026-03-02T10:30:00Z",
        "metadata": {
            "model_name": "MolBERT",
            "model_type": "transformer",
            "framework": "pytorch"
        }
    }
    
    validator = EmbeddingValidator()
    result = validator.validate(embedding_data)
    
    print(f"Validation Result: {result}")
    print(f"Is Valid: {result.is_valid}")


def example_batch_validation():
    """Example: Validate a batch of molecules"""
    print("\n=== Batch Validation Example ===")
    
    molecules = [
        {
            "molecule_id": f"MOL-BATCH{i:08d}",
            "smiles": "CCO" if i % 2 == 0 else "CC(=O)O",
            "source_dataset": "zinc",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        for i in range(10)
    ]
    
    batch_result = validate_batch(molecules, MoleculeValidator)
    
    print(f"Batch Result: {batch_result}")
    print(f"Summary: {batch_result.summary()}")
    print(f"Success Rate: {batch_result.success_rate:.2%}")
    
    # Show individual results
    for idx, result in enumerate(batch_result.results[:3]):  # First 3 only
        print(f"\nRecord {idx+1}: {result}")


def example_file_validation():
    """Example: Validate data from files"""
    print("\n=== File Validation Example ===")
    
    # This would validate a JSON file if it exists
    # result = validate_json_file("data/molecule.json", MoleculeValidator)
    # print(f"File Validation: {result}")
    
    print("To validate a JSON file, use:")
    print("  validate_json_file('path/to/file.json', MoleculeValidator)")
    print("\nTo validate a JSONL file with multiple records, use:")
    print("  validate_jsonl_file('path/to/file.jsonl', MoleculeValidator)")


if __name__ == "__main__":
    print("=" * 60)
    print("P3 Validation Utilities - Examples")
    print("=" * 60)
    
    try:
        example_molecule_validation()
        example_protein_validation()
        example_embedding_validation()
        example_batch_validation()
        example_file_validation()
        
        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nError running examples: {e}")
        import traceback
        traceback.print_exc()
