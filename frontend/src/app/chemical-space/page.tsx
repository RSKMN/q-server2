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
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load embedding map data.";
        setError(message);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    loadEmbeddingMap();
    return () => {
      alive = false;
    };
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
    return {
      min: Math.floor(Math.min(...values)),
      max: Math.ceil(Math.max(...values)),
    };
  }, [points]);

  const logpBounds = useMemo(() => {
    if (!points.length) return { min: -2, max: 8 };
    const values = points
      .map((point) => point.logp)
      .filter((value): value is number => typeof value === "number");
    if (!values.length) return { min: -2, max: 8 };
    return {
      min: Math.floor(Math.min(...values)),
      max: Math.ceil(Math.max(...values)),
    };
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

  const handleQedChange = (min: number, max: number) => {
    setQedMin(min);
    setQedMax(max);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getEmbeddingMap(undefined, 5000);
      setPoints(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to refresh embedding map data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Chemical Space
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            UMAP projection of molecular embeddings ({filteredData.length} points)
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[260px_1fr]">
        <div className="lg:min-w-0">
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
            onQedRangeChange={handleQedChange}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
          />
        </div>

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <div className="h-full min-h-[420px] rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-6 w-56 rounded-md bg-slate-100 skeleton-shimmer" />
              <div className="mt-3 h-4 w-72 rounded-md bg-slate-100 skeleton-shimmer" />
              <div className="mt-6 h-[460px] rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
          ) : (
            <EmbeddingPlot
              data={filteredData}
              colorMode={colorMode}
              onPointClick={handlePointClick}
            />
          )}

          {selectedPoint && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Selected {selectedPoint.molecule_id} | Dataset {selectedPoint.dataset} | QED {selectedPoint.qed.toFixed(2)} | MW {selectedPoint.mw.toFixed(1)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
