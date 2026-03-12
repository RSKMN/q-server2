"""
Configuration management for P3 research infrastructure.

This module loads configuration from environment variables and provides
type-safe access to settings throughout the application.
"""

from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DataPathSettings(BaseSettings):
    """Data path configurations"""
    
    data_root: Path = Field(default=Path("./data"), description="Root data directory")
    
    # Raw data paths
    raw_data: Optional[Path] = None
    raw_zinc: Optional[Path] = None
    raw_chembl: Optional[Path] = None
    raw_pdbbind: Optional[Path] = None
    raw_drugbank: Optional[Path] = None
    
    # Processed data paths
    processed_data: Optional[Path] = None
    graphs_data: Optional[Path] = None
    features_data: Optional[Path] = None
    embeddings_data: Optional[Path] = None
    
    # Other data paths
    generated_data: Optional[Path] = None
    simulations_data: Optional[Path] = None
    metadata_path: Optional[Path] = None
    
    model_config = SettingsConfigDict(env_prefix="P3_")
    
    def model_post_init(self, __context) -> None:
        """Initialize paths relative to data_root if not set"""
        if self.raw_data is None:
            self.raw_data = self.data_root / "raw"
        if self.raw_zinc is None:
            self.raw_zinc = self.raw_data / "zinc"
        if self.raw_chembl is None:
            self.raw_chembl = self.raw_data / "chembl"
        if self.raw_pdbbind is None:
            self.raw_pdbbind = self.raw_data / "pdbbind"
        if self.raw_drugbank is None:
            self.raw_drugbank = self.raw_data / "drugbank"
        
        if self.processed_data is None:
            self.processed_data = self.data_root / "processed"
        if self.graphs_data is None:
            self.graphs_data = self.processed_data / "graphs"
        if self.features_data is None:
            self.features_data = self.processed_data / "features"
        if self.embeddings_data is None:
            self.embeddings_data = self.processed_data / "embeddings"
        
        if self.generated_data is None:
            self.generated_data = self.data_root / "generated"
        if self.simulations_data is None:
            self.simulations_data = self.data_root / "simulations"
        if self.metadata_path is None:
            self.metadata_path = self.data_root / "metadata"


class DatabaseSettings(BaseSettings):
    """Database configurations"""
    
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "research_lab"
    postgres_user: str = "postgres"
    postgres_password: str = "password"
    
    # MongoDB (optional)
    mongo_uri: Optional[str] = None
    mongo_db: Optional[str] = None
    
    # Redis (optional)
    redis_host: Optional[str] = None
    redis_port: int = 6379
    redis_db: int = 0
    
    model_config = SettingsConfigDict(env_prefix="P3_")
    
    @property
    def database_url(self) -> str:
        """Construct PostgreSQL connection URL"""
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"


class StorageSettings(BaseSettings):
    """Cloud storage configurations"""
    
    storage_backend: str = Field(default="local", description="Storage backend: local, s3, gcs, azure")
    
    # AWS S3
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket: Optional[str] = None
    s3_embeddings_prefix: str = "embeddings/"
    
    # GCS
    gcs_project_id: Optional[str] = None
    gcs_bucket: Optional[str] = None
    google_application_credentials: Optional[Path] = None
    
    # Azure
    azure_storage_account: Optional[str] = None
    azure_storage_key: Optional[str] = None
    azure_container: Optional[str] = None
    
    # Local
    local_storage_path: Optional[Path] = None
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class APISettings(BaseSettings):
    """API configurations"""
    
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    api_reload: bool = True
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Authentication
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    jwt_secret: Optional[str] = None
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600
    
    # Rate limiting
    rate_limit_per_minute: int = 100
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class MLSettings(BaseSettings):
    """Machine learning configurations"""
    
    model_cache_dir: Path = Field(default=Path("./models/cache"))
    model_device: str = "cuda"  # cuda, cpu, mps
    model_batch_size: int = 32
    model_registry_uri: Optional[str] = None
    mlflow_tracking_uri: Optional[str] = None
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class LoggingSettings(BaseSettings):
    """Logging and monitoring configurations"""
    
    log_level: str = "INFO"
    log_format: str = "json"  # json, text
    log_file: Optional[Path] = None
    
    # External services
    sentry_dsn: Optional[str] = None
    metrics_port: int = 9090
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class ValidationSettings(BaseSettings):
    """Validation configurations"""
    
    validation_mode: str = "strict"  # strict, lenient
    validation_fail_fast: bool = False
    validation_max_errors: int = 100
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class ComputeSettings(BaseSettings):
    """Compute resource configurations"""
    
    max_workers: int = 8
    max_memory_gb: int = 32
    gpu_memory_fraction: float = 0.9
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class FeatureFlags(BaseSettings):
    """Feature flag configurations"""
    
    enable_caching: bool = True
    enable_profiling: bool = False
    enable_metrics: bool = True
    enable_rate_limiting: bool = True
    
    model_config = SettingsConfigDict(env_prefix="P3_")


class Settings(BaseSettings):
    """Main settings class combining all configuration sections"""
    
    # Environment
    environment: str = Field(default="development", description="Environment: development, staging, production")
    debug: bool = False
    
    # Sub-settings
    data: DataPathSettings = Field(default_factory=DataPathSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)
    api: APISettings = Field(default_factory=APISettings)
    ml: MLSettings = Field(default_factory=MLSettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    validation: ValidationSettings = Field(default_factory=ValidationSettings)
    compute: ComputeSettings = Field(default_factory=ComputeSettings)
    features: FeatureFlags = Field(default_factory=FeatureFlags)
    
    model_config = SettingsConfigDict(
        env_prefix="P3_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value"""
        allowed = {"development", "staging", "production"}
        if v.lower() not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v.lower()
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Get the global settings instance.
    
    This function implements a singleton pattern to ensure settings
    are loaded only once and reused throughout the application.
    
    Returns:
        Settings instance
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    """
    Reload settings from environment.
    
    Useful for testing or when environment changes.
    
    Returns:
        New Settings instance
    """
    global _settings
    _settings = Settings()
    return _settings


# Convenience exports
__all__ = [
    'Settings',
    'DataPathSettings',
    'DatabaseSettings',
    'StorageSettings',
    'APISettings',
    'MLSettings',
    'LoggingSettings',
    'ValidationSettings',
    'ComputeSettings',
    'FeatureFlags',
    'get_settings',
    'reload_settings',
]


# Example usage
if __name__ == "__main__":
    """Example: How to use settings"""
    
    # Load settings
    settings = get_settings()
    
    print(f"Environment: {settings.environment}")
    print(f"Data Root: {settings.data.data_root}")
    print(f"Database URL: {settings.database.database_url}")
    print(f"API Port: {settings.api.api_port}")
    print(f"Log Level: {settings.logging.log_level}")
    print(f"Validation Mode: {settings.validation.validation_mode}")
    
    # Access nested settings
    print(f"\nRaw Data Paths:")
    print(f"  ZINC: {settings.data.raw_zinc}")
    print(f"  ChEMBL: {settings.data.raw_chembl}")
    print(f"  PDBbind: {settings.data.raw_pdbbind}")
    
    # Check environment
    if settings.is_production():
        print("\nRunning in PRODUCTION mode")
    else:
        print("\nRunning in DEVELOPMENT mode")
