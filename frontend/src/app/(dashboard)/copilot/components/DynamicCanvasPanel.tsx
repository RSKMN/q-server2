import MoleculeViewerCanvas from "./MoleculeViewerCanvas";
import ChartsCanvas from "./ChartsCanvas";
import ResultsTableCanvas from "./ResultsTableCanvas";

export type CanvasView = "molecule-viewer" | "charts" | "results-table";

interface DynamicCanvasPanelProps {
  view: CanvasView;
  contextLabel: string;
}

export default function DynamicCanvasPanel({ view, contextLabel }: DynamicCanvasPanelProps) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Canvas Context: {contextLabel}</p>
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
          {view === "molecule-viewer"
            ? "Molecule Viewer"
            : view === "charts"
              ? "Charts"
              : "Results Table"}
        </span>
      </div>

      <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        {view === "molecule-viewer" && <MoleculeViewerCanvas />}
        {view === "charts" && <ChartsCanvas />}
        {view === "results-table" && <ResultsTableCanvas />}
      </div>
    </div>
  );
}
