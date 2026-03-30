"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCandidateProfiles,
  getRankedCandidates,
  getResultArtifacts,
  getResultsOverview,
} from "@/services/api";
import type {
  CandidateProfilesResponse,
  RankedCandidatesResponse,
  ResultArtifactsResponse,
  ResultsOverview,
} from "@/types/api";

function formatValue(value: string | number | undefined): string {
  if (value === undefined) return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(4);
  }
  return value;
}

export default function ResultsPage() {
  const [source, setSource] = useState<"existing" | "generated">("existing");
  const [overview, setOverview] = useState<ResultsOverview | null>(null);
  const [ranked, setRanked] = useState<RankedCandidatesResponse | null>(null);
  const [profiles, setProfiles] = useState<CandidateProfilesResponse | null>(null);
  const [artifacts, setArtifacts] = useState<ResultArtifactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        setLoading(true);
        setError(null);

        const [overviewData, rankedData, profilesData, artifactsData] = await Promise.all([
          getResultsOverview(),
          getRankedCandidates(source, 20),
          getCandidateProfiles(20),
          getResultArtifacts(60),
        ]);

        if (!active) return;
        setOverview(overviewData);
        setRanked(rankedData);
        setProfiles(profilesData);
        setArtifacts(artifactsData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadResults();
    return () => {
      active = false;
    };
  }, [source]);

  const rankedColumns = useMemo(() => {
    if (!ranked?.items.length) return [] as string[];
    return Object.keys(ranked.items[0]);
  }, [ranked]);

  const profileColumns = useMemo(() => {
    if (!profiles?.items.length) return [] as string[];
    return Object.keys(profiles.items[0]);
  }, [profiles]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Results Showcase
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consolidated outputs from ranking, QM, MD, and docking pipelines.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Candidate source
          <select
            value={source}
            onChange={(event) =>
              setSource(event.target.value as "existing" | "generated")
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="existing">Existing candidates</option>
            <option value="generated">Generated candidates</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-slate-200 skeleton-shimmer" />
          ))}
        </div>
      ) : null}

      {overview ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(overview.counts).map(([key, value]) => (
            <article
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {key.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {value}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {ranked ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Ranked Candidates ({ranked.count})
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source: {ranked.file}</p>

          <div className="mt-3 overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  {rankedColumns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.items.map((item, index) => (
                  <tr key={index} className="odd:bg-slate-50/60 dark:odd:bg-slate-700/20">
                    {rankedColumns.map((column) => (
                      <td
                        key={`${index}-${column}`}
                        className="border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        {formatValue(item[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {profiles ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cross-Pipeline Candidate Profiles ({profiles.count})
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Merged QM, MD stability, and RMSD summaries by candidate and target.
          </p>

          <div className="mt-3 overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  {profileColumns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.items.map((item, index) => (
                  <tr key={index} className="odd:bg-slate-50/60 dark:odd:bg-slate-700/20">
                    {profileColumns.map((column) => (
                      <td
                        key={`${index}-${column}`}
                        className="border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        {formatValue(item[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {artifacts ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Available Artifacts ({artifacts.count})
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {artifacts.items.map((artifact) => (
              <article
                key={artifact.path}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {artifact.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {artifact.path}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {artifact.size_bytes.toLocaleString()} bytes
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}