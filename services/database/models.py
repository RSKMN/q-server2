from __future__ import annotations

from datetime import datetime
from typing import Any, List
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
	"""Base class for SQLAlchemy ORM models."""


class Dataset(Base):
	__tablename__ = "datasets"

	dataset_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
	name: Mapped[str] = mapped_column(Text, nullable=False)
	source: Mapped[str] = mapped_column(Text, nullable=False)
	version: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		nullable=False,
		server_default=func.now(),
	)

	molecules: Mapped[List["Molecule"]] = relationship(
		back_populates="dataset",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)
	experiments: Mapped[List["Experiment"]] = relationship(
		back_populates="dataset",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)


class Molecule(Base):
	__tablename__ = "molecules"
	__table_args__ = (Index("idx_molecules_dataset_id", "dataset_id"),)

	molecule_id: Mapped[str] = mapped_column(Text, primary_key=True)
	smiles: Mapped[str] = mapped_column(Text, nullable=False)
	dataset_id: Mapped[UUID] = mapped_column(
		PGUUID(as_uuid=True),
		ForeignKey("datasets.dataset_id", ondelete="CASCADE"),
		nullable=False,
	)
	molecular_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
	logp: Mapped[float | None] = mapped_column(Float, nullable=True)
	target: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		nullable=False,
		server_default=func.now(),
	)

	dataset: Mapped["Dataset"] = relationship(back_populates="molecules")
	embeddings: Mapped[List["Embedding"]] = relationship(
		back_populates="molecule",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)


class Embedding(Base):
	__tablename__ = "embeddings"
	__table_args__ = (Index("idx_embeddings_molecule_id", "molecule_id"),)

	embedding_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
	molecule_id: Mapped[str] = mapped_column(
		Text,
		ForeignKey("molecules.molecule_id", ondelete="CASCADE"),
		nullable=False,
	)
	model_name: Mapped[str] = mapped_column(Text, nullable=False)
	dimension: Mapped[int] = mapped_column(Integer, nullable=False)
	milvus_collection: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		nullable=False,
		server_default=func.now(),
	)

	molecule: Mapped["Molecule"] = relationship(back_populates="embeddings")


class Experiment(Base):
	__tablename__ = "experiments"
	__table_args__ = (Index("idx_experiments_dataset_id", "dataset_id"),)

	experiment_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
	name: Mapped[str] = mapped_column(Text, nullable=False)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	dataset_id: Mapped[UUID] = mapped_column(
		PGUUID(as_uuid=True),
		ForeignKey("datasets.dataset_id", ondelete="CASCADE"),
		nullable=False,
	)
	model_name: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		nullable=False,
		server_default=func.now(),
	)

	dataset: Mapped["Dataset"] = relationship(back_populates="experiments")
	runs: Mapped[List["ExperimentRun"]] = relationship(
		back_populates="experiment",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)


class ExperimentRun(Base):
	__tablename__ = "experiment_runs"
	__table_args__ = (Index("idx_experiment_runs_experiment_id", "experiment_id"),)

	run_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
	experiment_id: Mapped[UUID] = mapped_column(
		PGUUID(as_uuid=True),
		ForeignKey("experiments.experiment_id", ondelete="CASCADE"),
		nullable=False,
	)
	hyperparameters: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
	metrics: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
	status: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		nullable=False,
		server_default=func.now(),
	)

	experiment: Mapped["Experiment"] = relationship(back_populates="runs")
