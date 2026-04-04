"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MOCK_PDB = `HEADER    MOCK LIGAND
ATOM      1  C1  MOL A   1       0.000   0.000   0.000  1.00  0.00           C
ATOM      2  O1  MOL A   1       1.230   0.000   0.000  1.00  0.00           O
ATOM      3  C2  MOL A   1      -0.620   1.080   0.000  1.00  0.00           C
ATOM      4  N1  MOL A   1      -1.230  -0.930   0.000  1.00  0.00           N
ATOM      5  H1  MOL A   1      -1.950  -1.100   0.780  1.00  0.00           H
END`;

const DEFAULT_SMILES = "CC(=O)Oc1ccccc1C(=O)O";

const smilesSdfCache: Record<string, string> = {};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function buildFallbackSource(format: "smiles" | "pdb") {
  return format === "pdb"
    ? { format: "pdb" as const, value: MOCK_PDB, label: "Mock PDB" }
    : { format: "smiles" as const, value: DEFAULT_SMILES, label: "Mock SMILES" };
}

export interface ThreeDMoleculeViewerSource {
  format: "smiles" | "pdb" | "sdf";
  value: string;
  label?: string;
}

export interface ThreeDMoleculeViewerMoleculeOption {
  id: string;
  label: string;
  source: ThreeDMoleculeViewerSource;
  alternateSource?: ThreeDMoleculeViewerSource;
}

export interface ThreeDMoleculeViewerProps {
  source?: ThreeDMoleculeViewerSource;
  alternateSource?: ThreeDMoleculeViewerSource;
  moleculeOptions?: ThreeDMoleculeViewerMoleculeOption[];
  selectedMoleculeId?: string;
  onMoleculeSelect?: (moleculeId: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  initialRepresentation?: "stick" | "sphere" | "cartoon";
  showSurfaceControl?: boolean;
}

type ViewerRepresentation = "stick" | "sphere" | "cartoon";

export default function ThreeDMoleculeViewer({
  source,
  alternateSource,
  moleculeOptions,
  selectedMoleculeId,
  onMoleculeSelect,
  title = "3D Molecule Viewer",
  subtitle = "Interactive structure viewer powered by 3Dmol.js.",
  className,
  initialRepresentation = "stick",
  showSurfaceControl = true,
}: ThreeDMoleculeViewerProps) {
  const [internalSelectedId, setInternalSelectedId] = useState(moleculeOptions?.[0]?.id ?? "");
  const [activeSourceSlot, setActiveSourceSlot] = useState<"primary" | "alternate">("primary");
  const [representation, setRepresentation] = useState<ViewerRepresentation>(initialRepresentation);
  const [surfaceEnabled, setSurfaceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const defaultViewRef = useRef<number[] | null>(null);

  const activeMoleculeId = selectedMoleculeId ?? internalSelectedId;

  const selectedMoleculeOption = useMemo(() => {
    if (!moleculeOptions?.length) {
      return null;
    }

    return (
      moleculeOptions.find((option) => option.id === activeMoleculeId) ??
      moleculeOptions[0]
    );
  }, [activeMoleculeId, moleculeOptions]);

  const primarySource =
    selectedMoleculeOption?.source ?? source ?? buildFallbackSource("pdb");
  const secondarySource =
    selectedMoleculeOption?.alternateSource ??
    alternateSource ??
    (primarySource.format === "smiles"
      ? buildFallbackSource("pdb")
      : buildFallbackSource("smiles"));

  const activeSource =
    activeSourceSlot === "primary" ? primarySource : secondarySource;

  useEffect(() => {
    if (!moleculeOptions?.length) return;

    if (!selectedMoleculeId) {
      setInternalSelectedId((current) => current || moleculeOptions[0].id);
    }
  }, [moleculeOptions, selectedMoleculeId]);

  useEffect(() => {
    setActiveSourceSlot("primary");
  }, [primarySource.format, primarySource.label, primarySource.value]);

  useEffect(() => {
    let alive = true;

    async function renderStructure() {
      try {
        setIsLoading(true);
        setError(null);
        setIsReady(false);

        // @ts-expect-error 3Dmol.js has no official TypeScript types here.
        const imported3Dmol = await import("3dmol");
        const $3DmolMod = imported3Dmol.default || imported3Dmol;

        if (!containerRef.current || !alive) return;

        if (!viewerRef.current) {
          viewerRef.current = $3DmolMod.createViewer(containerRef.current, {
            backgroundColor: "white",
          });
        }

        viewerRef.current.clear();

        let modelData = activeSource.value;

        if (activeSource.format === "smiles") {
          const smiles = activeSource.value.trim() || DEFAULT_SMILES;
          if (smilesSdfCache[smiles]) {
            modelData = smilesSdfCache[smiles];
          } else {
            const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/record/SDF/?record_type=3d`;
            let response = await fetch(url3d);

            if (!response.ok) {
              const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/record/SDF/?record_type=2d`;
              response = await fetch(url2d);
            }

            if (!response.ok) {
              throw new Error("Unable to resolve SMILES to a 3D structure.");
            }

            modelData = await response.text();
            smilesSdfCache[smiles] = modelData;
          }
        }

        if (!modelData) {
          throw new Error("No molecular structure data available.");
        }

        const format = activeSource.format === "smiles" ? "sdf" : activeSource.format;
        viewerRef.current.addModel(modelData, format);

        if (representation === "sphere") {
          viewerRef.current.setStyle({}, { sphere: { scale: 0.32 } });
        } else if (representation === "cartoon") {
          viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
        } else {
          viewerRef.current.setStyle({}, { stick: { radius: 0.16 } });
        }

        if (surfaceEnabled && showSurfaceControl) {
          viewerRef.current.addSurface(
            $3DmolMod.SurfaceType.VDW,
            { opacity: 0.85, color: "white" },
            { hetflag: false },
          );
        }

        viewerRef.current.zoomTo();
        viewerRef.current.render();
        defaultViewRef.current = viewerRef.current.getView();
        setIsReady(true);
      } catch (cause) {
        if (!alive) return;

        setError(cause instanceof Error ? cause.message : "Failed to render molecule.");
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    renderStructure();

    return () => {
      alive = false;
      if (viewerRef.current) {
        viewerRef.current.clear();
      }
      setIsReady(false);
    };
  }, [activeSource.format, activeSource.value, representation, showSurfaceControl, surfaceEnabled]);

  useEffect(() => {
    if (!isReady) return;

    const handleResize = () => {
      viewerRef.current?.resize?.();
      viewerRef.current?.render?.();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady]);

  const handleRotate = (axis: "x" | "y" | "z", amount: number) => {
    if (!viewerRef.current) return;

    viewerRef.current.rotate(amount, axis);
    viewerRef.current.render();
  };

  const handleZoom = (factor: number) => {
    if (!viewerRef.current) return;

    viewerRef.current.zoom(factor);
    viewerRef.current.render();
  };

  const handleReset = () => {
    if (!viewerRef.current) return;

    if (defaultViewRef.current) {
      viewerRef.current.setView(defaultViewRef.current);
    } else {
      viewerRef.current.zoomTo();
    }

    viewerRef.current.render();
  };

  const showSourceToggle = useMemo(() => {
    return (
      primarySource.format !== secondarySource.format ||
      primarySource.value !== secondarySource.value
    );
  }, [primarySource, secondarySource]);

  const handleMoleculeSelect = (moleculeId: string) => {
    setInternalSelectedId(moleculeId);
    onMoleculeSelect?.(moleculeId);
  };

  return (
    <section
      className={joinClasses(
        "flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-[#1e293b] dark:bg-[#0b0f19]",
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-[#1e293b] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="viz-title text-base tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="viz-subtitle mt-1 text-sm leading-6 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {moleculeOptions?.length ? (
            <label className="text-xs text-slate-500 dark:text-slate-400">
              <span className="sr-only">Select molecule</span>
              <select
                value={selectedMoleculeOption?.id ?? ""}
                onChange={(event) => handleMoleculeSelect(event.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-[#1e293b] dark:bg-[#020617] dark:text-slate-200"
              >
                {moleculeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showSourceToggle ? (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-[#1e293b] dark:bg-[#020617]">
              <button
                type="button"
                onClick={() => setActiveSourceSlot("primary")}
                className={joinClasses(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSourceSlot === "primary"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                {primarySource.label ?? primarySource.format.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceSlot("alternate")}
                className={joinClasses(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSourceSlot === "alternate"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                {secondarySource.label ?? secondarySource.format.toUpperCase()}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="viz-glow-soft relative min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all duration-300 dark:border-[#1e293b] dark:bg-[#020617]">
          <div ref={containerRef} className="absolute inset-0" />

          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px] dark:bg-slate-950/80">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 px-6 text-center dark:bg-slate-950/90">
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          ) : null}

          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 shadow-sm dark:border-[#1e293b] dark:bg-slate-950/90 dark:text-slate-400">
            {isReady ? "Interactive 3Dmol view" : "Rendering"}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-[#1e293b] dark:bg-[#020617]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Controls
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(["stick", "sphere", "cartoon"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRepresentation(mode)}
                className={joinClasses(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                  representation === mode
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {showSurfaceControl ? (
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200">
              Surface
              <input
                type="checkbox"
                checked={surfaceEnabled}
                onChange={(event) => setSurfaceEnabled(event.target.checked)}
                className="h-4 w-4 accent-cyan-500"
              />
            </label>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => handleRotate("y", -12)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Rotate Left
            </button>
            <button type="button" onClick={() => handleRotate("y", 12)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Rotate Right
            </button>
            <button type="button" onClick={() => handleRotate("x", -12)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Tilt Down
            </button>
            <button type="button" onClick={() => handleRotate("x", 12)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Tilt Up
            </button>
            <button type="button" onClick={() => handleZoom(1.15)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Zoom In
            </button>
            <button type="button" onClick={() => handleZoom(0.85)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-100 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              Zoom Out
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-200 dark:hover:bg-cyan-900/40"
          >
            Reset View
          </button>

          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500 dark:border-[#1e293b] dark:bg-slate-950 dark:text-slate-400">
            Drag to rotate, scroll or pinch to zoom, and use the buttons for quick view changes.
          </div>
        </div>
      </div>
    </section>
  );
}