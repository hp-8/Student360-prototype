import type { QueueCounts } from "@/lib/domain/workQueue";

export function QueueTiles({ counts, dense = false }: { counts: QueueCounts; dense?: boolean }) {
  const tiles: { label: string; value: number; color: string }[] = [
    { label: "Assigned", value: counts.assigned, color: "text-[var(--navy-deep)]" },
    { label: "Overdue", value: counts.overdue, color: "text-[var(--status-red-fg)]" },
    { label: "Blocked", value: counts.blocked, color: "text-[var(--status-amber-fg)]" },
    { label: "Completed", value: counts.completed, color: "text-[var(--status-green-fg)]" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`border border-[var(--paper-line)] rounded-md flex flex-col gap-1 ${dense ? "px-3 py-2" : "px-3 py-2.5"}`}
        >
          <p className="font-mono text-[0.625rem] text-[var(--brass-ink)] uppercase tracking-wide font-semibold">
            {t.label}
          </p>
          <span className={`font-mono font-semibold ${dense ? "text-lg" : "text-2xl"} ${t.color}`}>
            {t.value}
          </span>
        </div>
      ))}
    </div>
  );
}
