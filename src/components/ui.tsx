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
      <h2 className="text-xs font-semibold text-[var(--brass)] uppercase tracking-[0.08em]">
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
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  red: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/15",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[color]}`}
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
    primary:
      "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)] shadow-sm",
    secondary:
      "bg-white text-[var(--ink)] border border-[var(--paper-line)] hover:border-[var(--brass-soft)] hover:text-[var(--brass)]",
    danger: "bg-rose-700 text-white hover:bg-rose-800 shadow-sm",
  };
  return (
    <button
      type={type}
      className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${styles[variant]} ${className}`}
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
  "w-full rounded-md border border-[var(--paper-line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/30 focus:border-[var(--navy)]/50";
