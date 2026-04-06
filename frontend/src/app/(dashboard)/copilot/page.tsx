"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCopilotChatStore, useWorkspaceStore } from "@/store";
import type { IntermediateResultItem, PipelineAction, PipelineState } from "@/store";
import { createPipelineExperiment, getPipelineResult, runPipeline, toFriendlyErrorMessage } from "@/services/api";
import DynamicCanvasPanel, { CanvasView } from "./components/DynamicCanvasPanel";

type CopilotContext =
  | "overview"
  | "molecule-analysis"
  | "similarity-search"
  | "experiment-planning"
  | "risk-review";

type CanvasActionRule = {
  keywords: string[];
  view: CanvasView;
};

type PipelineCommandRule = {
  action: PipelineAction;
  keywords: string[];
  context: CopilotContext;
};

const QUICK_PROMPTS = [
  "Analyze this candidate for CNS penetration.",
  "Compare scaffold similarity against lead set A.",
  "Design a 3-step validation experiment plan.",
  "Highlight ADMET and synthesis risks for this series.",
];

const CONTEXT_LABELS: Record<CopilotContext, string> = {
  overview: "Workspace Overview",
  "molecule-analysis": "Molecule Analysis",
  "similarity-search": "Similarity Search",
  "experiment-planning": "Experiment Planner",
  "risk-review": "Risk Review",
};

const CANVAS_ACTION_RULES: CanvasActionRule[] = [
  {
    keywords: ["show molecule", "3d viewer", "molecule viewer"],
    view: "molecule-viewer",
  },
  {
    keywords: ["show results", "results table", "open results"],
    view: "results-table",
  },
  {
    keywords: ["show chemical space", "chemical space", "show chart", "open chart"],
    view: "charts",
  },
];

const PIPELINE_COMMAND_RULES: PipelineCommandRule[] = [
  {
    action: "generate",
    keywords: ["generate molecules", "generate molecule", "generate candidates"],
    context: "molecule-analysis",
  },
  {
    action: "docking",
    keywords: ["run docking", "start docking", "dock molecules"],
    context: "similarity-search",
  },
  {
    action: "pipeline",
    keywords: ["run full pipeline", "start pipeline", "run pipeline"],
    context: "experiment-planning",
  },
];

function inferContext(input: string): CopilotContext {
  const text = input.toLowerCase();

  if (text.includes("similar") || text.includes("scaffold") || text.includes("nearest")) {
    return "similarity-search";
  }

  if (text.includes("experiment") || text.includes("assay") || text.includes("protocol")) {
    return "experiment-planning";
  }

  if (
    text.includes("risk") ||
    text.includes("admet") ||
    text.includes("tox") ||
    text.includes("liability")
  ) {
    return "risk-review";
  }

  if (
    text.includes("molecule") ||
    text.includes("compound") ||
    text.includes("property") ||
    text.includes("lipinski")
  ) {
    return "molecule-analysis";
  }

  return "overview";
}

function mapContextToCanvasView(context: CopilotContext): CanvasView {
  if (context === "molecule-analysis") {
    return "molecule-viewer";
  }

  if (context === "similarity-search" || context === "risk-review") {
    return "results-table";
  }

  return "charts";
}

function inferCanvasViewFromAssistantMessage(content: string): CanvasView | null {
  const text = content.toLowerCase();

  for (const rule of CANVAS_ACTION_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.view;
    }
  }

  return null;
}

function isPipelineRunning(state: PipelineState): boolean {
  return state === "generating" || state === "docking" || state === "running_full_pipeline";
}

function inferPipelineCommand(input: string): PipelineCommandRule | null {
  const text = input.toLowerCase();

  for (const rule of PIPELINE_COMMAND_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule;
    }
  }

  return null;
}

function isGenerateMoleculesCommand(input: string): boolean {
  return input.toLowerCase().includes("generate");
}

function isShowResultsCommand(input: string): boolean {
  return input.toLowerCase().includes("show results");
}

function extractExperimentIdFromCommand(input: string): string | null {
  const explicitMatch = input.match(
    /show results(?:\s+(?:for|id|experiment))?\s*[:#-]?\s*([A-Za-z0-9._-]{6,})/i
  );
  if (explicitMatch?.[1]) {
    return explicitMatch[1];
  }

  const uuidMatch = input.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i
  );
  if (uuidMatch?.[1]) {
    return uuidMatch[1];
  }

  return null;
}

function summarizeResultsPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Results were returned by the backend.";
  }

  const data = payload as Record<string, unknown>;
  const generated = Array.isArray(data.generated_molecules)
    ? data.generated_molecules.length
    : Array.isArray(data.generated)
      ? data.generated.length
      : null;
  const filtered = Array.isArray(data.filtered_candidates)
    ? data.filtered_candidates.length
    : Array.isArray(data.filtered)
      ? data.filtered.length
      : null;
  const docking = Array.isArray(data.docking_results)
    ? data.docking_results.length
    : Array.isArray(data.docking)
      ? data.docking.length
      : null;

  const parts: string[] = [];
  if (generated !== null) {
    parts.push(`generated=${generated}`);
  }
  if (filtered !== null) {
    parts.push(`filtered=${filtered}`);
  }
  if (docking !== null) {
    parts.push(`docking=${docking}`);
  }

  return parts.length > 0
    ? `Result summary (${parts.join(", ")}).`
    : "Results were returned by the backend.";
}

function buildInitialResults(action: PipelineAction): IntermediateResultItem[] {
  if (action === "generate") {
    return [
      { id: "gen-sample", label: "Sample Pool", value: "0 candidates generated", status: "queued", progress: 0 },
      { id: "gen-filter", label: "Constraint Filter", value: "Awaiting LogP/QED screening", status: "queued", progress: 0 },
    ];
  }

  if (action === "docking") {
    return [
      { id: "dock-grid", label: "Docking Grid", value: "Preparing receptor site", status: "queued", progress: 0 },
      { id: "dock-score", label: "Affinity Scoring", value: "No poses scored", status: "queued", progress: 0 },
    ];
  }

  return [
    { id: "pipe-gen", label: "Generation", value: "Bootstrapping molecular generation", status: "queued", progress: 0 },
    { id: "pipe-dock", label: "Docking", value: "Docking workers are idle", status: "queued", progress: 0 },
    { id: "pipe-rank", label: "Ranking", value: "Waiting for upstream outputs", status: "queued", progress: 0 },
  ];
}

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeContext, setActiveContext] = useState<CopilotContext>("overview");
  const [activeView, setActiveView] = useState<CanvasView>("charts");
  const historyRef = useRef<HTMLDivElement>(null);
  const pendingReplyTimersRef = useRef<number[]>([]);
  const messages = useCopilotChatStore((state) => state.messages);
  const appendMessage = useCopilotChatStore((state) => state.appendMessage);
  const updateMessage = useCopilotChatStore((state) => state.updateMessage);

  const pipelineState = useWorkspaceStore((state) => state.pipelineState);
  const startAction = useWorkspaceStore((state) => state.startAction);
  const setPipelineState = useWorkspaceStore((state) => state.setPipelineState);
  const setCompleted = useWorkspaceStore((state) => state.setCompleted);
  const clearLogs = useWorkspaceStore((state) => state.clearLogs);
  const appendLog = useWorkspaceStore((state) => state.appendLog);
  const setIntermediateResults = useWorkspaceStore((state) => state.setIntermediateResults);
  const updateIntermediateResult = useWorkspaceStore((state) => state.updateIntermediateResult);
  const workspaceInput = useWorkspaceStore((state) => state.workspaceInput);
  const lastExperimentId = useWorkspaceStore((state) => state.lastExperimentId);
  const setLastExperimentId = useWorkspaceStore((state) => state.setLastExperimentId);

  const contextBadges = useMemo(
    () =>
      (Object.keys(CONTEXT_LABELS) as CopilotContext[]).map((key) => ({
        key,
        label: CONTEXT_LABELS[key],
      })),
    []
  );

  useEffect(() => {
    const history = historyRef.current;
    if (!history) {
      return;
    }

    history.scrollTop = history.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      pendingReplyTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      pendingReplyTimersRef.current = [];
      setIsAiThinking(false);
    };
  }, []);

  function createMockAssistantResponse(context: CopilotContext): string {
    const baseResponses: Record<CopilotContext, string[]> = {
      overview: [
        "Show chemical space: opening chart view for distribution analysis.",
        "Analyzing scientific context and preparing recommendations.",
      ],
      "molecule-analysis": [
        "Show molecule: opening 3D viewer for the lead candidate.",
        "Molecule profiling complete. Prioritizing candidates by potency and ADMET balance.",
      ],
      "similarity-search": [
        "Show results: opening ranked results table for nearest scaffolds.",
        "Docking complete. Best candidate found.",
      ],
      "experiment-planning": [
        "Show chemical space: opening chart view to compare experimental clusters.",
        "Docking complete. Best candidate found.",
      ],
      "risk-review": [
        "Show results: opening results table with risk-prioritized candidates.",
        "Evaluating liabilities and ranking risk severity.",
      ],
    };

    const options = baseResponses[context];
    const selected = Math.floor(Math.random() * options.length);
    return options[selected];
  }

  function pickMockToolName(context: CopilotContext): string {
    const tools: Record<CopilotContext, string[]> = {
      overview: ["generate_molecules", "fetch_workspace_context"],
      "molecule-analysis": ["generate_molecules", "analyze_physchem"],
      "similarity-search": ["search_similar_scaffolds", "run_docking"],
      "experiment-planning": ["draft_experiment_plan", "run_docking"],
      "risk-review": ["evaluate_admet_risk", "estimate_synthesis_complexity"],
    };

    const candidates = tools[context];
    const selected = Math.floor(Math.random() * candidates.length);
    return candidates[selected];
  }

  function queueAssistantReply(context: CopilotContext) {
    setIsAiThinking(true);

    const delay = 1000 + Math.floor(Math.random() * 1001);
    const toolName = pickMockToolName(context);
    const toolCallId = appendMessage({
      role: "assistant",
      content: `Running: ${toolName}()`,
      kind: "tool-call",
      status: "running",
      toolName,
    });

    const timerId = window.setTimeout(() => {
      const assistantResponse = createMockAssistantResponse(context);
      updateMessage(toolCallId, {
        content: `Completed: ${toolName}()`,
        status: "completed",
      });
      appendMessage({ role: "assistant", content: assistantResponse });
      setIsAiThinking(false);

      const canvasActionView = inferCanvasViewFromAssistantMessage(assistantResponse);
      setActiveView(canvasActionView ?? mapContextToCanvasView(context));

      pendingReplyTimersRef.current = pendingReplyTimersRef.current.filter((id) => id !== timerId);
    }, delay);

    pendingReplyTimersRef.current.push(timerId);
  }

  function scheduleTask(callback: () => void, delay: number) {
    const timerId = window.setTimeout(() => {
      callback();
      pendingReplyTimersRef.current = pendingReplyTimersRef.current.filter((id) => id !== timerId);
    }, delay);

    pendingReplyTimersRef.current.push(timerId);
  }

  function runMockPipelineFromChat(action: PipelineAction, context: CopilotContext) {
    setIsAiThinking(true);

    const actionLabel: Record<PipelineAction, string> = {
      generate: "Generate Molecules",
      docking: "Run Docking",
      pipeline: "Run Full Pipeline",
    };

    const toolName: Record<PipelineAction, string> = {
      generate: "generate_molecules",
      docking: "run_docking",
      pipeline: "run_full_pipeline",
    };

    startAction(action);
    clearLogs();
    setIntermediateResults(buildInitialResults(action));
    appendLog(`Chat trigger accepted: ${actionLabel[action]}`);

    const toolCallId = appendMessage({
      role: "assistant",
      content: `Running: ${toolName[action]}()`,
      kind: "tool-call",
      status: "running",
      toolName: toolName[action],
    });
    appendMessage({ role: "assistant", content: `${actionLabel[action]} started. Streaming progress updates.` });

    if (action === "generate") {
      setActiveView("molecule-viewer");
      setPipelineState("generating");

      scheduleTask(() => {
        setIsAiThinking(false);
        updateIntermediateResult("gen-sample", { status: "processing", progress: 60, value: "74 candidates generated" });
        appendLog("Generating molecular candidates");
        appendMessage({ role: "assistant", content: "Pipeline update: generation at 60%." });
      }, 900);

      scheduleTask(() => {
        updateIntermediateResult("gen-sample", { status: "ready", progress: 100, value: "128 candidates generated" });
        updateIntermediateResult("gen-filter", { status: "processing", progress: 75, value: "Applying physicochemical filters" });
        appendMessage({ role: "assistant", content: "Pipeline update: filtering generated set." });
      }, 1700);

      scheduleTask(() => {
        updateIntermediateResult("gen-filter", { status: "ready", progress: 100, value: "42 candidates passed screening" });
        setCompleted();
        appendLog("Generation stage completed");
        updateMessage(toolCallId, { content: `Completed: ${toolName[action]}()`, status: "completed" });

        const finalMessage = "Generation complete. Show results to inspect top candidates.";
        appendMessage({ role: "assistant", content: finalMessage });
        setActiveView(inferCanvasViewFromAssistantMessage(finalMessage) ?? "results-table");
        setActiveContext(context);
      }, 2600);

      return;
    }

    if (action === "docking") {
      setActiveView("results-table");
      setPipelineState("docking");

      scheduleTask(() => {
        setIsAiThinking(false);
        updateIntermediateResult("dock-grid", { status: "processing", progress: 55, value: "Docking grid initialized" });
        appendMessage({ role: "assistant", content: "Pipeline update: receptor grid prepared." });
      }, 900);

      scheduleTask(() => {
        updateIntermediateResult("dock-grid", { status: "ready", progress: 100 });
        updateIntermediateResult("dock-score", { status: "processing", progress: 78, value: "Scoring top ligand poses" });
        appendMessage({ role: "assistant", content: "Pipeline update: scoring in progress at 78%." });
      }, 1800);

      scheduleTask(() => {
        updateIntermediateResult("dock-score", { status: "ready", progress: 100, value: "Best affinity: -10.7 kcal/mol" });
        setCompleted();
        updateMessage(toolCallId, { content: `Completed: ${toolName[action]}()`, status: "completed" });
        const finalMessage = "Docking complete. Show results for ranked candidates.";
        appendMessage({ role: "assistant", content: finalMessage });
        setActiveView(inferCanvasViewFromAssistantMessage(finalMessage) ?? "results-table");
        setActiveContext(context);
      }, 2800);

      return;
    }

    setActiveView("charts");
    setPipelineState("running_full_pipeline");

    scheduleTask(() => {
      setIsAiThinking(false);
      setPipelineState("generating");
      updateIntermediateResult("pipe-gen", { status: "processing", progress: 58, value: "Generating initial molecular pool" });
      appendMessage({ role: "assistant", content: "Pipeline update: generation stage running." });
    }, 900);

    scheduleTask(() => {
      updateIntermediateResult("pipe-gen", { status: "ready", progress: 100, value: "132 molecules generated" });
      setPipelineState("docking");
      updateIntermediateResult("pipe-dock", { status: "processing", progress: 66, value: "Docking active set" });
      appendMessage({ role: "assistant", content: "Pipeline update: docking stage in progress." });
      setActiveView("results-table");
    }, 1900);

    scheduleTask(() => {
      updateIntermediateResult("pipe-dock", { status: "ready", progress: 100, value: "Top affinity: -10.9 kcal/mol" });
      updateIntermediateResult("pipe-rank", { status: "processing", progress: 78, value: "Ranking candidate quality" });
      appendMessage({ role: "assistant", content: "Pipeline update: ranking and triage underway." });
    }, 2800);

    scheduleTask(() => {
      updateIntermediateResult("pipe-rank", { status: "ready", progress: 100, value: "Top 20 candidates finalized" });
      setCompleted();
      updateMessage(toolCallId, { content: `Completed: ${toolName[action]}()`, status: "completed" });
      const finalMessage = "Full pipeline finished. Show chemical space and results for review.";
      appendMessage({ role: "assistant", content: finalMessage });
      setActiveView(inferCanvasViewFromAssistantMessage(finalMessage) ?? "charts");
      setActiveContext(context);
    }, 3600);
  }

  async function runGenerateMoleculesCommand(context: CopilotContext) {
    if (isPipelineRunning(pipelineState)) {
      appendMessage({
        role: "assistant",
        content: "A pipeline task is already running. Please wait for completion.",
      });
      return;
    }

    setIsAiThinking(true);
    startAction("pipeline");
    clearLogs();
    setIntermediateResults([
      {
        id: "pipeline-submit",
        label: "Pipeline Submission",
        value: "Submitting to backend",
        status: "processing",
        progress: 35,
      },
    ]);
    appendLog("Command accepted: generate molecules");

    const toolCallId = appendMessage({
      role: "assistant",
      content: "Running: POST /pipeline/run",
      kind: "tool-call",
      status: "running",
      toolName: "pipeline_run",
    });

    try {
      const response = await runPipeline({
        protein: workspaceInput.protein,
        constraints: workspaceInput.constraints,
      });
      await createPipelineExperiment({
        experiment_id: response.experimentId,
        protein: workspaceInput.protein,
      });

      setLastExperimentId(response.experimentId);
      setPipelineState("running_full_pipeline");
      updateIntermediateResult("pipeline-submit", {
        status: "ready",
        progress: 100,
        value: `Accepted (experiment ${response.experimentId})`,
      });
      appendLog(`Pipeline started: ${response.experimentId}`);

      updateMessage(toolCallId, {
        content: "Completed: POST /pipeline/run",
        status: "completed",
      });
      appendMessage({
        role: "assistant",
        content: "Pipeline started...",
      });
      appendMessage({
        role: "assistant",
        content: `Experiment ID: ${response.experimentId}`,
      });
      setActiveView("results-table");
      setActiveContext(context);
    } catch (error) {
      const message = toFriendlyErrorMessage(error, "Failed to start molecule generation.");
      setPipelineState("error");
      appendLog(`Pipeline start failed: ${message}`);
      updateMessage(toolCallId, {
        content: "Failed: POST /pipeline/run",
        status: "completed",
      });
      appendMessage({ role: "assistant", content: message });
    } finally {
      setIsAiThinking(false);
    }
  }

  async function runShowResultsCommand(rawInput: string, context: CopilotContext) {
    const requestedId = extractExperimentIdFromCommand(rawInput) ?? lastExperimentId;
    if (!requestedId) {
      appendMessage({
        role: "assistant",
        content:
          "No experiment id was found. Run \"generate molecules\" first or use \"show results <experiment_id>\".",
      });
      return;
    }

    setIsAiThinking(true);
    appendMessage({ role: "assistant", content: "Fetching results..." });
    const toolCallId = appendMessage({
      role: "assistant",
      content: `Running: GET /pipeline/results/${requestedId}`,
      kind: "tool-call",
      status: "running",
      toolName: "pipeline_results",
    });

    try {
      const payload = await getPipelineResult(requestedId);
      setLastExperimentId(requestedId);
      const summary = summarizeResultsPayload(payload);

      updateMessage(toolCallId, {
        content: `Completed: GET /pipeline/results/${requestedId}`,
        status: "completed",
      });
      appendMessage({
        role: "assistant",
        content: `Results loaded for ${requestedId}. ${summary}`,
      });
      setActiveView("results-table");
      setActiveContext(context);
    } catch (error) {
      const message = toFriendlyErrorMessage(error, `Failed to fetch results for ${requestedId}.`);
      updateMessage(toolCallId, {
        content: `Failed: GET /pipeline/results/${requestedId}`,
        status: "completed",
      });
      appendMessage({ role: "assistant", content: message });
    } finally {
      setIsAiThinking(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content) {
      return;
    }

    appendMessage({ role: "user", content });

    if (isGenerateMoleculesCommand(content)) {
      const context: CopilotContext = "molecule-analysis";
      await runGenerateMoleculesCommand(context);
      setActiveContext(context);
      setInput("");
      return;
    }

    if (isShowResultsCommand(content)) {
      const context: CopilotContext = "similarity-search";
      await runShowResultsCommand(content, context);
      setActiveContext(context);
      setInput("");
      return;
    }

    const pipelineCommand = inferPipelineCommand(content);
    if (pipelineCommand) {
      if (isPipelineRunning(pipelineState)) {
        appendMessage({ role: "assistant", content: "A pipeline task is already running. Please wait for completion." });
      } else {
        runMockPipelineFromChat(pipelineCommand.action, pipelineCommand.context);
      }

      setActiveContext(pipelineCommand.context);
      setInput("");
      return;
    }

    const inferred = inferContext(content);
    queueAssistantReply(inferred);
    setActiveContext(inferred);
    setInput("");
  }

  function handlePromptClick(prompt: string) {
    const inferred = inferContext(prompt);

    appendMessage({ role: "user", content: prompt });
    queueAssistantReply(inferred);
    setActiveContext(inferred);
  }

  function handleContextBadgeClick(context: CopilotContext) {
    setActiveContext(context);
    setActiveView(mapContextToCanvasView(context));
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isAiThinking) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  }

  return (
    <div className="h-full min-h-0">
      <div
        className="mb-4 rounded-[28px] border p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl"
        style={{
          borderColor: "color-mix(in srgb, var(--border) 80%, var(--accent))",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--card) 88%, transparent), color-mix(in srgb, var(--bg) 92%, var(--card)))",
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
              Virtual Scientific Lab
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
              AI Copilot Lab
            </h1>
            <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--muted-text)" }}>
              Orchestrate molecule generation, docking, and result review from one glass-morphism command surface.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Active Context", value: CONTEXT_LABELS[activeContext] },
              { label: "Pipeline", value: pipelineState.replace(/_/g, " ") },
              { label: "Experiment", value: lastExperimentId ?? "Not started" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border px-4 py-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--muted-text)" }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[32%_68%]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border shadow-[0_24px_80px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)" }}>
          <header className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Command Console</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Scientific Chat</h2>
          </header>

          <div className="grid gap-2 border-b px-5 py-3" style={{ borderColor: "var(--border)" }}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="rounded-2xl border px-3 py-2 text-left text-xs font-medium transition duration-300"
                style={{
                  borderColor: "var(--border)",
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--card) 75%, var(--muted-bg)), color-mix(in srgb, var(--muted-bg) 92%, var(--card)))",
                  color: "var(--text)",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div ref={historyRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message) => (
              message.kind === "tool-call" ? (
                <div key={message.id} className="copilot-message-enter flex justify-start">
                  <article className={`copilot-tool-call w-full max-w-[94%] rounded-xl px-3 py-2.5 ${message.status === "running" ? "running" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 pl-2 text-xs" style={{ color: "var(--warning)" }}>
                          <span className="rounded-full border px-2 py-0.5 font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--warning)", backgroundColor: "var(--muted-bg)" }}>
                          Tool
                        </span>
                          <span className="font-mono text-[12px] leading-5" style={{ color: "var(--text)" }}>{message.content}</span>
                      </div>
                      {message.status === "running" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--warning)" }}>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--warning)", animationDelay: "-0.2s" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--warning)", animationDelay: "-0.1s" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--warning)" }} />
                        </span>
                      ) : (
                          <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>Done</span>
                      )}
                    </div>
                  </article>
                </div>
              ) : (
              <div
                key={message.id}
                className={`copilot-message-enter ${message.role === "assistant" ? "flex justify-start" : "flex justify-end"}`}
              >
                <article
                  className={
                    message.role === "assistant"
                      ? "max-w-[92%] rounded-2xl rounded-bl-md border px-3.5 py-3 shadow-[0_10px_30px_-18px_rgba(56,189,248,0.75)]"
                      : "max-w-[88%] rounded-2xl rounded-br-md border px-3.5 py-3 shadow-[0_10px_30px_-18px_rgba(168,85,247,0.75)]"
                  }
                  style={{
                    borderColor: message.role === "assistant" ? "var(--accent-border)" : "var(--border)",
                    backgroundColor: message.role === "assistant" ? "var(--muted-bg)" : "var(--card)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text)" }}>
                      {message.role === "assistant" ? "Copilot" : "You"}
                    </span>
                    <span className="text-[11px] tracking-[0.04em]" style={{ color: "var(--muted-text)" }}>
                      {CONTEXT_LABELS[inferContext(message.content)]}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-6" style={{ color: "var(--text)" }}>
                    {message.content}
                  </p>
                </article>
              </div>
              )
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <label htmlFor="copilot-input" className="sr-only">
              Ask Copilot
            </label>
            <div className="grid gap-2.5">
              <div
                className={`overflow-hidden transition-all duration-300 ${isAiThinking ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: "var(--accent-border)", backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                  <span>AI is thinking...</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--accent)", animationDelay: "-0.2s" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--accent)", animationDelay: "-0.1s" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  </span>
                </div>
              </div>

              <textarea
                id="copilot-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about molecules, similarity, experiments, or risks..."
                rows={3}
                disabled={isAiThinking}
                className="w-full resize-none rounded-xl border px-3 py-2.5 text-[13px] leading-6 transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text)",
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs" style={{ color: "var(--muted-text)" }}>
                  {isAiThinking ? "Copilot is processing your request..." : "Press Enter to send, Shift+Enter for newline"}
                </p>
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="h-10 rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--accent-border)",
                    backgroundColor: "var(--accent-bg)",
                    color: "var(--accent-text)",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="relative min-h-0 overflow-hidden rounded-[28px] border shadow-[0_24px_80px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl" style={{ borderColor: "var(--border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--bg) 92%, var(--card)), color-mix(in srgb, var(--card) 90%, var(--bg)))" }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-10 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "var(--accent-glow)" }} />
            <div className="absolute right-10 top-6 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: "var(--accent-glow)" }} />
            <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full blur-3xl" style={{ backgroundColor: "var(--accent-glow)" }} />
          </div>

          <div className="relative flex h-full min-h-0 flex-col p-5">
            <div className="mb-4 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)" }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Experiment Status</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "State", value: pipelineState.replace(/_/g, " ") },
                  { label: "Active View", value: activeView.replace(/-/g, " ") },
                  { label: "Messages", value: String(messages.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)" }}>
                    <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>{item.label}</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {contextBadges.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleContextBadgeClick(key)}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{
                    borderColor: key === activeContext ? "var(--accent-border)" : "var(--border)",
                    backgroundColor: key === activeContext ? "var(--accent-bg)" : "var(--card)",
                    color: key === activeContext ? "var(--accent-text)" : "var(--muted-text)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <DynamicCanvasPanel view={activeView} contextLabel={CONTEXT_LABELS[activeContext]} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}