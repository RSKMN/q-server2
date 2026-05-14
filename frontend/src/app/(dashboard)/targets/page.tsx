"use client";

import { useState, useEffect } from "react";

type TargetKey = "EGFR" | "PARP1" | "PIK3CA";

const TARGET_DATA: Record<TargetKey, any> = {
  EGFR: {
    name: "EGFR",
    fullName: "Epidermal Growth Factor Receptor",
    overview: {
      biologicalRelevance: "A transmembrane glycoprotein that is a member of the protein kinase superfamily. It is a cell surface receptor for members of the epidermal growth factor family.",
      cancerAssociation: "Overexpression or mutations (e.g., L858R, T790M) are strongly associated with Non-Small Cell Lung Cancer (NSCLC) and Glioblastoma.",
      therapeuticRelevance: "Primary target for tyrosine kinase inhibitors (TKIs) and monoclonal antibodies.",
      pathwaySummary: "Activates Ras/MAPK, PI3K/Akt, and JAK/STAT pathways regulating cell proliferation and survival."
    },
    metadata: {
      uniprotId: "P00533",
      chemblId: "CHEMBL203",
      activityRecords: "45,210",
      family: "Receptor Tyrosine Kinase (RTK)",
      diseaseRelevance: "Lung Cancer, Head and Neck Cancer, Colon Cancer"
    },
    structural: {
      alphaFold: "AF-P00533-F1",
      pocketRef: "ATP-binding site (L858/T790 region)",
      pdbRefs: ["1M17", "2ITX", "3W2S", "4ZAU"],
      dockingPocket: "Volume: 425 Å³, Druggability Score: 0.88"
    },
    metrics: {
      dockingRows: "1.2M",
      gninaRows: "450k",
      qmRows: "12k",
      qmlRows: "85k",
      bestScore: "-11.4 kcal/mol",
      bestCandidate: "OX-4421",
      confidence: "0.94"
    },
    inhibitors: [
      { name: "Erlotinib", type: "1st Gen TKI", status: "Approved" },
      { name: "Osimertinib", type: "3rd Gen TKI", status: "Approved" },
      { name: "Gefitinib", type: "1st Gen TKI", status: "Approved" },
      { name: "Afatinib", type: "2nd Gen TKI", status: "Approved" }
    ],
    evidence: [
      { type: "Benchmark", text: "Validated against 15 internal NSCLC cell lines." },
      { type: "Literature", text: "Recent publications (Nature, 2024) confirm T790M resistance patterns." },
      { type: "Docking", text: "Confirmed pose stability in 500ns MD simulation." }
    ]
  },
  PARP1: {
    name: "PARP1",
    fullName: "Poly [ADP-ribose] polymerase 1",
    overview: {
      biologicalRelevance: "Involved in DNA repair (base excision repair), genomic stability, and programmed cell death.",
      cancerAssociation: "Crucial in cancers with BRCA1/2 mutations via synthetic lethality.",
      therapeuticRelevance: "Target for PARP inhibitors in breast, ovarian, and prostate cancers.",
      pathwaySummary: "Detects DNA strand breaks and catalyzes the poly-ADP-ribosylation of nuclear proteins."
    },
    metadata: {
      uniprotId: "P09874",
      chemblId: "CHEMBL3105",
      activityRecords: "28,440",
      family: "Poly ADP-ribose Polymerase",
      diseaseRelevance: "Ovarian Cancer, Breast Cancer, Prostate Cancer"
    },
    structural: {
      alphaFold: "AF-P09874-F1",
      pocketRef: "NAD+ binding pocket",
      pdbRefs: ["4ZZY", "5DS3", "6BHV"],
      dockingPocket: "Volume: 380 Å³, Druggability Score: 0.92"
    },
    metrics: {
      dockingRows: "840k",
      gninaRows: "210k",
      qmRows: "8.5k",
      qmlRows: "42k",
      bestScore: "-12.1 kcal/mol",
      bestCandidate: "OX-5567",
      confidence: "0.91"
    },
    inhibitors: [
      { name: "Olaparib", type: "PARP Inhibitor", status: "Approved" },
      { name: "Talazoparib", type: "PARP Inhibitor", status: "Approved" },
      { name: "Niraparib", type: "PARP Inhibitor", status: "Approved" },
      { name: "Rucaparib", type: "PARP Inhibitor", status: "Approved" }
    ],
    evidence: [
      { type: "Benchmark", text: "Synthetic lethality validated in BRCA-/- clones." },
      { type: "Literature", text: "PARP trapping mechanism study (Science, 2023)." },
      { type: "Simulation", text: "High-affinity binding in NAD+ site confirmed via QM/MM." }
    ]
  },
  PIK3CA: {
    name: "PIK3CA",
    fullName: "Phosphatidylinositol 4,5-bisphosphate 3-kinase catalytic subunit alpha",
    overview: {
      biologicalRelevance: "Catalytic subunit of PI3K, phosphorylates PIP2 to PIP3.",
      cancerAssociation: "Activating mutations (e.g., H1047R, E545K) are common in breast and endometrial cancers.",
      therapeuticRelevance: "Target for alpha-specific PI3K inhibitors.",
      pathwaySummary: "Main node in PI3K/AKT/mTOR signaling pathway."
    },
    metadata: {
      uniprotId: "P42336",
      chemblId: "CHEMBL3105",
      activityRecords: "19,200",
      family: "PI3-Kinase",
      diseaseRelevance: "Breast Cancer, Endometrial Cancer, Ovarian Cancer"
    },
    structural: {
      alphaFold: "AF-P42336-F1",
      pocketRef: "ATP-binding pocket",
      pdbRefs: ["4WAF", "6OQ4", "7R9V"],
      dockingPocket: "Volume: 410 Å³, Druggability Score: 0.85"
    },
    metrics: {
      dockingRows: "620k",
      gninaRows: "180k",
      qmRows: "5.2k",
      qmlRows: "31k",
      bestScore: "-10.8 kcal/mol",
      bestCandidate: "OX-9904",
      confidence: "0.88"
    },
    inhibitors: [
      { name: "Alpelisib", type: "PI3Kα Inhibitor", status: "Approved" },
      { name: "Taselisib", type: "PI3Kα Inhibitor", status: "Clinical" },
      { name: "Copanlisib", type: "Pan-PI3K Inhibitor", status: "Approved" }
    ],
    evidence: [
      { type: "Benchmark", text: "Kinome-wide selectivity profile established." },
      { type: "Literature", text: "Mutant-specific binding dynamics (J. Med. Chem, 2024)." },
      { type: "ADMET", text: "Glucose metabolism side-effects predicted for pan-inhibitors." }
    ]
  }
};

const LIVE_UPDATES = [
  "New docking batch complete for PIK3CA (OX-1102, OX-1103)",
  "Experiment OX-992: Updated EGFR prioritization score",
  "Structural sync: PDB 8ZUA added to PARP1 references",
  "Quantum reranking finished for 450 candidate leads",
  "Model V4: Activity prediction confidence increased to 0.95"
];

export default function TargetWorkspace() {
  const [activeTarget, setActiveTarget] = useState<TargetKey>("EGFR");
  const [updateIndex, setUpdateIndex] = useState(0);

  const data = TARGET_DATA[activeTarget];

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateIndex(prev => (prev + 1) % LIVE_UPDATES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-shell h-full overflow-hidden flex flex-col p-0">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Target Selector */}
        <aside className="w-80 border-r border-white/5 bg-slate-950/50 flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold">Target Intelligence</h2>
            <p className="text-xs text-slate-500 mt-1">Oncology Focus Area</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {(Object.keys(TARGET_DATA) as TargetKey[]).map(key => (
              <button
                key={key}
                onClick={() => setActiveTarget(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeTarget === key 
                    ? "border-cyan-500 bg-cyan-500/5 text-white ring-1 ring-cyan-500/20" 
                    : "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">{key}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    activeTarget === key ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-500"
                  }`}>
                    {TARGET_DATA[key].metadata.family.split(' ')[0]}
                  </span>
                </div>
                <div className="text-[10px] opacity-70 line-clamp-1">{TARGET_DATA[key].fullName}</div>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/5 bg-slate-900/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Activity</span>
            </div>
            <div className="text-[11px] text-slate-300 italic h-12">
              &quot;{LIVE_UPDATES[updateIndex]}&quot;
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-8 bg-grid-noise bg-[size:40px_40px]">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end pb-8 border-b border-white/5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                    Oncology Target
                  </span>
                  <span className="text-slate-600 font-mono text-sm">/ {data.metadata.uniprotId}</span>
                </div>
                <h1 className="text-4xl font-bold">{data.fullName} <span className="text-cyan-500">({data.name})</span></h1>
              </div>
              <div className="flex gap-3">
                <button className="ui-btn-surface px-4 py-2 text-sm font-bold uppercase tracking-wider">Download Bio-Data</button>
                <button className="btn-primary-glow px-4 py-2 text-sm font-bold uppercase tracking-wider">Initiate Screening</button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Scientific Overview & Metadata */}
              <div className="lg:col-span-2 space-y-8">
                <section className="ui-card-surface p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Scientific Context
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Biological Relevance</div>
                        <p className="text-slate-300">{data.overview.biologicalRelevance}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cancer Association</div>
                        <p className="text-slate-300">{data.overview.cancerAssociation}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Therapeutic Relevance</div>
                        <p className="text-slate-300">{data.overview.therapeuticRelevance}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pathway Integration</div>
                        <p className="text-slate-300">{data.overview.pathwaySummary}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="ui-card-surface p-6">
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">Structural Evidence</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-white/5">
                        <span className="text-xs text-slate-500">AlphaFold Structure</span>
                        <span className="text-xs font-mono text-cyan-500">{data.structural.alphaFold}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-white/5">
                        <span className="text-xs text-slate-500">PDB References</span>
                        <div className="flex gap-1">
                          {data.structural.pdbRefs.map((pdb: string) => (
                            <span key={pdb} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{pdb}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                        <span className="text-xs text-slate-500 block mb-1">Curated Pocket Reference</span>
                        <span className="text-xs text-slate-200">{data.structural.pocketRef}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ui-card-surface p-6">
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">Inhibitor Landscape</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.inhibitors.map((inh: any) => (
                        <div key={inh.name} className="flex flex-col p-3 rounded-xl bg-slate-950 border border-white/5 flex-1 min-w-[120px]">
                          <span className="text-sm font-bold text-white">{inh.name}</span>
                          <span className="text-[10px] text-slate-500">{inh.type}</span>
                          <span className="text-[9px] mt-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 self-start font-bold uppercase">{inh.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="ui-card-surface p-8">
                   <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Research Evidence Panel</h3>
                    <div className="flex gap-2">
                       <button className="text-[10px] font-bold uppercase text-cyan-500 hover:underline">Full Literature Report</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {data.evidence.map((ev: any, i: number) => (
                      <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-slate-900/30 border border-white/5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          ev.type === 'Benchmark' ? 'bg-purple-500/10 text-purple-400' :
                          ev.type === 'Literature' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {ev.type}
                        </span>
                        <p className="text-sm text-slate-400">{ev.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column - Metrics & Explorer */}
              <div className="space-y-8">
                <section className="ui-card-surface p-6 bg-gradient-to-br from-slate-900 to-slate-950">
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    Computational Metrics
                    <span className="text-[10px] text-emerald-500">Live Sync</span>
                  </h4>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 font-bold">Docking Rows</div>
                        <div className="text-lg font-mono text-slate-200">{data.metrics.dockingRows}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 font-bold">GNINA Runs</div>
                        <div className="text-lg font-mono text-slate-200">{data.metrics.gninaRows}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 font-bold">QM Evidence</div>
                        <div className="text-lg font-mono text-slate-200">{data.metrics.qmRows}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 font-bold">QML Predictions</div>
                        <div className="text-lg font-mono text-slate-200">{data.metrics.qmlRows}</div>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Best Docking Score</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">{data.metrics.bestScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Top Candidate</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono underline cursor-pointer">{data.metrics.bestCandidate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Validation Confidence</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${parseFloat(data.metrics.confidence) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono text-slate-300">{data.metrics.confidence}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="ui-card-surface p-6 space-y-6">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Molecular Viewer</h4>
                   <div className="aspect-square rounded-xl bg-slate-950 border border-white/5 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-grid-noise opacity-20" />
                      <div className="relative z-10">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 mx-auto border border-cyan-500/20">
                           <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                          </svg>
                        </div>
                        <div className="text-xs font-bold text-slate-200 mb-1">Structural Pocket Visualizer</div>
                        <p className="text-[10px] text-slate-500 px-4">Interactively explore the docking pocket and ligand binding poses.</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      <button className="w-full ui-btn-surface py-2.5 text-xs font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors">Launch Docking Viewer</button>
                      <button className="w-full ui-btn-surface py-2.5 text-xs font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors">Pose Explorer</button>
                      <button className="w-full ui-btn-surface py-2.5 text-xs font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors">Candidate Profile</button>
                   </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
