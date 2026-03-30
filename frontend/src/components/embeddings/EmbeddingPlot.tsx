"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { EmbeddingPoint } from "@/types/api";

type ColorMode = "dataset" | "qed";

interface EmbeddingPlotProps {
  data: EmbeddingPoint[];
  colorMode: ColorMode;
  onPointClick?: (point: EmbeddingPoint) => void;
}

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as React.ComponentType<PlotParams>;

const DATASET_COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#db2777", "#0ea5e9"];

function getDatasetColorMap(datasets: string[]): Map<string, string> {
  return new Map(
    datasets.map((dataset, index) => [
      dataset,
      DATASET_COLORS[index % DATASET_COLORS.length],
    ])
  );
}

export default function EmbeddingPlot({
  data,
  colorMode,
  onPointClick,
}: EmbeddingPlotProps) {
  type PlotCustomData = [string, string, number, number];
  const parseCustomData = (value: unknown): PlotCustomData | undefined => {
    if (!Array.isArray(value) || value.length < 4) return undefined;
    const [id, dataset, qed, mw] = value;
    if (
      typeof id === "string" &&
      typeof dataset === "string" &&
      typeof qed === "number" &&
      typeof mw === "number"
    ) {
      return [id, dataset, qed, mw];
    }
    return undefined;
  };

  const [hoveredPoint, setHoveredPoint] = useState<EmbeddingPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pointById = useMemo(() => {
    return new Map(data.map((point) => [point.molecule_id, point]));
  }, [data]);

  const traces = useMemo<PlotParams["data"]>(() => {
    const toCustomData = (point: EmbeddingPoint): PlotCustomData => [
      point.molecule_id,
      point.dataset,
      point.qed,
      point.mw,
    ];

    if (colorMode === "qed") {
      return [
        {
          type: "scattergl",
          mode: "markers",
          name: "Molecules",
          x: data.map((point) => point.x),
          y: data.map((point) => point.y),
          ids: data.map((point) => point.molecule_id),
          customdata: data.map(toCustomData),
          marker: {
            size: 8,
            opacity: 0.82,
            color: data.map((point) => point.qed),
            colorscale: "Viridis",
            cmin: 0,
            cmax: 1,
            colorbar: {
              title: {
                text: "QED",
              },
              thickness: 12,
            },
          },
          hovertemplate:
            "<b>%{customdata[0]}</b><br>Dataset: %{customdata[1]}<br>QED: %{customdata[2]:.2f}<br>MW: %{customdata[3]:.1f}<extra></extra>",
        },
      ];
    }

    const datasets = Array.from(new Set(data.map((point) => point.dataset))).sort();
    const colorMap = getDatasetColorMap(datasets);

    return datasets.map((dataset) => {
      const datasetPoints = data.filter((point) => point.dataset === dataset);
      return {
        type: "scattergl",
        mode: "markers",
        name: dataset,
        x: datasetPoints.map((point) => point.x),
        y: datasetPoints.map((point) => point.y),
        ids: datasetPoints.map((point) => point.molecule_id),
        customdata: datasetPoints.map(toCustomData),
        marker: {
          size: 8,
          opacity: 0.78,
          color: colorMap.get(dataset) ?? "#3b82f6",
        },
        hovertemplate:
          "<b>%{customdata[0]}</b><br>Dataset: %{customdata[1]}<br>QED: %{customdata[2]:.2f}<br>MW: %{customdata[3]:.1f}<extra></extra>",
      };
    });
  }, [colorMode, data]);

  const layout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      autosize: true,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { t: 20, r: 20, b: 40, l: 48 },
      xaxis: {
        title: { text: "UMAP 1" },
        showgrid: true,
        gridcolor: "#e2e8f0",
        zerolinecolor: "#cbd5e1",
      },
      yaxis: {
        title: { text: "UMAP 2" },
        showgrid: true,
        gridcolor: "#e2e8f0",
        zerolinecolor: "#cbd5e1",
      },
      hovermode: "closest",
      dragmode: "pan",
      showlegend: colorMode === "dataset",
      legend: {
        orientation: "h",
        yanchor: "bottom",
        y: 1.01,
        xanchor: "right",
        x: 1,
      },
    }),
    [colorMode]
  );

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="h-full min-h-[460px]">
        <Plot
          data={traces}
          layout={layout}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
          config={{ displaylogo: false, responsive: true }}
          onHover={(event) => {
            const hovered = event.points?.[0];
            const customData = parseCustomData(hovered?.customdata);
            const hoverId = customData?.[0] ?? null;
            const point = hoverId ? pointById.get(hoverId) ?? null : null;
            setHoveredPoint(point);
            const rect = containerRef.current?.getBoundingClientRect();
            const clientX = event.event?.clientX ?? 0;
            const clientY = event.event?.clientY ?? 0;
            if (rect) {
              setHoverCoords({
                x: Math.max(10, Math.min(clientX - rect.left + 14, rect.width - 230)),
                y: Math.max(10, Math.min(clientY - rect.top + 14, rect.height - 130)),
              });
            }
          }}
          onUnhover={() => {
            setHoveredPoint(null);
            setHoverCoords(null);
          }}
          onClick={(event) => {
            if (!onPointClick) return;
            const clicked = event.points?.[0];
            if (!clicked) return;

            const customData = parseCustomData(clicked.customdata);
            const targetId = customData?.[0] ?? null;

            const target = targetId ? pointById.get(targetId) ?? null : null;
            if (target) {
              onPointClick(target);
            }
          }}
        />
      </div>

      <div
        className={`pointer-events-none absolute z-20 w-52 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm transition-all duration-150 ${
          hoveredPoint && hoverCoords ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
        style={{
          left: hoverCoords?.x ?? 10,
          top: hoverCoords?.y ?? 10,
        }}
      >
        {hoveredPoint ? (
          <>
            <p className="text-[11px] font-semibold tracking-wide text-slate-500">MOLECULE PREVIEW</p>
            <p className="mt-1 font-mono text-xs font-semibold text-slate-900">{hoveredPoint.molecule_id}</p>
            <p className="mt-0.5 text-xs text-slate-600">{hoveredPoint.dataset}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">MW {hoveredPoint.mw.toFixed(1)}</div>
              <div className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">QED {hoveredPoint.qed.toFixed(2)}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {hoveredPoint ? (
          <span>
            Hover: <strong>{hoveredPoint.molecule_id}</strong> | MW {hoveredPoint.mw.toFixed(1)} | QED {hoveredPoint.qed.toFixed(2)}
          </span>
        ) : (
          <span>Hover a point to preview MW and QED. Click a point to load it in the molecule viewer.</span>
        )}
      </div>
    </div>
  );
}