"use client";

import { useEffect, useMemo, useState } from "react";
import EmbeddingPlot from "@/components/embeddings/EmbeddingPlot";
import FiltersPanel from "@/components/embeddings/FiltersPanel";
import { getEmbeddingMap } from "@/services/api";
import { useUiStore } from "@/store";
import type { EmbeddingPoint } from "@/types/api";

type ColorMode = "dataset" | "qed";

export default function ChemicalSpacePage() {
  const [points, setPoints] = useState<EmbeddingPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dataset, setDataset] = useState<string>("All");
  const [mwMin, setMwMin] = useState(0);
  const [mwMax, setMwMax] = useState(1000);
  const [logpMin, setLogpMin] = useState(-2);
  const [logpMax, setLogpMax] = useState(8);
  const [qedMin, setQedMin] = useState(0);
  const [qedMax, setQedMax] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>("dataset");
  const [selectedPoint, setSelectedPoint] = useState<EmbeddingPoint | null>(null);

  const setSelectedMolecule = useUiStore((state) => state.setSelectedMolecule);
  const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);

  useEffect(() => {
    let alive = true;

    async function loadEmbeddingMap() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getEmbeddingMap(undefined, 5000);
        if (!alive) return;
        setPoints(result);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load molecular embedding map.");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    loadEmbeddingMap();
    return () => { alive = false; };
  }, []);

  const filteredData = useMemo(() => {
    return points.filter((point) => {
      const matchDataset = dataset === "All" || point.dataset === dataset;
      const matchMw = point.mw >= mwMin && point.mw <= mwMax;
      const valueLogp = point.logp ?? 0;
      const matchLogp = valueLogp >= logpMin && valueLogp <= logpMax;
      const matchQed = point.qed >= qedMin && point.qed <= qedMax;
      return matchDataset && matchMw && matchLogp && matchQed;
    });
  }, [dataset, logpMax, logpMin, mwMax, mwMin, points, qedMax, qedMin]);

  const mwBounds = useMemo(() => {
    if (!points.length) return { min: 0, max: 1000 };
    const values = points.map((point) => point.mw);
    return { min: Math.floor(Math.min(...values)), max: Math.ceil(Math.max(...values)) };
  }, [points]);

  const logpBounds = useMemo(() => {
    if (!points.length) return { min: -2, max: 8 };
    const values = points
      .map((point) => point.logp)
      .filter((value): value is number => typeof value === "number");
    if (!values.length) return { min: -2, max: 8 };
    return { min: Math.floor(Math.min(...values)), max: Math.ceil(Math.max(...values)) };
  }, [points]);

  useEffect(() => {
    setMwMin(mwBounds.min);
    setMwMax(mwBounds.max);
  }, [mwBounds.max, mwBounds.min]);

  useEffect(() => {
    setLogpMin(logpBounds.min);
    setLogpMax(logpBounds.max);
  }, [logpBounds.max, logpBounds.min]);

  const availableDatasets = useMemo(() => {
    return Array.from(new Set(points.map((point) => point.dataset))).sort();
  }, [points]);

  const handlePointClick = (point: EmbeddingPoint) => {
    setSelectedPoint(point);
    setSelectedMolecule(point.molecule_id);
    setRightPanelOpen(true);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getEmbeddingMap(undefined, 5000);
      setPoints(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Map refresh failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Spatial Intelligence</p>
          <h1 className="text-3xl font-black tracking-tight text-text">Chemical Space</h1>
          <p className="text-sm font-medium text-text-secondary/70">
            Multidimensional analysis of {filteredData.length.toLocaleString()} compounds projected onto a 2D UMAP manifold.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border-2 border-border/50 bg-card px-4 py-2 text-sm font-black uppercase tracking-widest text-text transition-all hover:bg-surface-subtle disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Re-Sync Map
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border-2 border-error/20 bg-error/5 p-4 text-sm font-bold text-error flex items-center gap-3">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="lg:min-w-0">
          <FiltersPanel
            datasets={availableDatasets}
            selectedDataset={dataset}
            onDatasetChange={setDataset}
            mwMin={mwMin}
            mwMax={mwMax}
            mwBounds={mwBounds}
            onMwRangeChange={(min, max) => {
              setMwMin(min);
              setMwMax(max);
            }}
            logpMin={logpMin}
            logpMax={logpMax}
            logpBounds={logpBounds}
            onLogpRangeChange={(min, max) => {
              setLogpMin(min);
              setLogpMax(max);
            }}
            qedMin={qedMin}
            qedMax={qedMax}
            onQedRangeChange={(min, max) => {
              setQedMin(min);
              setQedMax(max);
            }}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
          />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-[500px] flex-1">
            {isLoading ? (
              <div className="ui-card-surface flex h-full items-center justify-center border-0 shadow-none bg-surface-subtle/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60">Recalculating Manifold...</p>
                </div>
              </div>
            ) : (
              <EmbeddingPlot
                data={filteredData}
                colorMode={colorMode}
                onPointClick={handlePointClick}
              />
            )}
          </div>

          {selectedPoint && (
            <div className="rounded-2xl border-2 border-primary/10 bg-primary/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm font-black text-text">
                  FOCUS: <span className="font-mono text-primary">{selectedPoint.molecule_id}</span>
                </p>
                <div className="h-4 w-px bg-border/50" />
                <p className="text-xs font-bold text-text-secondary">
                  Dataset: {selectedPoint.dataset} | QED: {selectedPoint.qed.toFixed(2)} | MW: {selectedPoint.mw.toFixed(1)}
                </p>
              </div>
              <button 
                onClick={() => setRightPanelOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Detailed Analysis
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

