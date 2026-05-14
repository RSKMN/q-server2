"use client";

import { useState, useEffect, useRef } from "react";

type Pose = {
  id: number;
  cnnScore: number;
  affinity: number;
  rmsd: number;
  hBonds: number;
  contacts: number;
  confidence: "High" | "Medium" | "Low";
};

const POSES: Pose[] = [
  { id: 1, cnnScore: 0.942, affinity: -8.4, rmsd: 1.2, hBonds: 4, contacts: 12, confidence: "High" },
  { id: 2, cnnScore: 0.885, affinity: -7.9, rmsd: 1.8, hBonds: 3, contacts: 10, confidence: "Medium" },
  { id: 3, cnnScore: 0.810, affinity: -7.2, rmsd: 2.4, hBonds: 2, contacts: 8, confidence: "Low" },
];

const EXECUTION_LOGS = [
  "Initializing GNINA environment...",
  "Loading receptor topology (EGFR-T790M)...",
  "Preparing grid for docking box (Center: 12.4, -4.2, 18.9)...",
  "Generating ligand conformers for OX-4421...",
  "Executing AutoDock Vina search (Exhaustiveness: 32)...",
  "Vina search complete. 20 poses generated.",
  "Executing GNINA CNN rescoring (Model: cross-docked v1)...",
  "Calculating cross-pose RMSD matrix...",
  "Identifying hydrogen bond networks...",
  "Docking simulation complete. Exporting results."
];

export default function DockingStudio() {
  const [activePose, setActivePose] = useState<Pose>(POSES[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runDocking = () => {
    setIsExecuting(true);
    setLogs([]);
    setProgress(0);
    
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < EXECUTION_LOGS.length) {
        setLogs(prev => [...prev, EXECUTION_LOGS[currentLog]]);
        setProgress(((currentLog + 1) / EXECUTION_LOGS.length) * 100);
        currentLog++;
      } else {
        clearInterval(interval);
        setIsExecuting(false);
      }
    }, 1500);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="page-shell h-full overflow-hidden flex flex-col p-0">
      {/* Top Header / Hero */}
      <header className="p-6 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Target</div>
            <div className="text-xl font-bold flex items-center gap-2">
              EGFR (T790M)
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">Kinase</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Docking Engine</div>
            <div className="text-sm font-mono text-slate-300">GNINA v1.2 + Vina</div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Candidate</div>
            <div className="text-sm font-bold text-cyan-400 underline cursor-pointer">OX-4421</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
             <div className={`text-xs font-bold ${isExecuting ? 'text-amber-400' : 'text-emerald-400'}`}>
               {isExecuting ? 'Processing...' : 'Simulation Ready'}
             </div>
          </div>
          <button 
            onClick={runDocking}
            disabled={isExecuting}
            className={`px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
              isExecuting ? 'bg-slate-800 text-slate-600' : 'btn-primary-glow'
            }`}
          >
            {isExecuting ? 'Executing...' : 'Run Simulation'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Pose Explorer & Telemetry */}
        <aside className="w-80 border-r border-white/5 bg-slate-950 flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex justify-between">
              Pose Explorer
              <span className="text-slate-500 font-mono text-[10px]">3 Poses</span>
            </h3>
            <div className="space-y-3">
              {POSES.map(pose => (
                <button
                  key={pose.id}
                  onClick={() => setActivePose(pose)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activePose.id === pose.id
                      ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/20'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold">Pose #{pose.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      pose.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-500' :
                      pose.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {pose.confidence}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-[10px] font-mono">Affinity: <span className="text-slate-200">{pose.affinity}</span></div>
                    <div className="text-[10px] font-mono">CNN: <span className="text-cyan-500">{pose.cnnScore}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-white/5 bg-slate-900/10">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Docking Telemetry</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Global Progress</span>
                  <span className="text-cyan-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] h-32 overflow-y-auto" ref={scrollRef}>
                {logs.length === 0 && <div className="text-slate-700">Waiting for command...</div>}
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 text-slate-400">
                    <span className="text-slate-600 mr-2">{i+1}.</span>
                    {log}
                  </div>
                ))}
                {isExecuting && <span className="text-cyan-500 animate-pulse">_</span>}
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
             <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Pipeline Stages</h3>
             <div className="space-y-4">
                {[
                  { label: "Receptor Prep", status: "complete" },
                  { label: "Ligand Conformer", status: "complete" },
                  { label: "Pose Generation", status: "complete" },
                  { label: "CNN Rescoring", status: isExecuting ? "active" : "complete" },
                  { label: "Interaction Map", status: isExecuting ? "pending" : "complete" }
                ].map(stage => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      stage.status === 'complete' ? 'bg-emerald-500' :
                      stage.status === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'
                    }`} />
                    <span className={`text-[11px] ${stage.status === 'pending' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        {/* Main Content - 3D Viewer Placeholder & Analysis */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div className="flex-1 bg-slate-900 relative">
            {/* Visual Overlays */}
            <div className="absolute inset-0 pointer-events-none bg-grid-noise opacity-10" />
            
            {/* 3D Mock Viewer Area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[500px] h-[500px]">
                <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent border border-white/5 flex flex-col items-center justify-center text-center p-8">
                     <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Structural Engine Active</div>
                      <p className="text-[10px] text-slate-700 mt-2">Displaying Pose #{activePose.id} in EGFR binding pocket</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewer Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="flex gap-2">
                <button className="ui-btn-surface p-3 text-white rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button className="ui-btn-surface px-4 py-2 text-xs font-bold uppercase tracking-wider">Interactions</button>
                <button className="ui-btn-surface px-4 py-2 text-xs font-bold uppercase tracking-wider">Residues</button>
                <button className="ui-btn-surface px-4 py-2 text-xs font-bold uppercase tracking-wider">Surface</button>
              </div>
              <div className="ui-card-surface p-4 border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pose #{activePose.id} Analysis</h4>
                  <span className="text-[10px] font-mono text-cyan-500">Fidelity: 0.98</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">CNN Score</div>
                      <div className="text-lg font-bold text-white font-mono">{activePose.cnnScore}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Pred. Affinity</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono">{activePose.affinity}</div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel - Analysis Details */}
          <div className="h-64 border-t border-white/5 bg-slate-950 grid grid-cols-3">
             <div className="p-6 border-r border-white/5 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">GNINA Metrics</h4>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <div className="text-xs text-slate-400">RMSD</div>
                      <div className="text-lg font-bold font-mono">{activePose.rmsd} Å</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-xs text-slate-400">H-Bonds</div>
                      <div className="text-lg font-bold font-mono">{activePose.hBonds}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-xs text-slate-400">Interactions</div>
                      <div className="text-lg font-bold font-mono">{activePose.contacts}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-xs text-slate-400">Ligand Strain</div>
                      <div className="text-lg font-bold font-mono text-emerald-400">Low</div>
                   </div>
                </div>
             </div>
             
             <div className="p-6 border-r border-white/5 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Interaction Evidence</h4>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5" />
                    <p className="text-[11px] text-slate-400">Hydrogen bond detected at MET793 (2.8 Å) back-bone oxygen.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5" />
                    <p className="text-[11px] text-slate-400">Pi-stacking interaction with PHE723 in the glycine-rich loop.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5" />
                    <p className="text-[11px] text-slate-400">Hydrophobic contact identified in the gatekeeper pocket region.</p>
                  </div>
                </div>
             </div>

             <div className="p-6 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Molecular Descriptors</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-2 rounded bg-white/5 border border-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">MW</div>
                      <div className="text-xs font-bold">428.45</div>
                   </div>
                   <div className="p-2 rounded bg-white/5 border border-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">LogP</div>
                      <div className="text-xs font-bold">3.42</div>
                   </div>
                   <div className="p-2 rounded bg-white/5 border border-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">TPSA</div>
                      <div className="text-xs font-bold">84.2 Å²</div>
                   </div>
                   <div className="p-2 rounded bg-white/5 border border-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">Rot. Bonds</div>
                      <div className="text-xs font-bold">6</div>
                   </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
