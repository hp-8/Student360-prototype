import Link from "next/link";

export type StatTile = {
  label: string;
  value: number;
  color?: string;
  href?: string;
};

// Generic metric-tile grid shared across every role's dashboard. A tile is a
// plain <div> when it has no href, or a <Link> when it does - callers decide
// whether a number is worth clicking through on.
export function StatTiles({ tiles, dense = false }: { tiles: StatTile[]; dense?: boolean }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
      {tiles.map((t) => {
        const content = (
          <>
            <p className="text-xs text-[var(--ink-soft)] font-medium">{t.label}</p>
            <span className={`font-semibold ${dense ? "text-lg" : "text-2xl"} ${t.color ?? "text-[var(--ink)]"}`}>
              {t.value}
            </span>
          </>
        );
        const className = `bg-[var(--paper)] rounded-xl flex flex-col gap-1 ${dense ? "px-3 py-2" : "px-3.5 py-3"}`;

        return t.href ? (
          <Link
            key={t.label}
            href={t.href}
            className={`${className} hover:bg-[var(--paper-line-soft)] transition-colors`}
          >
            {content}
          </Link>
        ) : (
          <div key={t.label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
