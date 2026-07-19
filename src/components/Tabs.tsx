"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--paper-line)] mb-5 sticky top-16 bg-[var(--paper)] z-[1] -mx-1 px-1 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3 py-2 font-mono text-[0.7rem] font-semibold uppercase tracking-wide border-b-2 -mb-px whitespace-nowrap transition-colors duration-[160ms] ${
              i === active
                ? "border-[var(--brass)] text-[var(--brass-ink)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--navy)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} className={i === active ? "flex flex-col gap-6" : "hidden"}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
