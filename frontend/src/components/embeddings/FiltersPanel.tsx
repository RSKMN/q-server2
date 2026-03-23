"use client";

type ColorMode = "dataset" | "qed";

interface FiltersPanelProps {
  datasets: string[];
  selectedDataset: string;
  onDatasetChange: (dataset: string) => void;
  qedMin: number;
  qedMax: number;
  onQedRangeChange: (min: number, max: number) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

export default function FiltersPanel({
  datasets,
  selectedDataset,
  onDatasetChange,
  qedMin,
  qedMax,
  onQedRangeChange,
  colorMode,
  onColorModeChange,
}: FiltersPanelProps) {
  const handleMinChange = (value: number) => {
    const clamped = Math.min(value, qedMax);
    onQedRangeChange(clamped, qedMax);
  };

  const handleMaxChange = (value: number) => {
    const clamped = Math.max(value, qedMin);
    onQedRangeChange(qedMin, clamped);
  };

  const resetFilters = () => {
    onDatasetChange("All");
    onQedRangeChange(0, 1);
    onColorModeChange("dataset");
  };

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        <p className="mt-0.5 text-xs text-slate-500">Refine the embedding map view</p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">Dataset</label>
        <select
          value={selectedDataset}
          onChange={(event) => onDatasetChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          <option value="All">All</option>
          {datasets.map((dataset) => (
            <option key={dataset} value={dataset}>
              {dataset}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">Color by</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onColorModeChange("dataset")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              colorMode === "dataset"
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Dataset
          </button>
          <button
            type="button"
            onClick={() => onColorModeChange("qed")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              colorMode === "qed"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            QED
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>QED range</span>
          <span>
            {qedMin.toFixed(2)} - {qedMax.toFixed(2)}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">Minimum</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={qedMin}
              onChange={(event) => handleMinChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">Maximum</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={qedMax}
              onChange={(event) => handleMaxChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        Reset filters
      </button>
    </div>
  );
}