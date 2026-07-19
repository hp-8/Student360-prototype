import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--paper-line)] rounded-lg shadow-[0_1px_2px_rgba(28,35,51,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4 pb-5 border-b border-[var(--paper-line)]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--navy-deep)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--ink-soft)] mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h2 className="font-mono text-[0.6875rem] font-semibold text-[var(--brass-ink)] uppercase tracking-[0.08em]">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--ink-soft)]/60 italic py-3">{children}</p>;
}

const BADGE_COLORS: Record<string, string> = {
  slate: "bg-[var(--status-slate-bg)] text-[var(--status-slate-fg)] border-[var(--status-slate-fg)]/20",
  green: "bg-[var(--status-green-bg)] text-[var(--status-green-fg)] border-[var(--status-green-fg)]/25",
  red: "bg-[var(--status-red-bg)] text-[var(--status-red-fg)] border-[var(--status-red-fg)]/25",
  amber: "bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)] border-[var(--status-amber-fg)]/25",
  blue: "bg-[var(--status-blue-bg)] text-[var(--status-blue-fg)] border-[var(--status-blue-fg)]/25",
  purple: "bg-[var(--status-purple-bg)] text-[var(--status-purple-fg)] border-[var(--status-purple-fg)]/25",
};

export type BadgeColor = keyof typeof BADGE_COLORS;

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: BadgeColor;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wide ${BADGE_COLORS[color]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "submit",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "submit" | "button";
  className?: string;
}) {
  const styles = {
    primary: "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)] shadow-sm",
    secondary:
      "bg-[var(--card)] text-[var(--ink)] border border-[var(--paper-line)] hover:border-[var(--brass-soft)] hover:text-[var(--brass-ink)]",
    danger: "bg-[var(--oxblood)] text-white hover:brightness-110 shadow-sm",
  };
  return (
    <button
      type={type}
      className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-[160ms] ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-[var(--paper-line)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/40 focus:border-[var(--brass)]/60";
