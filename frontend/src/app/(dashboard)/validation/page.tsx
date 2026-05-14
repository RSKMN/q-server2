"use client";

import { useState } from "react";

type Metric = {
  label: string;
  value: string;
  status: "success" | "warning" | "error" | "default";
};

const VALIDATION_METRICS: Metric[] = [
  { label: "Proof Gate Status", value: "Verified", status: "success" },
  { label: "Evidence Status", value: "High Coverage", status: "success" },
  { label: "Validation Confidence", value: "0.962", status: "default" },
  { label: "Reproducibility Rate", value: "99.4%", status: "success" }
];

const MODEL_VAL_DATA = [
  { model: "Activity Predictor", auroc: 0.942, accuracy: 0.89, f1: 0.91, precision: 0.92, recall: 0.90 },
  { model: "ADMET Classifier", auroc: 0.885, accuracy: 0.84, f1: 0.86, precision: 0.85, recall: 0.87 },
  { model: "Solubility Model", auroc: 0.910, accuracy: 0.87, f1: 0.88, precision: 0.89, recall: 0.87 },
];

export default function ValidationPage() {
  const [activePanel, setActivePanel] = useState<string>("benchmarks");

  const timeline = [
    { stage: "Data Ingestion", status: "complete", date: "2024-05-10" },
    { stage: "Model Training", status: "complete", date: "2024-05-11" },
    { stage: "Virtual Screening", status: "complete", date: "2024-05-12" },
    { stage: "Docking Validation", status: "complete", date: "2024-05-13" },
    { stage: "Quantum Reranking", status: "complete", date: "2024-05-14" },
    { stage: "Expert Review", status: "in-progress", date: "2024-05-15" }
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-kicker">Scientific Integrity & Audit</div>
        <h1 className="page-title">Validation & Research Evidence</h1>
        <p className="page-subtitle">
          A comprehensive audit trail of computational workflows, benchmarking results, and reproducibility metrics ensuring the scientific credibility of prioritized leads.
        </p>
      </header>

      {/* Validation Overview Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VALIDATION_METRICS.map((m) => (
          <div key={m.label} className="ui-card-surface p-6">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{m.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                m.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {m.status === 'success' ? 'Passed' : 'Calculated'}
              </span>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Benchmark Summary */}
          <section className="ui-card-surface overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Computational Benchmarking Summary</h3>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">Scaffold Split</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">v3.2.1</span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Docking Pose Recovery (RMSD &lt; 2.0Å)</span>
                    <span className="text-emerald-400 font-bold">88.2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "88.2%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Reference Inhibitor Rediscovery</span>
                    <span className="text-cyan-400 font-bold">Top 1%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: "95%" }} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Benchmark Datasets</div>
                  <p className="text-xs text-slate-300">DUD-E, CASF-2016, LIT-PCBA, Internal Kinase Panel v4</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">ADMET Benchmarks</div>
                  <p className="text-xs text-slate-300">Tox21 Challenge, ClinTox, SIDER v2.1</p>
                </div>
              </div>
            </div>
          </section>

          {/* Model Validation Table */}
          <section className="ui-card-surface overflow-hidden">
             <div className="p-6 border-b border-white/5">
              <h3 className="font-bold">ML Model Performance Metrics</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="px-6 py-4">Model Pipeline</th>
                  <th className="px-6 py-4">AUROC</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">F1 Score</th>
                  <th className="px-6 py-4">Precision</th>
                  <th className="px-6 py-4">Recall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MODEL_VAL_DATA.map((row) => (
                  <tr key={row.model} className="hover:bg-white/5 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-slate-200">{row.model}</td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{row.auroc.toFixed(3)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{row.accuracy.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{row.f1.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{row.precision.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{row.recall.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Research Evidence Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Docking Evidence", text: "Multi-pose consensus scoring with Glide/AutoDock Vina. RMSD stability confirmed across top 5 clusters.", color: "indigo" },
              { title: "GNINA Evidence", text: "CNN-based scoring integration for protein-ligand interaction refinement.", color: "cyan" },
              { title: "QM Evidence", text: "Density Functional Theory (DFT) calculations for electronic property validation of transition states.", color: "emerald" },
              { title: "Simulation Evidence", text: "Free Energy Perturbation (FEP) runs showing convergence within 0.5 kcal/mol.", color: "amber" }
            ].map((ev) => (
              <div key={ev.title} className="ui-card-surface p-6 border-l-4" style={{ borderColor: `var(--${ev.color}, ${ev.color === 'indigo' ? '#6366f1' : ev.color === 'cyan' ? '#06b6d4' : ev.color === 'emerald' ? '#10b981' : '#f59e0b'})` }}>
                <h4 className="font-bold mb-2 text-slate-200">{ev.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{ev.text}</p>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-8">
          {/* Validation Timeline */}
          <section className="ui-card-surface p-6">
            <h3 className="font-bold mb-6">Workflow Progression</h3>
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.stage} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${item.status === 'complete' ? 'bg-emerald-500' : 'bg-slate-700 animate-pulse'}`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-800 my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-xs font-bold text-slate-200">{item.stage}</div>
                    <div className="text-[10px] text-slate-500">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reproducibility Audit */}
          <section className="ui-card-surface p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Reproducibility Audit</h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Artifact SHA:</span>
                <span className="text-slate-300">7f2a1b9...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Env Snapshot:</span>
                <span className="text-slate-300">cuda-12.1-v4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Status:</span>
                <span className="text-emerald-500">Verified</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              All computational hypotheses are anchored by immutable artifact manifests stored in the research data layer.
            </p>
          </section>

          {/* Downloadable Artifacts */}
          <section className="ui-card-surface p-6 space-y-3">
            <h3 className="font-bold mb-4">Export Validation Reports</h3>
            {[
              "Technical Validation Summary (PDF)",
              "ML Model Weights Manifest (JSON)",
              "Benchmarking Raw Data (CSV)",
              "Scientific Evidence Package (ZIP)"
            ].map((file) => (
              <button key={file} className="w-full text-left p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between group">
                <span className="text-xs text-slate-400 group-hover:text-slate-200">{file}</span>
                <svg className="w-4 h-4 text-slate-600 group-hover:text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ))}
          </section>

          {/* Scientific Review Cards */}
          <section className="space-y-4">
            <div className="ui-card-surface p-5 bg-indigo-500/5 border-indigo-500/20">
               <div className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Computational Hypothesis</div>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Ligand-induced fit at the T790M gatekeeper residue likely stabilizes the Type-II binding pose, as evidenced by simulation-assisted prioritization.
               </p>
            </div>
            <div className="ui-card-surface p-5 bg-emerald-500/5 border-emerald-500/20">
               <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2">Candidate Ranking Evidence</div>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Hybrid reranking significantly improves hit rates by incorporating electronic density effects missed by classical force-fields.
               </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
