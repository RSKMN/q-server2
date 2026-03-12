# P3 Development Guide

Complete development guide for contributing to the P3 research infrastructure.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Adding New Features](#adding-new-features)
4. [Testing](#testing)
5. [Code Style](#code-style)
6. [Git Workflow](#git-workflow)
7. [Documentation](#documentation)
8. [Debugging](#debugging)

---

## Development Setup

### Prerequisites

```bash
python --version  # 3.10+
docker --version
docker-compose --version
git --version
```

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd research-lab

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Create directories (if not present)
mkdir -p logs notebooks/exploration notebooks/analysis
```

### Database Setup (Local)

```bash
# Using Docker
docker-compose up -d postgres redis

# Or native PostgreSQL
createdb research_lab
psql research_lab -f infrastructure/schema.sql

# Verify connection
python -c "from infrastructure.config import get_settings; print(get_settings().database.database_url)"
```

### First Test

```bash
python -c "
from schemas import Molecule
from pipelines import MoleculeValidator

data = {
    'molecule_id': 'MOL-TEST00001',
    'smiles': 'CCO',
    'source_dataset': 'zinc',
    'created_at': '2026-03-02T10:00:00Z'
}

validator = MoleculeValidator()
result = validator.validate(data)
print(f'✓ Setup successful!' if result.is_valid else f'✗ Validation failed')
"
```

---

## Project Structure

```
research-lab/
├── schemas/              # Data contracts
│   ├── *.json           # JSON schemas
│   ├── models.py        # Pydantic models
│   └── __init__.py
│
├── pipelines/           # ETL pipelines
│   ├── validators.py    # Validation utilities
│   ├── __init__.py
│   └── README.md
│
├── services/            # Business logic
│   └── *.py
│
├── api/                 # REST endpoints
│   ├── main.py
│   ├── routes/
│   └── __init__.py
│
├── infrastructure/      # Configuration
│   ├── config.py        # Settings management
│   ├── prometheus.yml   # Monitoring
│   └── k8s/             # Kubernetes configs
│
├── tests/               # Test suite
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── notebooks/           # Jupyter notebooks
│
├── requirements.txt     # Dependencies
├── .env.example         # Configuration template
├── docker-compose.yml   # Local development
├── Dockerfile           # Container image
└── README.md            # Main documentation
```

---

## Adding New Features

### 1. Adding a New Schema

```python
# 1. Create JSON schema: schemas/my_entity_schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MyEntity",
  "type": "object",
  "required": ["id", "created_at"],
  "properties": {
    "id": {...},
    "created_at": {...}
  }
}

# 2. Add Pydantic model to schemas/models.py
from pydantic import BaseModel, Field

class MyEntity(BaseModel):
    id: str = Field(..., pattern=r"^MY-[A-Z0-9]{8,16}$")
    created_at: datetime
    # ... other fields

# 3. Update schemas/__init__.py
from schemas.models import MyEntity

__all__ = [..., 'MyEntity']

# 4. Export from __init__.py
```

### 2. Adding a New Validator

```python
# pipelines/validators.py

class MyEntityValidator:
    def __init__(self, use_json_schema: bool = False):
        self.use_json_schema = use_json_schema
        if use_json_schema:
            self.schema = SchemaLoader.load_schema("my_entity_schema")
    
    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        try:
            if self.use_json_schema:
                jsonschema.validate(instance=data, schema=self.schema)
                validated_data = data
            else:
                entity = MyEntity(**data)
                validated_data = entity.model_dump()
            
            warnings = self._check_quality(data)
            return ValidationResult(
                is_valid=True,
                data=validated_data,
                warnings=warnings
            )
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                errors=[str(e)]
            )
    
    def _check_quality(self, data: Dict[str, Any]) -> List[str]:
        warnings = []
        # Add quality checks
        return warnings
```

### 3. Adding API Endpoints

```python
# api/routes/my_entities.py

from fastapi import APIRouter, Depends, HTTPException
from schemas import MyEntity
from services import MyEntityService

router = APIRouter(prefix="/my_entities", tags=["my_entities"])

@router.get("/{id}")
async def get_my_entity(
    id: str,
    service: MyEntityService = Depends(get_service)
):
    """Get a my_entity by ID"""
    entity = await service.get(id)
    if not entity:
        raise HTTPException(status_code=404, detail="Not found")
    return entity

@router.post("/")
async def create_my_entity(
    data: MyEntity,
    service: MyEntityService = Depends(get_service)
):
    """Create a new my_entity"""
    return await service.create(data)
```

### 4. Adding Tests

```python
# tests/unit/test_my_entity.py

import pytest
from schemas import MyEntity
from pipelines import MyEntityValidator

@pytest.fixture
def valid_data():
    return {
        "id": "MY-ABC12345",
        "created_at": "2026-03-02T10:00:00Z"
    }

def test_valid_entity(valid_data):
    entity = MyEntity(**valid_data)
    assert entity.id == "MY-ABC12345"

def test_validator(valid_data):
    validator = MyEntityValidator()
    result = validator.validate(valid_data)
    assert result.is_valid

def test_invalid_data():
    data = {"id": "INVALID"}  # missing created_at
    with pytest.raises(Exception):
        MyEntity(**data)
```

---

## Testing

### Run Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/unit/test_validators.py

# With coverage
pytest --cov=schemas --cov=pipelines --cov-report=html

# Verbose
pytest -vv
```

### Test Organization

```
tests/
├── conftest.py          # Shared fixtures
├── unit/                # Unit tests
│   ├── test_models.py
│   └── test_validators.py
├── integration/         # Integration tests
│   ├── test_api.py
│   └── test_pipelines.py
├── e2e/                 # End-to-end tests
│   └── test_workflows.py
└── fixtures/            # Test data
    ├── molecules.json
    └── proteins.json
```

### Write Good Tests

```python
# ✓ Good test
def test_validator_accepts_valid_data():
    data = {"id": "MOL-ABC12345", "smiles": "CCO", ...}
    validator = MoleculeValidator()
    result = validator.validate(data)
    assert result.is_valid
    assert result.errors == []

# ✗ Poor test
def test_validator():
    result = MoleculeValidator().validate({"id": "MOL-ABC12345"})
    assert result
```

---

## Code Style

### Format Code

```bash
# Format with Black
black schemas/ pipelines/ services/ api/

# Format and check
black --check schemas/
```

### Lint Code

```bash
# Lint with Ruff
ruff check schemas/

# Fix issues
ruff check --fix schemas/
```

### Type Check

```bash
# Check types with MyPy
mypy schemas/ pipelines/

# Strict mode
mypy --strict schemas/
```

### Pre-commit Hook

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Style Guidelines

```python
# ✓ Good
def validate_molecule(data: Dict[str, Any]) -> ValidationResult:
    """Validate molecule data against schema."""
    try:
        molecule = Molecule(**data)
        return ValidationResult(is_valid=True, data=molecule.model_dump())
    except ValidationError as e:
        return ValidationResult(is_valid=False, errors=[str(e)])

# ✗ Poor
def validate(d):
    try:
        m = Molecule(**d)
        return True, m
    except:
        return False, None
```

---

## Git Workflow

### Branch Naming

```bash
feature/add-new-schema
bugfix/fix-validation-error
docs/update-readme
test/add-integration-tests
```

### Commit Messages

```bash
# ✓ Good
git commit -m "feat: Add embedding validation schema"
git commit -m "fix: Handle timezone in datetime parsing"
git commit -m "docs: Update installation instructions"

# ✗ Poor
git commit -m "update"
git commit -m "fixed bug"
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Add/update tests
4. Run linting and tests
5. Update documentation
6. Create PR with description
7. Request review
8. Address feedback
9. Merge when approved

---

## Documentation

### Update Documentation When

- ✓ Adding new endpoints
- ✓ Changing configuration
- ✓ Adding new schemas
- ✓ Modifying pipelines
- ✓ Changing dependencies

### Documentation Files

```
README.md             # Main overview
ARCHITECTURE.md       # System design
DEVELOPMENT.md        # This file
api/README.md         # API documentation
schemas/README.md     # Schema documentation
pipelines/README.md   # Pipeline documentation
```

### Documentation Style

```markdown
# Clear Headings

Use action verbs:
- "Getting Started"
- "Installing Dependencies"
- "Running Tests"

Include examples:
\`\`\`python
# Code example
from schemas import Molecule
\`\`\`

Include commands:
\`\`\`bash
# Terminal command
python -m pytest
\`\`\`
```

---

## Debugging

### Print Debugging

```python
import logging

logger = logging.getLogger(__name__)

logger.debug("Variable value: %s", var)
logger.info("Operation started")
logger.warning("Unexpected value: %s", value)
logger.error("Error occurred", exc_info=True)
```

### Python Debugger

```python
import pdb

# Set breakpoint
pdb.set_trace()

# Or use Python 3.7+
breakpoint()
```

### Troubleshooting

```bash
# Check Python environment
which python
python -c "import sys; print(sys.path)"

# Check installed packages
pip list

# Check import paths
python -c "import schemas; print(schemas.__file__)"

# Run with verbose output
python -m pytest -vv --tb=long
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Set PYTHONPATH or install package |
| Import circular dependency | Reorganize module structure |
| Type errors | Run `mypy` and fix type hints |
| Test failures | Check test data and dependencies |
| Docker issues | Clear cache: `docker-compose down -v` |

---

## Resources

- [Python Best Practices](https://pep8.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [pytest Documentation](https://docs.pytest.org/)

---

**Last Updated**: 2026-03-02  
**Version**: 1.0.0
