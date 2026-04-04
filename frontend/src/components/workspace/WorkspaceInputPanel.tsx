"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { useWorkspaceStore } from "@/store";
import {
  NumberSliderField,
  ProteinSequenceField,
  SelectField,
} from "@/components/workspace/WorkspaceInputFields";

const toxicityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
] as const;

export default function WorkspaceInputPanel() {
  const [proteinSequence, setProteinSequence] = useState(
    "MNSRSLVQEP...GQGAFGTVYKGLWIPEGEK",
  );
  const [logP, setLogP] = useState(2.4);
  const [qed, setQed] = useState(0.78);
  const [toxicity, setToxicity] = useState("Low");

  const pipelineState = useWorkspaceStore((s) => s.pipelineState);
  const isPipelineRunning =
    pipelineState === "generating" ||
    pipelineState === "docking" ||
    pipelineState === "running_full_pipeline";

  return (
    <Card className="border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/40 transition-all duration-300">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Input</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">Protein + Constraints</h2>
        <p className="mt-1.5 text-xs leading-6 text-slate-400">
          Define biological context and property thresholds before launching a run.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <ProteinSequenceField
          id="workspace-protein-sequence"
          label="Protein Sequence"
          value={proteinSequence}
          onChange={setProteinSequence}
          disabled={isPipelineRunning}
          helperText="Paste FASTA sequence text for the target protein."
          placeholder="MENFQKVEKIGEGTYGVVYKARNKLTGE..."
        />

        <Card className="border-slate-700/80 bg-slate-950/60 transition-all duration-300">
          <CardHeader className="px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-100">Constraints</h3>
            <p className="mt-1 text-xs text-slate-400">Tune chemistry and safety bounds for candidate generation.</p>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 py-4">
            <NumberSliderField
              id="workspace-logp"
              label="LogP"
              value={logP}
              onChange={setLogP}
              disabled={isPipelineRunning}
              min={-2}
              max={7}
              step={0.1}
              helperText="Controls lipophilicity. Typical drug-like range is around 1 to 3."
            />

            <NumberSliderField
              id="workspace-qed"
              label="QED"
              value={qed}
              onChange={setQed}
              disabled={isPipelineRunning}
              min={0}
              max={1}
              step={0.01}
              helperText="Higher values prioritize compounds with stronger drug-likeness."
            />

            <SelectField
              id="workspace-toxicity"
              label="Toxicity"
              value={toxicity}
              onChange={setToxicity}
              disabled={isPipelineRunning}
              options={[...toxicityOptions]}
              helperText="Low is strictest; High allows broader exploration."
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
