-- Research Lab backend schema

CREATE TABLE IF NOT EXISTS datasets (
	dataset_id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	source TEXT NOT NULL,
	version TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS molecules (
	molecule_id TEXT PRIMARY KEY,
	smiles TEXT NOT NULL,
	dataset_id UUID NOT NULL,
	molecular_weight DOUBLE PRECISION,
	logp DOUBLE PRECISION,
	target TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_molecules_dataset
		FOREIGN KEY (dataset_id)
		REFERENCES datasets (dataset_id)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS embeddings (
	embedding_id UUID PRIMARY KEY,
	molecule_id TEXT NOT NULL,
	model_name TEXT NOT NULL,
	dimension INT NOT NULL,
	milvus_collection TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_embeddings_molecule
		FOREIGN KEY (molecule_id)
		REFERENCES molecules (molecule_id)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experiments (
	experiment_id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	dataset_id UUID NOT NULL,
	model_name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_experiments_dataset
		FOREIGN KEY (dataset_id)
		REFERENCES datasets (dataset_id)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experiment_runs (
	run_id UUID PRIMARY KEY,
	experiment_id UUID NOT NULL,
	hyperparameters JSONB,
	metrics JSONB,
	status TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_experiment_runs_experiment
		FOREIGN KEY (experiment_id)
		REFERENCES experiments (experiment_id)
		ON DELETE CASCADE
);

-- Requested indexes
CREATE INDEX IF NOT EXISTS idx_molecules_dataset_id ON molecules (dataset_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_molecule_id ON embeddings (molecule_id);
CREATE INDEX IF NOT EXISTS idx_experiments_dataset_id ON experiments (dataset_id);
CREATE INDEX IF NOT EXISTS idx_experiment_runs_experiment_id ON experiment_runs (experiment_id);
