import Link from "next/link";
import type { LanedTimelineEntry } from "@/lib/domain/timeline";

const ROW_HEIGHT = 72;
const LANE_GAP = 22;
const BASE_X = 14;
const DOT_RADIUS = 5;

// Lane 0 is the trunk; branch lanes cycle through this palette so each study
// option keeps a consistent, distinguishable color across its own fork/merge.
const LANE_COLORS = [
  "var(--ink-soft)",
  "oklch(58% 0.17 265)",
  "oklch(55% 0.15 300)",
  "oklch(55% 0.14 190)",
  "oklch(55% 0.16 40)",
];

const TONE_COLOR: Record<string, string> = {
  positive: "var(--status-green-fg)",
  negative: "var(--status-red-fg)",
  upcoming: "var(--status-amber-fg)",
};

const TONE_TEXT_CLASS: Record<string, string> = {
  positive: "text-[var(--status-green-fg)]",
  negative: "text-[var(--status-red-fg)]",
  upcoming: "text-[var(--status-amber-fg)]",
};

function laneColor(lane: number) {
  return LANE_COLORS[lane % LANE_COLORS.length];
}

function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

export function JourneyGraph({ entries }: { entries: LanedTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--ink-soft)]/60 italic py-3">No history yet.</p>;
  }

  const maxLane = Math.max(...entries.map((e) => e.lane));
  const svgWidth = BASE_X * 2 + maxLane * LANE_GAP;
  const svgHeight = entries.length * ROW_HEIGHT;

  const rowsByLane = new Map<number, number[]>();
  entries.forEach((entry, row) => {
    if (!rowsByLane.has(entry.lane)) rowsByLane.set(entry.lane, []);
    rowsByLane.get(entry.lane)!.push(row);
  });

  const yCenter = (row: number) => row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const xFor = (lane: number) => BASE_X + lane * LANE_GAP;

  const paths: { d: string; color: string; key: string }[] = [];

  // The straight run of each lane, connecting its own consecutive rows.
  for (const [lane, rows] of rowsByLane) {
    for (let i = 0; i < rows.length - 1; i++) {
      paths.push({
        d: `M ${xFor(lane)} ${yCenter(rows[i])} L ${xFor(lane)} ${yCenter(rows[i + 1])}`,
        color: laneColor(lane),
        key: `line-${lane}-${i}`,
      });
    }
  }

  // Fork: where a branch lane first appears, curve it out of the trunk.
  for (const [lane, rows] of rowsByLane) {
    if (lane === 0) continue;
    const firstRow = rows[0];
    if (firstRow > 0) {
      paths.push({
        d: curvePath(xFor(0), yCenter(firstRow - 1), xFor(lane), yCenter(firstRow)),
        color: laneColor(lane),
        key: `fork-${lane}`,
      });
    }
  }

  // Merge: where a trunk entry (e.g. country confirmed) absorbs branches back in.
  entries.forEach((entry, row) => {
    entry.mergesLanes?.forEach((lane) => {
      const rows = rowsByLane.get(lane);
      if (!rows) return;
      const lastRow = rows[rows.length - 1];
      if (lastRow < row) {
        paths.push({
          d: curvePath(xFor(lane), yCenter(lastRow), xFor(0), yCenter(row)),
          color: laneColor(lane),
          key: `merge-${lane}-${row}`,
        });
      }
    });
  });

  return (
    <div className="relative" style={{ minHeight: svgHeight }}>
      <svg width={svgWidth} height={svgHeight} className="absolute left-0 top-0 overflow-visible">
        {paths.map((p) => (
          <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeOpacity={0.5} />
        ))}
        {entries.map((entry, row) => (
          <circle
            key={`dot-${row}`}
            cx={xFor(entry.lane)}
            cy={yCenter(row)}
            r={DOT_RADIUS}
            fill={entry.tone ? (TONE_COLOR[entry.tone] ?? laneColor(entry.lane)) : laneColor(entry.lane)}
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
      </svg>
      <ol className="flex flex-col" style={{ paddingLeft: svgWidth + 14 }}>
        {entries.map((entry, row) => {
          const textClass = entry.tone ? (TONE_TEXT_CLASS[entry.tone] ?? "text-[var(--ink)]") : "text-[var(--ink)]";
          return (
            <li key={row} style={{ height: ROW_HEIGHT }} className="flex flex-col justify-center min-w-0">
              <p className="text-xs text-[var(--ink-faint)] font-medium">
                {entry.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </p>
              {entry.href ? (
                <Link href={entry.href} className={`text-sm font-medium hover:underline truncate ${textClass}`}>
                  {entry.label}
                </Link>
              ) : (
                <p className={`text-sm font-medium truncate ${textClass}`}>{entry.label}</p>
              )}
              {entry.description && (
                <p className="text-xs text-[var(--ink-soft)] truncate">{entry.description}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
