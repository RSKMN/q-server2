"use client";

import { useMemo, useState } from "react";
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
  type EmbeddingPointWithSmiles = EmbeddingPoint & { smiles?: string };
  const [hoveredPoint, setHoveredPoint] = useState<EmbeddingPoint | null>(null);

  const resolvePointFromCustomdata = (customdata: unknown): EmbeddingPoint | null => {
    if (!Array.isArray(customdata) || customdata.length < 2) {
      return null;
    }

    const smilesDatum = customdata[0];
    const qedDatum = customdata[1];

    const smiles = typeof smilesDatum === "string" ? smilesDatum : "";
    const qed =
      typeof qedDatum === "number"
        ? qedDatum
        : typeof qedDatum === "string"
          ? Number(qedDatum)
          : Number.NaN;

    if (Number.isNaN(qed)) {
      return null;
    }

    return (
      data.find(
        (point) =>
          ((point as EmbeddingPointWithSmiles).smiles ?? "") === smiles &&
          point.qed === qed
      ) ?? null
    );
  };

  const traces = useMemo<PlotParams["data"]>(() => {
    if (colorMode === "qed") {
      return [
        {
          type: "scattergl",
          mode: "markers",
          name: "Molecules",
          x: data.map((point) => point.x),
          y: data.map((point) => point.y),
          ids: data.map((point) => point.molecule_id),
          customdata: data.map((d) => [
            (d as EmbeddingPointWithSmiles).smiles ?? "",
            d.qed,
          ]),
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
          hovertemplate: "SMILES: %{customdata[0]}<br>QED: %{customdata[1]}<extra></extra>",
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
        customdata: datasetPoints.map((d) => [
          (d as EmbeddingPointWithSmiles).smiles ?? "",
          d.qed,
        ]),
        marker: {
          size: 8,
          opacity: 0.78,
          color: colorMap.get(dataset) ?? "#3b82f6",
        },
        hovertemplate: "SMILES: %{customdata[0]}<br>QED: %{customdata[1]}<extra></extra>",
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
    <div className="h-full min-h-[420px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="h-full min-h-[460px]">
        <Plot
          data={traces}
          layout={layout}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
          config={{ displaylogo: false, responsive: true }}
          onHover={(event) => {
            const hovered = event.points?.[0];
            if (!hovered) {
              setHoveredPoint(null);
              return;
            }
            const point = resolvePointFromCustomdata(hovered.customdata);
            setHoveredPoint(point);
          }}
          onUnhover={() => setHoveredPoint(null)}
          onClick={(event) => {
            if (!onPointClick) return;
            const clicked = event.points?.[0];
            if (!clicked) return;

            const target = resolvePointFromCustomdata(clicked.customdata);
            if (target) {
              onPointClick(target);
            }
          }}
        />
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