"""
Data validation utilities for P3 ingestion pipelines.

This module provides validation functions that can be integrated into ETL/ELT
pipelines to ensure data quality and schema compliance.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Union, Optional, Tuple
from datetime import datetime
import jsonschema
from pydantic import ValidationError

# Import models from the schemas module
import sys
sys.path.append(str(Path(__file__).parent.parent))
from schemas.models import (
    Molecule, Protein, Embedding,
    validate_molecule, validate_protein, validate_embedding
)


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# VALIDATION RESULT CLASSES
# ============================================

class ValidationResult:
    """Result of a validation operation"""
    
    def __init__(
        self,
        is_valid: bool,
        data: Optional[Any] = None,
        errors: Optional[List[str]] = None,
        warnings: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.is_valid = is_valid
        self.data = data
        self.errors = errors or []
        self.warnings = warnings or []
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()
    
    def __repr__(self) -> str:
        status = "VALID" if self.is_valid else "INVALID"
        return f"ValidationResult(status={status}, errors={len(self.errors)}, warnings={len(self.warnings)})"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat()
        }


class BatchValidationResult:
    """Result of batch validation"""
    
    def __init__(self):
        self.total_count = 0
        self.valid_count = 0
        self.invalid_count = 0
        self.results: List[ValidationResult] = []
    
    def add_result(self, result: ValidationResult):
        """Add a validation result"""
        self.results.append(result)
        self.total_count += 1
        if result.is_valid:
            self.valid_count += 1
        else:
            self.invalid_count += 1
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_count == 0:
            return 0.0
        return self.valid_count / self.total_count
    
    def summary(self) -> Dict[str, Any]:
        """Get summary statistics"""
        return {
            "total_count": self.total_count,
            "valid_count": self.valid_count,
            "invalid_count": self.invalid_count,
            "success_rate": self.success_rate,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def __repr__(self) -> str:
        return f"BatchValidationResult(total={self.total_count}, valid={self.valid_count}, invalid={self.invalid_count})"


# ============================================
# SCHEMA LOADER
# ============================================

class SchemaLoader:
    """Load and cache JSON schemas"""
    
    _cache: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def load_schema(cls, schema_name: str, schemas_dir: Optional[Path] = None) -> Dict[str, Any]:
        """
        Load a JSON schema by name.
        
        Args:
            schema_name: Name of schema (e.g., 'molecule_schema')
            schemas_dir: Directory containing schemas (defaults to ../schemas)
        
        Returns:
            Schema dictionary
        """
        if schema_name in cls._cache:
            return cls._cache[schema_name]
        
        if schemas_dir is None:
            schemas_dir = Path(__file__).parent.parent / "schemas"
        
        schema_path = schemas_dir / f"{schema_name}.json"
        
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema not found: {schema_path}")
        
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        cls._cache[schema_name] = schema
        logger.info(f"Loaded schema: {schema_name}")
        return schema


# ============================================
# VALIDATORS
# ============================================

class MoleculeValidator:
    """Validator for molecule data"""
    
    def __init__(self, use_json_schema: bool = False):
        """
        Initialize validator.
        
        Args:
            use_json_schema: Use JSON schema validation instead of Pydantic
        """
        self.use_json_schema = use_json_schema
        if use_json_schema:
            self.schema = SchemaLoader.load_schema("molecule_schema")
    
    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        """
        Validate molecule data.
        
        Args:
            data: Molecule data dictionary
        
        Returns:
            ValidationResult
        """
        errors = []
        warnings = []
        
        try:
            if self.use_json_schema:
                # JSON Schema validation
                jsonschema.validate(instance=data, schema=self.schema)
                validated_data = data
            else:
                # Pydantic validation
                molecule = validate_molecule(data)
                validated_data = molecule.model_dump()
            
            # Additional business logic validations
            additional_warnings = self._check_quality(data)
            warnings.extend(additional_warnings)
            
            return ValidationResult(
                is_valid=True,
                data=validated_data,
                warnings=warnings
            )
        
        except ValidationError as e:
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error['loc'])
                errors.append(f"{loc}: {error['msg']}")
            logger.warning(f"Molecule validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except jsonschema.ValidationError as e:
            errors.append(str(e.message))
            logger.warning(f"Molecule JSON schema validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except Exception as e:
            errors.append(f"Unexpected error: {str(e)}")
            logger.error(f"Unexpected validation error: {e}", exc_info=True)
            return ValidationResult(is_valid=False, errors=errors)
    
    def _check_quality(self, data: Dict[str, Any]) -> List[str]:
        """Additional quality checks"""
        warnings = []
        
        # Check SMILES length
        smiles = data.get('smiles', '')
        if len(smiles) > 500:
            warnings.append("SMILES string is unusually long (>500 characters)")
        
        # Check for missing optional but recommended fields
        metadata = data.get('metadata', {})
        if not metadata.get('molecular_weight'):
            warnings.append("Missing recommended field: metadata.molecular_weight")
        
        return warnings


class ProteinValidator:
    """Validator for protein data"""
    
    def __init__(self, use_json_schema: bool = False):
        """
        Initialize validator.
        
        Args:
            use_json_schema: Use JSON schema validation instead of Pydantic
        """
        self.use_json_schema = use_json_schema
        if use_json_schema:
            self.schema = SchemaLoader.load_schema("protein_schema")
    
    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        """
        Validate protein data.
        
        Args:
            data: Protein data dictionary
        
        Returns:
            ValidationResult
        """
        errors = []
        warnings = []
        
        try:
            if self.use_json_schema:
                # JSON Schema validation
                jsonschema.validate(instance=data, schema=self.schema)
                validated_data = data
            else:
                # Pydantic validation
                protein = validate_protein(data)
                validated_data = protein.model_dump()
            
            # Additional business logic validations
            additional_warnings = self._check_quality(data)
            warnings.extend(additional_warnings)
            
            return ValidationResult(
                is_valid=True,
                data=validated_data,
                warnings=warnings
            )
        
        except ValidationError as e:
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error['loc'])
                errors.append(f"{loc}: {error['msg']}")
            logger.warning(f"Protein validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except jsonschema.ValidationError as e:
            errors.append(str(e.message))
            logger.warning(f"Protein JSON schema validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except Exception as e:
            errors.append(f"Unexpected error: {str(e)}")
            logger.error(f"Unexpected validation error: {e}", exc_info=True)
            return ValidationResult(is_valid=False, errors=errors)
    
    def _check_quality(self, data: Dict[str, Any]) -> List[str]:
        """Additional quality checks"""
        warnings = []
        
        # Check sequence length
        sequence = data.get('sequence', '')
        if len(sequence) < 50:
            warnings.append("Sequence is unusually short (<50 residues)")
        elif len(sequence) > 5000:
            warnings.append("Sequence is unusually long (>5000 residues)")
        
        # Check for PDB reference
        if data.get('structure_source') == 'experimental' and not data.get('pdb_reference'):
            warnings.append("Experimental structure missing PDB reference")
        
        return warnings


class EmbeddingValidator:
    """Validator for embedding data"""
    
    def __init__(self, use_json_schema: bool = False):
        """
        Initialize validator.
        
        Args:
            use_json_schema: Use JSON schema validation instead of Pydantic
        """
        self.use_json_schema = use_json_schema
        if use_json_schema:
            self.schema = SchemaLoader.load_schema("embedding_schema")
    
    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        """
        Validate embedding data.
        
        Args:
            data: Embedding data dictionary
        
        Returns:
            ValidationResult
        """
        errors = []
        warnings = []
        
        try:
            if self.use_json_schema:
                # JSON Schema validation
                jsonschema.validate(instance=data, schema=self.schema)
                validated_data = data
            else:
                # Pydantic validation
                embedding = validate_embedding(data)
                validated_data = embedding.model_dump()
            
            # Additional business logic validations
            additional_warnings = self._check_quality(data)
            warnings.extend(additional_warnings)
            
            return ValidationResult(
                is_valid=True,
                data=validated_data,
                warnings=warnings
            )
        
        except ValidationError as e:
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error['loc'])
                errors.append(f"{loc}: {error['msg']}")
            logger.warning(f"Embedding validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except jsonschema.ValidationError as e:
            errors.append(str(e.message))
            logger.warning(f"Embedding JSON schema validation failed: {errors}")
            return ValidationResult(is_valid=False, errors=errors)
        
        except Exception as e:
            errors.append(f"Unexpected error: {str(e)}")
            logger.error(f"Unexpected validation error: {e}", exc_info=True)
            return ValidationResult(is_valid=False, errors=errors)
    
    def _check_quality(self, data: Dict[str, Any]) -> List[str]:
        """Additional quality checks"""
        warnings = []
        
        # Check dimension size
        dimension = data.get('vector_dimension', 0)
        if dimension < 64:
            warnings.append(f"Embedding dimension is small ({dimension})")
        elif dimension > 2048:
            warnings.append(f"Embedding dimension is large ({dimension})")
        
        # Check storage location
        storage_location = data.get('storage_location', '')
        if not storage_location.startswith(('s3://', 'gs://', 'azure://', '/', 'file://')):
            warnings.append("Storage location may not be a valid URI/path")
        
        return warnings


# ============================================
# BATCH VALIDATION
# ============================================

def validate_batch(
    data_list: List[Dict[str, Any]],
    validator_class: Union[type[MoleculeValidator], type[ProteinValidator], type[EmbeddingValidator]],
    fail_fast: bool = False
) -> BatchValidationResult:
    """
    Validate a batch of records.
    
    Args:
        data_list: List of data dictionaries
        validator_class: Validator class to use
        fail_fast: Stop on first error
    
    Returns:
        BatchValidationResult
    """
    validator = validator_class()
    batch_result = BatchValidationResult()
    
    for idx, data in enumerate(data_list):
        result = validator.validate(data)
        batch_result.add_result(result)
        
        if not result.is_valid and fail_fast:
            logger.error(f"Validation failed at record {idx+1}. Stopping.")
            break
        
        # Log progress every 100 records
        if (idx + 1) % 100 == 0:
            logger.info(f"Validated {idx+1}/{len(data_list)} records")
    
    logger.info(f"Batch validation complete: {batch_result}")
    return batch_result


# ============================================
# FILE VALIDATORS
# ============================================

def validate_json_file(
    file_path: Union[str, Path],
    validator_class: Union[type[MoleculeValidator], type[ProteinValidator], type[EmbeddingValidator]]
) -> ValidationResult:
    """
    Validate a JSON file containing a single record.
    
    Args:
        file_path: Path to JSON file
        validator_class: Validator class to use
    
    Returns:
        ValidationResult
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        validator = validator_class()
        return validator.validate(data)
    
    except json.JSONDecodeError as e:
        return ValidationResult(
            is_valid=False,
            errors=[f"Invalid JSON: {str(e)}"]
        )
    except FileNotFoundError:
        return ValidationResult(
            is_valid=False,
            errors=[f"File not found: {file_path}"]
        )


def validate_jsonl_file(
    file_path: Union[str, Path],
    validator_class: Union[type[MoleculeValidator], type[ProteinValidator], type[EmbeddingValidator]],
    fail_fast: bool = False
) -> BatchValidationResult:
    """
    Validate a JSONL file containing multiple records.
    
    Args:
        file_path: Path to JSONL file
        validator_class: Validator class to use
        fail_fast: Stop on first error
    
    Returns:
        BatchValidationResult
    """
    try:
        data_list = []
        with open(file_path, 'r') as f:
            for line in f:
                if line.strip():
                    data_list.append(json.loads(line))
        
        return validate_batch(data_list, validator_class, fail_fast)
    
    except FileNotFoundError:
        batch_result = BatchValidationResult()
        result = ValidationResult(
            is_valid=False,
            errors=[f"File not found: {file_path}"]
        )
        batch_result.add_result(result)
        return batch_result


# ============================================
# EXPORT FUNCTIONS
# ============================================

__all__ = [
    'ValidationResult',
    'BatchValidationResult',
    'SchemaLoader',
    'MoleculeValidator',
    'ProteinValidator',
    'EmbeddingValidator',
    'validate_batch',
    'validate_json_file',
    'validate_jsonl_file',
]
