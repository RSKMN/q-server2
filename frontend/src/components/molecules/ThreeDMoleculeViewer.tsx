"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const smilesSdfCache: Record<string, string> = {};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
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

  const primarySource = selectedMoleculeOption?.source ?? source ?? null;
  const secondarySource = selectedMoleculeOption?.alternateSource ?? alternateSource ?? null;

  const activeSource =
    activeSourceSlot === "primary"
      ? primarySource
      : (secondarySource ?? primarySource);

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

        const imported3Dmol = await import("3dmol");
        const $3DmolMod = imported3Dmol.default || imported3Dmol;

        if (!containerRef.current || !alive) return;

        if (!viewerRef.current) {
          viewerRef.current = $3DmolMod.createViewer(containerRef.current, {
            backgroundColor: "white",
          });
        }

        viewerRef.current.clear();

        if (!activeSource?.value?.trim()) {
          throw new Error("No molecule source is available for rendering.");
        }

        let modelData = activeSource.value;

        if (activeSource.format === "smiles") {
          const smiles = activeSource.value.trim();
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
    if (!primarySource || !secondarySource) {
      return false;
    }
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
        "flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300",
        className,
      )}
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <h3 className="viz-title text-base tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h3>
          <p className="viz-subtitle mt-1 text-sm leading-6" style={{ color: "var(--muted-text)" }}>
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {moleculeOptions?.length ? (
            <label className="text-xs" style={{ color: "var(--muted-text)" }}>
              <span className="sr-only">Select molecule</span>
              <select
                value={selectedMoleculeOption?.id ?? ""}
                onChange={(event) => handleMoleculeSelect(event.target.value)}
                className="h-9 rounded-lg border px-3 text-sm focus:outline-none"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
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
            <div className="flex items-center rounded-lg border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)" }}>
              <button
                type="button"
                onClick={() => setActiveSourceSlot("primary")}
                className={joinClasses(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSourceSlot === "primary"
                    ? "shadow-sm"
                    : "",
                )}
                style={{
                  backgroundColor: activeSourceSlot === "primary" ? "var(--accent)" : "transparent",
                  color: activeSourceSlot === "primary" ? "var(--bg)" : "var(--muted-text)",
                }}
              >
                {primarySource.label ?? primarySource.format.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceSlot("alternate")}
                className={joinClasses(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSourceSlot === "alternate"
                    ? "shadow-sm"
                    : "",
                )}
                style={{
                  backgroundColor: activeSourceSlot === "alternate" ? "var(--accent)" : "transparent",
                  color: activeSourceSlot === "alternate" ? "var(--bg)" : "var(--muted-text)",
                }}
              >
                {secondarySource.label ?? secondarySource.format.toUpperCase()}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="viz-glow-soft relative min-h-[320px] overflow-hidden rounded-xl border transition-all duration-300" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)" }}>
          <div ref={containerRef} className="absolute inset-0" />

          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]" style={{ backgroundColor: "rgba(255,255,255,0.8)" }}>
              <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center" style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
              <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
            </div>
          ) : null}

          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--muted-text)" }}>
            {isReady ? "Interactive 3Dmol view" : "Rendering"}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-text)" }}>
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
                    ? ""
                    : "",
                )}
                style={{
                  borderColor: representation === mode ? "var(--accent)" : "var(--border)",
                  backgroundColor: representation === mode ? "var(--accent)" : "var(--card)",
                  color: representation === mode ? "var(--bg)" : "var(--text)",
                }}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {showSurfaceControl ? (
            <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Surface
              <input
                type="checkbox"
                checked={surfaceEnabled}
                onChange={(event) => setSurfaceEnabled(event.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: "var(--accent)" }}
              />
            </label>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => handleRotate("y", -12)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Rotate Left
            </button>
            <button type="button" onClick={() => handleRotate("y", 12)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Rotate Right
            </button>
            <button type="button" onClick={() => handleRotate("x", -12)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Tilt Down
            </button>
            <button type="button" onClick={() => handleRotate("x", 12)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Tilt Up
            </button>
            <button type="button" onClick={() => handleZoom(1.15)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Zoom In
            </button>
            <button type="button" onClick={() => handleZoom(0.85)} className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--text)" }}>
              Zoom Out
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border px-3 py-2 text-xs font-semibold transition"
            style={{ borderColor: "var(--accent-border)", backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            Reset View
          </button>

          <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--muted-text)" }}>
            Drag to rotate, scroll or pinch to zoom, and use the buttons for quick view changes.
          </div>
        </div>
      </div>
    </section>
  );
}