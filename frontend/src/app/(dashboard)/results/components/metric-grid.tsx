import { Tooltip } from "@/components/shared";

interface MetricGridProps {
  items: Array<{ label: string; value: string | number }>;
}

function metricHint(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("logp")) return "LogP indicates lipophilicity.";
  if (normalized.includes("qed")) return "QED estimates drug-likeness quality.";
  return "Summary metric from current results overview.";
}

export function MetricGrid({ items }: MetricGridProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="ui-hover-lift ui-state-transition rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.04] hover:shadow-[0_10px_30px_rgba(15,23,42,0.2)]"
        >
          <Tooltip content={metricHint(item.label)}>
            <p className="cursor-help text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {item.label}
            </p>
          </Tooltip>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
