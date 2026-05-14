"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useCopilotChatStore, useWorkspaceStore } from "@/store";
import { toFriendlyErrorMessage } from "@/services/api";
import DynamicCanvasPanel, { CanvasView } from "./components/DynamicCanvasPanel";

type CopilotContext =
  | "overview"
  | "molecule-analysis"
  | "similarity-search"
  | "experiment-planning"
  | "risk-review";

const QUICK_PROMPTS = [
  { label: "EGFR Leads", prompt: "Summarize top EGFR candidates" },
  { label: "ADMET Review", prompt: "Explain low ADMET scores for candidates" },
  { label: "PARP1 Compare", prompt: "Compare PARP1 compounds in cluster A" },
  { label: "Quantum Rationale", prompt: "Show quantum ranking rationale" },
];

const CONTEXT_LABELS: Record<CopilotContext, string> = {
  overview: "General Research",
  "molecule-analysis": "Structural Analysis",
  "similarity-search": "SAR Mapping",
  "experiment-planning": "Pipeline Orchestration",
  "risk-review": "Safety & Toxicity",
};

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeContext, setActiveContext] = useState<CopilotContext>("overview");
  const [activeView, setActiveView] = useState<CanvasView>("charts");
  const historyRef = useRef<HTMLDivElement>(null);
  
  const messages = useCopilotChatStore((state) => state.messages);
  const appendMessage = useCopilotChatStore((state) => state.appendMessage);
  
  const pipelineState = useWorkspaceStore((state) => state.pipelineState);
  const lastExperimentId = useWorkspaceStore((state) => state.lastExperimentId);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  const handlePromptClick = (prompt: string) => {
    handleUserMessage(prompt);
  };

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return;
    
    appendMessage({ role: "user", content });
    setInput("");
    setIsAiThinking(true);

    // Simulated scientific processing
    setTimeout(() => {
      const response = getMockScientificResponse(content);
      appendMessage({ role: "assistant", content: response });
      setIsAiThinking(false);
      
      // Auto-switch view based on content
      if (content.toLowerCase().includes("egfr") || content.toLowerCase().includes("molecule")) {
        setActiveView("molecule-viewer");
        setActiveContext("molecule-analysis");
      } else if (content.toLowerCase().includes("compare") || content.toLowerCase().includes("score")) {
        setActiveView("results-table");
        setActiveContext("similarity-search");
      }
    }, 1500);
  };

  const getMockScientificResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes("egfr")) {
      return `### EGFR Lead Candidate Summary
      
Identification of high-affinity inhibitors for the **EGFR-TK** domain. Top candidates identified via GNINA docking:

*   **CAND-912**: Docking Score: **-10.4 kcal/mol**. Strong interaction with Met793. [Ref: 1]
*   **CAND-441**: Docking Score: **-9.8 kcal/mol**. Predicted high selectivity over HER2. [Ref: 2]

**Recommendations:** Proceed to MD simulation for CAND-912 to verify complex stability.

---
*Citations:*
1. *Oncology Chemical Biology, Vol 12, 2024*
2. *AI Drug Discovery Journal, Issue 4, 2023*`;
    }
    
    if (q.includes("admet")) {
      return `### ADMET Triage Report
      
Analysis of absorption, distribution, metabolism, excretion, and toxicity for current candidate pool:

| ID | Lipophilicity (LogP) | Solubility (LogS) | hERG Risk | Triage |
|:---|:---:|:---:|:---:|:---|
| 7721 | 3.82 | Moderate | Low | **Pass** |
| 8402 | 5.10 | Low | High | **Reject** |

**Insight:** Candidates in Cluster 4 show elevated hERG liability due to basic amine scaffolds. Suggesting R-group modification to reduce pKa.`;
    }
    
    if (q.includes("parp1")) {
      return `### PARP1 Comparative Analysis
      
Structural comparison between Cluster A (Benzimidazole series) and Cluster B (Phthalazinone series):

*   **Cluster A**: Higher metabolic stability but lower potency (Avg. -8.2 kcal/mol).
*   **Cluster B**: Exceptional potency (Avg. -10.1 kcal/mol) but potential CYP3A4 inhibition risks.

**Quantum Reranking Data:** B-12 remains the top priority after QSVM validation (0.98 confidence).`;
    }

    if (q.includes("quantum")) {
      return `### Quantum Ranking Rationale
      
The **QSVM (Quantum Support Vector Machine)** re-scores docking poses by evaluating electronic properties beyond simple forcefields:

1.  **HOMO-LUMO Gap**: Candidates with gaps < 4.2 eV show improved reactivity profiles.
2.  **Electrostatic Map**: CAND-912 matches the receptor's electrostatic surface with 94% alignment.
3.  **Final Triage**: Reranking shifted CAND-912 above CAND-441 due to superior dipole-moment compatibility.`;
    }

    return "I am analyzing your request. Please specify an oncology target (e.g., EGFR, PARP1) or research task (e.g., ADMET summary) for a detailed technical briefing.";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleUserMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 shrink-0 rounded-3xl border border-border/50 bg-card/50 p-5 shadow-premium backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-text">AI Copilot Lab</h1>
                <p className="text-sm font-medium text-text-secondary/70">Expert oncology research assistant for molecular discovery pipelines.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="rounded-xl border border-border/40 bg-surface-subtle/30 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60">Active Context</p>
                <p className="text-xs font-bold text-primary">{CONTEXT_LABELS[activeContext]}</p>
             </div>
             <div className="rounded-xl border border-border/40 bg-surface-subtle/30 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60">Experiment</p>
                <p className="text-xs font-bold text-accent">{lastExperimentId || "Standalone"}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Chat Section */}
        <section className="flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-premium">
          <header className="border-b border-border/30 bg-surface-subtle/30 px-6 py-4 shrink-0">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Scientific Console</h2>
          </header>

          <div className="flex flex-wrap gap-2 p-4 border-b border-border/10 shrink-0">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => handlePromptClick(qp.prompt)}
                className="rounded-lg border border-border/40 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:border-primary hover:text-primary transition-all"
              >
                {qp.label}
              </button>
            ))}
          </div>

          <div ref={historyRef} className="flex-1 space-y-6 overflow-y-auto p-6 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                    m.role === "assistant" 
                      ? "border border-border/40 bg-surface-subtle/30" 
                      : "bg-primary text-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {m.role === "assistant" ? "Copilot Intelligence" : "Researcher"}
                      </span>
                    </div>
                    <div className={`prose prose-sm max-w-none ${m.role === "assistant" ? "text-text" : "text-white"}`}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isAiThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl border border-border/40 bg-surface-subtle/30 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                      <div className="flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                      <div className="flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Analyzing Data...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border/30 p-6 bg-surface-subtle/10">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about candidates, docking results, or ADMET risks..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-border/60 bg-white px-5 py-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={isAiThinking || !input.trim()}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest">
              Shift + Enter for new line • Enter to send
            </p>
          </form>
        </section>

        {/* Dynamic Canvas Section */}
        <section className="flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-premium min-h-0">
          <header className="border-b border-border/30 bg-surface-subtle/30 px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Research Canvas</h2>
            <div className="flex gap-2">
              {["charts", "molecule-viewer", "results-table"].map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v as CanvasView)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeView === v ? "bg-primary text-white" : "bg-white border border-border/40 text-text-secondary"
                  }`}
                >
                  {v.replace("-", " ")}
                </button>
              ))}
            </div>
          </header>
          <div className="flex-1 p-6 overflow-hidden min-h-0">
             <DynamicCanvasPanel view={activeView} contextLabel={CONTEXT_LABELS[activeContext]} />
          </div>
        </section>
      </div>
    </div>
  );
}