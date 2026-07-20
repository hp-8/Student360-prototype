import Link from "next/link";

export const SEGMENT_COLOR: Record<string, string> = {
  slate: "bg-slate-300",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  purple: "bg-violet-500",
};

export type Segment = {
  label: string;
  value: number;
  color: keyof typeof SEGMENT_COLOR;
  href?: string;
};

export function SegmentedBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-[var(--paper)]">
        {segments.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                className={SEGMENT_COLOR[s.color]}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            )
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
        {segments.map((s) => {
          const row = (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[var(--ink-soft)]">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEGMENT_COLOR[s.color]}`} />
                {s.label}
              </span>
              <span className="font-medium text-[var(--ink)]">{s.value}</span>
            </div>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link href={s.href} className="block hover:opacity-70 transition-opacity">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
