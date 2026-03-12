from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from services.database.models import Dataset
from services.database.postgres_client import get_session


class DatasetService:
	"""Service for dataset metadata registration and lookup."""

	@contextmanager
	def _session_scope(self) -> Iterator[Session]:
		session = get_session()
		try:
			yield session
			session.commit()
		except Exception:
			session.rollback()
			raise
		finally:
			session.close()

	def _find_dataset(self, session: Session, name: str, version: str) -> Dataset | None:
		statement = select(Dataset).where(Dataset.name == name, Dataset.version == version)
		return session.execute(statement).scalar_one_or_none()

	def register_dataset(self, name: str, source: str, version: str) -> UUID:
		"""Register a dataset and return dataset_id; if it exists, return existing ID."""
		with self._session_scope() as session:
			existing = self._find_dataset(session=session, name=name, version=version)
			if existing is not None:
				return existing.dataset_id

			dataset = Dataset(name=name, source=source, version=version)
			session.add(dataset)

			try:
				session.flush()
			except IntegrityError:
				# Another writer may have inserted the same dataset concurrently.
				session.rollback()
				existing_after_conflict = self._find_dataset(session=session, name=name, version=version)
				if existing_after_conflict is None:
					raise
				return existing_after_conflict.dataset_id

			return dataset.dataset_id

	def get_dataset(self, name: str, version: str) -> UUID:
		"""Return dataset_id for name/version, creating it if missing."""
		with self._session_scope() as session:
			existing = self._find_dataset(session=session, name=name, version=version)
			if existing is not None:
				return existing.dataset_id

			dataset = Dataset(name=name, source="unknown", version=version)
			session.add(dataset)

			try:
				session.flush()
			except IntegrityError:
				session.rollback()
				existing_after_conflict = self._find_dataset(session=session, name=name, version=version)
				if existing_after_conflict is None:
					raise
				return existing_after_conflict.dataset_id

			return dataset.dataset_id
