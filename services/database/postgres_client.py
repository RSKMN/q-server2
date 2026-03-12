from __future__ import annotations

import os
from threading import Lock

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


_ENGINE: Engine | None = None
_SESSION_FACTORY: sessionmaker[Session] | None = None
_LOCK = Lock()


def _get_required_env(name: str) -> str:
	value = os.getenv(name)
	if value is None or value.strip() == "":
		raise RuntimeError(f"Missing required environment variable: {name}")
	return value


def _build_postgres_url() -> str:
	host = _get_required_env("P3_POSTGRES_HOST")
	port = _get_required_env("P3_POSTGRES_PORT")
	database = _get_required_env("P3_POSTGRES_DB")
	user = _get_required_env("P3_POSTGRES_USER")
	password = _get_required_env("P3_POSTGRES_PASSWORD")
	return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"


def get_engine() -> Engine:
	"""Return a cached SQLAlchemy engine configured with connection pooling."""
	global _ENGINE
	if _ENGINE is not None:
		return _ENGINE

	with _LOCK:
		if _ENGINE is None:
			_ENGINE = create_engine(
				_build_postgres_url(),
				pool_size=5,
				max_overflow=10,
				pool_timeout=30,
				pool_recycle=1800,
				pool_pre_ping=True,
			)
	return _ENGINE


def get_session() -> Session:
	"""Create and return a new SQLAlchemy session bound to the pooled engine."""
	global _SESSION_FACTORY
	if _SESSION_FACTORY is None:
		with _LOCK:
			if _SESSION_FACTORY is None:
				_SESSION_FACTORY = sessionmaker(
					bind=get_engine(),
					autoflush=False,
					autocommit=False,
					expire_on_commit=False,
				)
	return _SESSION_FACTORY()
