"use client";

/* Hallmark · component redesign · genre: modern-minimal (existing product)
 * tokens: preserved from app/globals.css (oklch ink/paper/status palette, Inter)
 * states: default · hover (lane trace) · focus-visible · reduced-motion
 */

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import type { LanedTimelineEntry } from "@/lib/domain/timeline";

const ROW_HEIGHT = 76;
const LANE_GAP = 22;
const BASE_X = 14;
const DOT_RADIUS = 5;

const DEAD_STATUSES = new Set(["WITHDRAWN", "REJECTED", "UNSUCCESSFUL"]);

// Lane 0 is the trunk; branch lanes cycle through this palette so each study
// option keeps a consistent, distinguishable color across its own fork/end.
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

type LaneOutcome = "merged" | "not-pursued" | "open";

export function JourneyGraph({ entries }: { entries: LanedTimelineEntry[] }) {
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);

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

  // Which branch lanes get absorbed into the trunk, and where.
  const mergedLanes = new Set<number>();
  entries.forEach((entry) => entry.mergesLanes?.forEach((lane) => mergedLanes.add(lane)));

  // For every non-trunk lane, work out how its story ends: folded into the
  // path actually being pursued, explicitly withdrawn/rejected, or simply
  // still open with nothing decided yet.
  const laneOutcome = new Map<number, LaneOutcome>();
  for (const [lane, rows] of rowsByLane) {
    if (lane === 0) continue;
    if (mergedLanes.has(lane)) {
      laneOutcome.set(lane, "merged");
      continue;
    }
    const lastEntry = entries[rows[rows.length - 1]];
    laneOutcome.set(
      lane,
      lastEntry.studyOptionStatus && DEAD_STATUSES.has(lastEntry.studyOptionStatus) ? "not-pursued" : "open"
    );
  }

  const hasBranches = maxLane > 0;

  const yCenter = (row: number) => row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const xFor = (lane: number) => BASE_X + lane * LANE_GAP;

  const paths: { d: string; color: string; key: string; lane: number }[] = [];

  // The straight run of each lane, connecting its own consecutive rows.
  for (const [lane, rows] of rowsByLane) {
    for (let i = 0; i < rows.length - 1; i++) {
      paths.push({
        d: `M ${xFor(lane)} ${yCenter(rows[i])} L ${xFor(lane)} ${yCenter(rows[i + 1])}`,
        color: laneColor(lane),
        key: `line-${lane}-${i}`,
        lane,
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
        lane,
      });
    }
  }

  // Merge: where a trunk entry (the visa application actually pursued) absorbs a branch back in.
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
          lane,
        });
      }
    });
  });

  return (
    <div>
      {hasBranches && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-xs text-[var(--ink-faint)]">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="10" aria-hidden="true">
              <circle cx="5" cy="5" r="4" fill="var(--ink-soft)" />
            </svg>
            merged into the path being pursued
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="10" aria-hidden="true">
              <circle cx="5" cy="5" r="4" fill="var(--card)" stroke="var(--ink-faint)" strokeWidth="1.5" />
            </svg>
            not pursued further
          </span>
        </div>
      )}
      <div className="relative" style={{ minHeight: svgHeight }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="absolute left-0 top-0 overflow-visible"
          aria-hidden="true"
        >
          {paths.map((p) => {
            const dimmed = hoveredLane !== null && hoveredLane !== 0 && p.lane !== 0 && p.lane !== hoveredLane;
            return (
              <path
                key={p.key}
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth={hoveredLane === p.lane && p.lane !== 0 ? 3 : 2}
                strokeOpacity={dimmed ? 0.15 : 0.55}
                style={{ transition: "stroke-opacity 150ms var(--ease-out, ease), stroke-width 150ms var(--ease-out, ease)" }}
              />
            );
          })}
          {entries.map((entry, row) => {
            const rows = rowsByLane.get(entry.lane)!;
            const isLastOfLane = rows[rows.length - 1] === row;
            const outcome = entry.lane !== 0 && isLastOfLane ? laneOutcome.get(entry.lane) : undefined;
            const isHollow = outcome === "not-pursued" || outcome === "open";
            const dimmed = hoveredLane !== null && hoveredLane !== 0 && entry.lane !== 0 && entry.lane !== hoveredLane;
            const color = entry.tone ? (TONE_COLOR[entry.tone] ?? laneColor(entry.lane)) : laneColor(entry.lane);
            return (
              <circle
                key={`dot-${row}`}
                cx={xFor(entry.lane)}
                cy={yCenter(row)}
                r={DOT_RADIUS}
                fill={isHollow ? "var(--card)" : color}
                stroke={isHollow ? color : "var(--card)"}
                strokeWidth={isHollow ? 2 : 2}
                style={{
                  transition: "opacity 150ms var(--ease-out, ease)",
                  opacity: dimmed ? 0.3 : 1,
                }}
              />
            );
          })}
        </svg>
        <ol className="flex flex-col" style={{ paddingLeft: svgWidth + 14 }}>
          {entries.map((entry, row) => {
            const rows = rowsByLane.get(entry.lane)!;
            const isLastOfLane = rows[rows.length - 1] === row;
            const outcome = entry.lane !== 0 && isLastOfLane ? laneOutcome.get(entry.lane) : undefined;
            const textClass = entry.tone ? (TONE_TEXT_CLASS[entry.tone] ?? "text-[var(--ink)]") : "text-[var(--ink)]";
            const dimmed = hoveredLane !== null && hoveredLane !== 0 && entry.lane !== 0 && entry.lane !== hoveredLane;
            return (
              <li
                key={row}
                style={{ height: ROW_HEIGHT }}
                className="flex flex-col justify-center min-w-0"
                onMouseEnter={() => entry.lane !== 0 && setHoveredLane(entry.lane)}
                onMouseLeave={() => setHoveredLane(null)}
              >
                <div
                  className="rounded-md -mx-2 px-2 py-1 transition-[background-color,opacity] duration-150"
                  style={{
                    opacity: dimmed ? 0.4 : 1,
                    backgroundColor: hoveredLane === entry.lane && entry.lane !== 0 ? "var(--paper)" : "transparent",
                  }}
                >
                  <p className="text-xs text-[var(--ink-faint)] font-medium">
                    {entry.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {entry.href ? (
                      <Link
                        href={entry.href}
                        className={`text-sm font-semibold hover:underline truncate rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/40 ${textClass}`}
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <p className={`text-sm font-semibold truncate ${textClass}`}>{entry.label}</p>
                    )}
                    {outcome === "not-pursued" && <Badge color="slate">Not pursued</Badge>}
                    {outcome === "open" && <Badge color="amber">No decision yet</Badge>}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-[var(--ink-soft)] truncate">{entry.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
