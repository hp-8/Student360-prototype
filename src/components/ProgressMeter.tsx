export function ProgressMeter({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm text-[var(--ink-soft)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--ink)]">{pct}%</p>
      </div>
      <div className="w-full h-2 rounded-full bg-[var(--paper)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--navy)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption && <p className="text-xs text-[var(--ink-faint)] mt-1.5">{caption}</p>}
    </div>
  );
}
