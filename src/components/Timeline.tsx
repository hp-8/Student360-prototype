import Link from "next/link";
import type { TimelineEntry } from "@/lib/domain/timeline";

const DOT_COLOR: Record<string, string> = {
  positive: "bg-[var(--status-green-fg)]",
  negative: "bg-[var(--status-red-fg)]",
  neutral: "bg-[var(--navy)]",
  upcoming: "bg-[var(--status-amber-fg)]",
};

function toneFor(entry: TimelineEntry): "positive" | "negative" | "neutral" | "upcoming" {
  return entry.tone ?? "neutral";
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--ink-soft)]/60 italic py-3">No history yet.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-5 pl-5">
      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-[var(--paper-line)]" />
      {entries.map((entry, i) => {
        const tone = toneFor(entry);
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-[var(--paper)] ${DOT_COLOR[tone]}`}
            />
            <p className="text-xs text-[var(--ink-faint)] font-medium">
              {entry.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </p>
            {entry.href ? (
              <Link
                href={entry.href}
                className={`text-sm font-medium hover:underline ${
                  tone === "positive"
                    ? "text-[var(--status-green-fg)]"
                    : tone === "negative"
                      ? "text-[var(--status-red-fg)]"
                      : tone === "upcoming"
                        ? "text-[var(--status-amber-fg)]"
                        : "text-[var(--ink)]"
                }`}
              >
                {entry.label}
              </Link>
            ) : (
              <p
                className={`text-sm font-medium ${
                  tone === "positive"
                    ? "text-[var(--status-green-fg)]"
                    : tone === "negative"
                      ? "text-[var(--status-red-fg)]"
                      : tone === "upcoming"
                        ? "text-[var(--status-amber-fg)]"
                        : "text-[var(--ink)]"
                }`}
              >
                {entry.label}
              </p>
            )}
            {entry.description && (
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">{entry.description}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
