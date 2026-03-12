# P3 Services Documentation

This directory contains core business logic services for the research lab.

## Services (To be implemented)

### Molecule Service
Handles molecule data operations:
- Ingestion from external sources
- Feature extraction
- Graph representation generation
- Validation and quality checks

### Protein Service
Handles protein data operations:
- Sequence management
- Structure handling
- Domain annotation
- UniProt integration

### Embedding Service
Handles embedding operations:
- Embedding generation
- Vector storage and retrieval
- Similarity search
- Model versioning

### Validation Service
Handles data validation:
- Schema validation
- Data quality checks
- Constraint enforcement

## Service Architecture

Each service follows a consistent pattern:

```python
class MyService:
    def __init__(self, db_session, logger):
        self.db = db_session
        self.logger = logger
    
    async def create(self, data: InputModel) -> OutputModel:
        """Create a new record"""
        pass
    
    async def get(self, id: str) -> OutputModel:
        """Get record by ID"""
        pass
    
    async def update(self, id: str, data: InputModel) -> OutputModel:
        """Update record"""
        pass
    
    async def delete(self, id: str) -> bool:
        """Delete record"""
        pass
    
    async def list(self, filters: Dict) -> List[OutputModel]:
        """List records with filters"""
        pass
```

## Dependency Injection

Services are injected into endpoints:

```python
@router.get("/molecules/{id}")
async def get_molecule(
    id: str,
    service: MoleculeService = Depends(get_molecule_service)
):
    return await service.get(id)
```

## Error Handling

All services implement consistent error handling:

```python
class ServiceError(Exception):
    """Base service error"""
    pass

class NotFoundError(ServiceError):
    """Resource not found"""
    pass

class ValidationError(ServiceError):
    """Validation failed"""
    pass
```

## Structure

```
services/
├── molecule_service.py  # Molecule operations
├── protein_service.py   # Protein operations
├── embedding_service.py # Embedding operations
├── validators.py        # Validation service
└── __init__.py
```

## Integration with Pipelines

Services act as the bridge between API endpoints and data pipelines:

```
API Endpoint
    ↓
Service Layer
    ↓
Validator
    ↓
Database / Storage
    ↓
Pipeline (if needed)
```
