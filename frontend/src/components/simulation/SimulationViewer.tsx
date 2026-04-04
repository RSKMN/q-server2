"use client";

import { useEffect, useMemo, useState } from "react";

export interface SimulationFrame {
  molecule_id: string;
  time: number;
  rmsd: number;
}

interface SimulationViewerProps {
  moleculeId: string;
  frames: SimulationFrame[];
  isLoading?: boolean;
}

const WIDTH = 760;
const HEIGHT = 300;
const MARGIN = { top: 18, right: 18, bottom: 34, left: 42 };

function formatRmsd(value: number) {
  return `${value.toFixed(2)} Å`;
}

function statusFromFrames(values: number[]) {
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const peak = Math.max(...values);

  if (avg < 1.8 && peak < 2.2) return { label: "Stable", className: "border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-500/15 dark:text-emerald-100" };
  if (avg < 2.2 && peak < 2.8) return { label: "Moderate", className: "border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-300/40 dark:bg-amber-500/15 dark:text-amber-100" };
  return { label: "Unstable", className: "border-rose-300/70 bg-rose-100 text-rose-800 dark:border-rose-300/40 dark:bg-rose-500/15 dark:text-rose-100" };
}

export default function SimulationViewer({ moleculeId, frames, isLoading = false }: SimulationViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sortedFrames = useMemo(
    () => frames.slice().sort((a, b) => a.time - b.time),
    [frames],
  );

  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
  }, [moleculeId]);

  useEffect(() => {
    if (!isPlaying || sortedFrames.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= sortedFrames.length - 1) {
          return 0;
        }
        return current + 1;
      });
    }, 550);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, sortedFrames.length]);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_280px]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
          <div className="h-4 w-36 rounded-md bg-white/10 skeleton-shimmer" />
          <div className="mt-2 h-3 w-56 rounded-md bg-white/10 skeleton-shimmer" />
          <div className="mt-4 h-[320px] rounded-xl bg-white/10 skeleton-shimmer" />
          <div className="mt-3 h-2 w-full rounded-md bg-white/10 skeleton-shimmer" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
            <div className="h-4 w-44 rounded-md bg-white/10 skeleton-shimmer" />
            <div className="mt-3 h-[180px] rounded-xl bg-white/10 skeleton-shimmer" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
            <div className="h-4 w-32 rounded-md bg-white/10 skeleton-shimmer" />
            <div className="mt-3 h-3 w-40 rounded-md bg-white/10 skeleton-shimmer" />
            <div className="mt-2 h-3 w-48 rounded-md bg-white/10 skeleton-shimmer" />
            <div className="mt-2 h-3 w-44 rounded-md bg-white/10 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!sortedFrames.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-400">
        No simulation trajectory available for this molecule.
      </div>
    );
  }

  const times = sortedFrames.map((frame) => frame.time);
  const values = sortedFrames.map((frame) => frame.rmsd);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.max(0, Math.min(...values) - 0.15);
  const maxValue = Math.max(...values) + 0.2;
  const timeSpan = Math.max(1, maxTime - minTime);
  const valueSpan = Math.max(0.001, maxValue - minValue);
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const points = sortedFrames.map((frame) => {
    const x = MARGIN.left + ((frame.time - minTime) / timeSpan) * plotWidth;
    const y = MARGIN.top + (1 - (frame.rmsd - minValue) / valueSpan) * plotHeight;
    return { ...frame, x, y };
  });

  const activePoint = points[Math.min(activeIndex, points.length - 1)];
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const peak = Math.max(...values);
  const stability = statusFromFrames(values);

  return (
    <div className="grid gap-5 transition-opacity duration-300 ease-out lg:grid-cols-[minmax(0,1.6fr)_280px]">
      <div className="viz-surface rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="viz-title text-sm text-slate-900 dark:text-slate-100">RMSD vs Time</p>
            <p className="viz-subtitle mt-1 text-xs">
              {moleculeId} | Frame {activeIndex + 1}/{points.length} | Time {activePoint.time} ns
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-cyan-300/60 bg-cyan-100 px-4 text-xs font-semibold text-cyan-800 transition-all duration-200 hover:-translate-y-[1px] hover:bg-cyan-200 dark:border-cyan-300/40 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/80">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[320px] w-full">
            <defs>
              <linearGradient id="simulationFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(34 197 94 / 0.20)" />
                <stop offset="100%" stopColor="rgb(34 197 94 / 0.03)" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1, 1.5, 2, 2.5].map((gridValue) => {
              const y =
                MARGIN.top +
                (1 - (gridValue - minValue) / valueSpan) *
                  (HEIGHT - MARGIN.top - MARGIN.bottom);
              return (
                <g key={gridValue}>
                  <line
                    x1={MARGIN.left}
                    x2={WIDTH - MARGIN.right}
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.14)"
                    strokeDasharray="4 6"
                  />
                  <text x={10} y={y + 4} fill="rgba(71,85,105,0.7)" fontSize="11">
                    {gridValue.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <polyline
              fill="url(#simulationFill)"
              stroke="rgba(34,197,94,0.0)"
              strokeWidth="0"
              points={`${path} ${WIDTH - MARGIN.right},${HEIGHT - MARGIN.bottom} ${MARGIN.left},${HEIGHT - MARGIN.bottom}`}
            />

            <polyline
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={path}
            />

            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              stroke="rgb(34 211 238 / 0.85)"
              strokeDasharray="4 4"
            />

            {points.map((point, index) => {
              const active = index === activeIndex;
              return (
                <circle
                  key={`${point.time}-${point.rmsd}`}
                  cx={point.x}
                  cy={point.y}
                  r={active ? "6" : "4"}
                  fill={active ? "rgb(34 211 238)" : "rgb(34 197 94)"}
                />
              );
            })}

            <line
              x1={MARGIN.left}
              x2={MARGIN.left}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              stroke="rgba(148,163,184,0.22)"
            />
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={HEIGHT - MARGIN.bottom}
              y2={HEIGHT - MARGIN.bottom}
              stroke="rgba(148,163,184,0.22)"
            />
          </svg>
        </div>

        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={activeIndex}
          onChange={(event) => {
            setIsPlaying(false);
            setActiveIndex(Number(event.target.value));
          }}
          className="mt-3 w-full accent-cyan-400"
        />
      </div>

      <div className="space-y-4">
        <div className="viz-surface rounded-2xl p-4">
          <p className="viz-subtitle text-[11px] font-semibold uppercase tracking-[0.14em]">
            Trajectory Viewer (Coming Soon)
          </p>
          <div className="mt-3 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-cyan-400/35 bg-slate-900/70 px-4 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Molecular trajectory animation placeholder
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                This area is reserved for 3D trajectory playback and will be synchronized
                with RMSD frame selection and play/pause controls in a future integration.
              </p>
            </div>
          </div>
        </div>

        <div className="viz-surface rounded-2xl p-4">
          <p className="viz-subtitle text-[11px] font-semibold uppercase tracking-[0.14em]">
            Stability status
          </p>
          <span
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${stability.className}`}
          >
            {stability.label}
          </span>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Average RMSD</dt>
              <dd className="text-slate-700 dark:text-slate-100">{formatRmsd(average)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Peak RMSD</dt>
              <dd className="text-slate-700 dark:text-slate-100">{formatRmsd(peak)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Current RMSD</dt>
              <dd className="text-slate-700 dark:text-slate-100">{formatRmsd(activePoint.rmsd)}</dd>
            </div>
          </dl>
        </div>

        <div className="viz-surface rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-300">
          Frame playback helps inspect transient drift phases and compare short-term fluctuations against global trajectory stability.
        </div>
      </div>
    </div>
  );
}
