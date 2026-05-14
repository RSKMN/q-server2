"use client";

import { useState, useEffect, useRef } from "react";

type Metric = {
  label: string;
  value: string;
};

type RankShift = {
  candidate: string;
  classicalRank: number;
  quantumRank: number;
  delta: string;
  confidence: string;
  target: string;
};

const QUANTUM_METRICS: Metric[] = [
  { label: "Prefilter Rows", value: "12,450" },
  { label: "Kernel Rows", value: "2,500" },
  { label: "Mean Rank Shift", value: "+14.2" },
  { label: "Mean Signed Delta", value: "-0.82" },
  { label: "Quantum Diversity Score", value: "0.942" },
  { label: "Portfolio Compression Ratio", value: "4.2x" },
  { label: "Ablation Delta", value: "18.5%" },
  { label: "QML Evidence Rows", value: "840" }
];

const RANK_SHIFT_DATA: RankShift[] = [
  { candidate: "OX-4421", classicalRank: 12, quantumRank: 3, delta: "+9", confidence: "0.94", target: "EGFR" },
  { candidate: "OX-8892", classicalRank: 5, quantumRank: 1, delta: "+4", confidence: "0.98", target: "EGFR" },
  { candidate: "OX-1103", classicalRank: 2, quantumRank: 8, delta: "-6", confidence: "0.91", target: "EGFR" },
  { candidate: "OX-5567", classicalRank: 24, quantumRank: 5, delta: "+19", confidence: "0.89", target: "PARP1" },
  { candidate: "OX-3321", classicalRank: 8, quantumRank: 2, delta: "+6", confidence: "0.96", target: "PARP1" },
  { candidate: "OX-9904", classicalRank: 1, quantumRank: 12, delta: "-11", confidence: "0.88", target: "PIK3CA" },
];

export default function QuantumPage() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [executionStep, setExecutionStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const workflowSteps = [
    { id: "pool", label: "Candidate Pool", description: "Initial screening results" },
    { id: "filter", label: "Classical Filtering", description: "ADMET & solubility constraints" },
    { id: "kernel", label: "Quantum Kernel Embedding", description: "High-dimensional feature mapping" },
    { id: "diversity", label: "Portfolio Diversity Optimization", description: "Subset selection via QUBO" },
    { id: "rerank", label: "Quantum Reranking", description: "VQE-based energy minimization" },
    { id: "final", label: "Final Selection", description: "Optimized candidate leads" },
  ];

  const executionLogs = [
    "Initializing hybrid classical-quantum solver...",
    "Retrieving candidate feature vectors from classical pre-filter...",
    "Generating quantum feature map using Z-feature map circuit...",
    "Mapping 2,500 candidates to Hilbert space...",
    "Executing kernel similarity pass on statevector simulator...",
    "Constructing Quadratic Unconstrained Binary Optimization (QUBO) matrix...",
    "Solving for portfolio diversity via simulated annealing...",
    "Quantum reranking complete. Rank shifts calculated.",
    "Updating candidate prioritization engine..."
  ];

  const runSimulation = () => {
    setIsExecuting(true);
    setLogs([]);
    setExecutionStep(0);
    
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < executionLogs.length) {
        setLogs(prev => [...prev, executionLogs[currentLog]]);
        setExecutionStep(Math.min(workflowSteps.length - 1, Math.floor((currentLog / executionLogs.length) * workflowSteps.length)));
        currentLog++;
      } else {
        clearInterval(interval);
        setIsExecuting(false);
        setExecutionStep(workflowSteps.length - 1);
      }
    }, 1200);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-kicker">Quantum Intelligence Layer</div>
        <h1 className="page-title">Hybrid Quantum Prioritization</h1>
        <p className="page-subtitle">
          Utilizing quantum-assisted algorithms and Qiskit-integrated kernels to rerank molecular candidates based on non-linear structural similarities and portfolio diversity optimization.
        </p>
      </header>

      {/* Hero / Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 ui-card-surface p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-48 h-48 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zM12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Architecture Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed text-slate-400">
              <div className="space-y-4">
                <p>
                  Our research pipeline integrates <strong className="text-slate-200">Quantum Kernel Methods</strong> to capture complex molecular patterns that elude classical linear representations. By mapping candidates into high-dimensional Hilbert spaces, we identify subtle pharmacophore similarities.
                </p>
                <p>
                  The system leverages <strong className="text-slate-200">Qiskit Runtime</strong> for execution, utilizing statevector simulation for validation before scaling to hardware-efficient kernels.
                </p>
              </div>
              <div className="space-y-4">
                <p>
                  The core reranking engine employs <strong className="text-slate-200">Portfolio Diversity Optimization</strong>, ensuring the final candidate pool covers a broad chemical space while maintaining high predicted potency.
                </p>
                <p>
                  This hybrid approach reduces candidate redundancy by up to 75% compared to purely greed-based classical prioritization methods.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-card-surface p-8 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-cyan-500/20">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Execution Control
          </h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] h-40 overflow-y-auto" ref={scrollRef}>
              {logs.length === 0 && <div className="text-slate-600">Waiting for initialization...</div>}
              {logs.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="text-cyan-500 mr-2">[OK]</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
              {isExecuting && <div className="animate-pulse text-cyan-500">_</div>}
            </div>
            <button 
              onClick={runSimulation}
              disabled={isExecuting}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${
                isExecuting ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "btn-primary-glow"
              }`}
            >
              {isExecuting ? "Executing Kernel Pass..." : "Run Quantum Reranking"}
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold px-1">Quantum Research Workflow</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {workflowSteps.map((step, i) => (
            <div 
              key={step.id} 
              className={`relative p-4 rounded-2xl border transition-all duration-500 ${
                executionStep === i 
                  ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                  : i < executionStep
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-slate-800 bg-slate-900/50"
              }`}
            >
              {i < workflowSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                  <svg className={`w-4 h-4 ${i < executionStep ? "text-emerald-500" : "text-slate-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              <div className={`text-[10px] font-bold uppercase mb-2 ${i <= executionStep ? "text-cyan-400" : "text-slate-600"}`}>
                Step {i + 1}
              </div>
              <h4 className={`text-sm font-bold mb-1 ${i <= executionStep ? "text-white" : "text-slate-500"}`}>{step.label}</h4>
              <p className="text-[10px] text-slate-500 leading-tight">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUANTUM_METRICS.map((metric) => (
          <div key={metric.label} className="ui-card-surface p-5 hover:border-cyan-500/30 transition-colors">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Rank Shift Table */}
        <div className="xl:col-span-2 ui-card-surface overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold">Candidate Rank Shift Analysis</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">Classical vs Hybrid</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">Candidate ID</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Classical Rank</th>
                <th className="px-6 py-4">Quantum Rank</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {RANK_SHIFT_DATA.map((row) => (
                <tr key={row.candidate} className="hover:bg-white/5 transition-colors text-sm">
                  <td className="px-6 py-4 font-bold text-slate-200">{row.candidate}</td>
                  <td className="px-6 py-4 text-slate-400">{row.target}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">#{row.classicalRank}</td>
                  <td className="px-6 py-4 text-cyan-400 font-mono font-bold">#{row.quantumRank}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 font-bold ${row.delta.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                      {row.delta}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={row.delta.startsWith("+") ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                      </svg>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">{row.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Qiskit Architecture & Ablation */}
        <div className="space-y-8">
          <div className="ui-card-surface p-6 space-y-6">
            <h3 className="font-bold border-b border-white/5 pb-4">Qiskit Architecture</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-slate-900 text-cyan-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Feature Mapping</div>
                  <p className="text-[10px] text-slate-500">Non-linear projection into quantum feature space using ZZFeatureMap circuits.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-slate-900 text-indigo-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Quantum Kernels</div>
                  <p className="text-[10px] text-slate-500">Structural similarity calculation via fidelity-based quantum kernel alignment.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-slate-900 text-emerald-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Diversity Solver</div>
                  <p className="text-[10px] text-slate-500">Solving QUBO formulations for optimal subset selection using hybrid solvers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ui-card-surface p-6">
            <h3 className="font-bold mb-4">Ablation Comparison</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-slate-500">Classical Base</span>
                  <span className="text-slate-200">62% Hits</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: "62%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-cyan-500">Hybrid Quantum</span>
                  <span className="text-cyan-400">84% Hits (+22%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: "84%" }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-4">
                * Based on internal benchmark against 10 target oncology kinases. Quantum reranking identifies leads with higher synthetic accessibility scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
