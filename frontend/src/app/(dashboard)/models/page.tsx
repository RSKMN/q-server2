"use client";

import { useState, useEffect } from "react";

type Model = {
  id: string;
  name: string;
  target: string;
  architecture: string;
  accuracy: string;
  dataset: string;
  size: string;
  lastUpdated: string;
  latency: string;
  type: "Activity" | "ADMET" | "Embedding";
  tags: string[];
};

const MODELS: Model[] = [
  {
    id: "m1",
    name: "EGFR Baseline Activity",
    target: "EGFR (Epidermal Growth Factor Receptor)",
    architecture: "Graph Convolutional Network (GCN)",
    accuracy: "92.4%",
    dataset: "ChEMBL v33 + Internal Screening",
    size: "124 MB",
    lastUpdated: "2024-05-10",
    latency: "45ms",
    type: "Activity",
    tags: ["Oncology", "Kinase"]
  },
  {
    id: "m2",
    name: "PARP1 Activity Predictor",
    target: "PARP1 (Poly [ADP-ribose] polymerase 1)",
    architecture: "Message Passing Neural Network (MPNN)",
    accuracy: "89.7%",
    dataset: "BindingDB + PubChem",
    size: "156 MB",
    lastUpdated: "2024-04-22",
    latency: "52ms",
    type: "Activity",
    tags: ["DNA Repair", "Synthetic Lethality"]
  },
  {
    id: "m3",
    name: "PIK3CA Mutant Specific",
    target: "PIK3CA (PI3K Alpha)",
    architecture: "Transformer-based Molecular Encoder",
    accuracy: "94.1%",
    dataset: "ZINC20 + Custom Mutagenesis Data",
    size: "210 MB",
    lastUpdated: "2024-05-01",
    latency: "68ms",
    type: "Activity",
    tags: ["Oncology", "Mutation-Specific"]
  },
  {
    id: "m4",
    name: "ADMET Multi-task Classifier",
    target: "Absorption, Distribution, Metabolism, Excretion, Toxicity",
    architecture: "Multi-task Deep Neural Network",
    accuracy: "87.5% (Avg)",
    dataset: "FDA Approved Drugs + Tox21",
    size: "89 MB",
    lastUpdated: "2024-03-15",
    latency: "30ms",
    type: "ADMET",
    tags: ["Safety", "Pharmacokinetics"]
  },
  {
    id: "m5",
    name: "MolEmbed-v2",
    target: "General Molecular Representation",
    architecture: "Self-Supervised BERT-style Transformer",
    accuracy: "N/A (Embedding)",
    dataset: "100M+ SMILES from PubChem",
    size: "1.2 GB",
    lastUpdated: "2024-01-20",
    latency: "12ms",
    type: "Embedding",
    tags: ["Foundation Model", "Representation"]
  }
];

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [smiles, setSmiles] = useState("");
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"registry" | "playground" | "artifacts">("registry");

  const runInference = () => {
    if (!selectedModel || !smiles) return;
    
    setIsInferenceLoading(true);
    setPredictionResult(null);
    
    // Fake async inference
    setTimeout(() => {
      setIsInferenceLoading(false);
      setPredictionResult({
        activity: (Math.random() * 10).toFixed(2) + " pIC50",
        toxicity: Math.random() > 0.8 ? "High" : Math.random() > 0.4 ? "Moderate" : "Low",
        confidence: (0.85 + Math.random() * 0.14).toFixed(3),
        qed: (0.3 + Math.random() * 0.6).toFixed(2),
        saScore: (2 + Math.random() * 4).toFixed(2),
      });
    }, 1500);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-kicker">Core Infrastructure</div>
        <h1 className="page-title">Model Registry & Intelligence</h1>
        <p className="page-subtitle">
          Manage, evaluate, and deploy specialized deep learning models for molecular property prediction and lead optimization.
        </p>
      </header>

      <div className="flex gap-4 border-b pb-px" style={{ borderColor: "var(--border)" }}>
        {(["registry", "playground", "artifacts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-all duration-200 border-b-2 capitalize ${
              activeTab === tab 
                ? "border-cyan-500 text-cyan-500" 
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "registry" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {MODELS.map((model) => (
            <div key={model.id} className="ui-card-surface p-6 flex flex-col gap-4 group">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    model.type === "Activity" ? "bg-indigo-500/10 text-indigo-500" :
                    model.type === "ADMET" ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-amber-500/10 text-amber-500"
                  }`}>
                    {model.type}
                  </span>
                  <h3 className="text-xl font-bold">{model.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</div>
                  <div className="text-lg font-mono text-cyan-500 font-bold">{model.accuracy}</div>
                </div>
              </div>

              <div className="space-y-3 py-2 border-y border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target</span>
                  <span className="text-slate-300 font-medium">{model.target}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Architecture</span>
                  <span className="font-mono text-xs text-slate-400">{model.architecture}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Latency</span>
                  <span className="text-slate-400">{model.latency}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                {model.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex gap-2 mt-2">
                <button 
                  onClick={() => {
                    setSelectedModel(model);
                    setActiveTab("playground");
                  }}
                  className="flex-1 ui-btn-surface py-2 text-xs font-bold uppercase tracking-wider hover:text-cyan-400 transition-colors"
                >
                  Test Model
                </button>
                <button className="px-3 ui-btn-surface py-2 text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start aurora-bg p-8 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-noise pointer-events-none opacity-20" />
          <div className="lg:col-span-2 space-y-6 relative z-10">
            <div className="ui-card-surface p-8 backdrop-blur-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.285a2 2 0 01-1.968 0l-.628-.285a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l1.166 6.837a2 2 0 001.946 1.668h9.916a2 2 0 001.946-1.668l1.166-6.837z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Inference Playground
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Target Model</label>
                  <select 
                    value={selectedModel?.id || ""} 
                    onChange={(e) => setSelectedModel(MODELS.find(m => m.id === e.target.value) || null)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                  >
                    <option value="" disabled>Select a model to run inference</option>
                    {MODELS.filter(m => m.type !== "Embedding").map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">SMILES Input</label>
                  <div className="relative">
                    <textarea 
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      placeholder="Enter SMILES string (e.g. CC1=C(C=C(C=C1)NC2=NC=CC(=N2)C3=CN=CC=C3)NC4=CC=C(C=C4)CN5CCN(CC5)C)"
                      className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button 
                        onClick={() => setSmiles("CC1=C(C=C(C=C1)NC2=NC=CC(=N2)C3=CN=CC=C3)NC4=CC=C(C=C4)CN5CCN(CC5)C")}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                      >
                        Load Imatinib
                      </button>
                      <button 
                        onClick={() => setSmiles("CC(C)C1=C(C(=C(N1C2=CC=C(C=C2)F)C3=CC=C(C=C3)F)C(=O)NC4=CC=CC=C4)C[C@@H](C[C@@H](CC(=O)O)O)O")}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                      >
                        Load Atorvastatin
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={runInference}
                  disabled={isInferenceLoading || !selectedModel || !smiles}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
                    isInferenceLoading || !selectedModel || !smiles
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "btn-primary-glow"
                  }`}
                >
                  {isInferenceLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Running Quantum Simulation...
                    </span>
                  ) : "Run Prediction Engine"}
                </button>
              </div>
            </div>

            {predictionResult && (
              <div className="ui-card-surface p-8 ui-fade-in border-cyan-500/20 bg-gradient-to-br from-slate-900 to-indigo-900/20">
                <h3 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prediction Results
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Predicted Activity</div>
                    <div className="text-2xl font-bold text-white">{predictionResult.activity}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Toxicity Risk</div>
                    <div className={`text-2xl font-bold ${
                      predictionResult.toxicity === "High" ? "text-red-400" : 
                      predictionResult.toxicity === "Moderate" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {predictionResult.toxicity}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confidence Score</div>
                    <div className="text-2xl font-bold text-cyan-400">{predictionResult.confidence}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Drug-likeness (QED)</div>
                    <div className="text-2xl font-bold text-white">{predictionResult.qed}</div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Attention Map Visualization</span>
                    <span className="text-[10px] text-cyan-500 px-2 py-0.5 rounded bg-cyan-500/10">Ready</span>
                  </div>
                  <div className="h-32 w-full flex items-end gap-1 px-2">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-cyan-500/40 rounded-t hover:bg-cyan-400 transition-all cursor-help"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                        title={`Atom ${i+1} contribution: ${(Math.random() * 0.4).toFixed(3)}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 relative z-10">
            <div className="ui-card-surface p-6">
              <h3 className="text-lg font-bold mb-4">Model Specs</h3>
              {selectedModel ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Architecture</div>
                    <div className="text-sm text-slate-200">{selectedModel.architecture}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Training Set</div>
                    <div className="text-sm text-slate-200">{selectedModel.dataset}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Inference Latency</div>
                    <div className="text-sm text-slate-200">{selectedModel.latency}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Checkpoint Size</div>
                    <div className="text-sm text-slate-200">{selectedModel.size}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 italic text-sm">
                  Select a model to view technical specifications.
                </div>
              )}
            </div>

            <div className="ui-card-surface p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Experiment Link
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                This model was trained as part of <strong>Project Oncology Phase II</strong> (Exp ID: OX-992).
              </p>
              <button className="w-full py-2 text-xs font-bold uppercase border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors">
                View Experiment Details
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "artifacts" && (
        <div className="space-y-6">
          <div className="ui-card-surface overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Artifact Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Sync</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {MODELS.map((model) => (
                  <tr key={model.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-slate-800">
                          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-200">{model.name} Weights</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">v2.4.1-prod</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">PyTorch</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{model.size}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{model.lastUpdated}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-500 hover:text-cyan-400 text-xs font-bold uppercase tracking-wider">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
