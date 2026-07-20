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
      className={`bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-[var(--shadow-card)] ${className}`}
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
        <h1 className="text-2xl font-semibold text-[var(--ink)]">{title}</h1>
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
      <h2 className="text-sm font-semibold text-[var(--ink)]">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--ink-soft)]/60 italic py-3">{children}</p>;
}

const BADGE_COLORS: Record<string, string> = {
  slate: "bg-[var(--status-slate-bg)] text-[var(--status-slate-fg)]",
  green: "bg-[var(--status-green-bg)] text-[var(--status-green-fg)]",
  red: "bg-[var(--status-red-bg)] text-[var(--status-red-fg)]",
  amber: "bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)]",
  blue: "bg-[var(--status-blue-bg)] text-[var(--status-blue-fg)]",
  purple: "bg-[var(--status-purple-bg)] text-[var(--status-purple-fg)]",
};

const DOT_COLORS: Record<string, string> = {
  slate: "bg-[var(--status-slate-fg)]",
  green: "bg-[var(--status-green-fg)]",
  red: "bg-[var(--status-red-fg)]",
  amber: "bg-[var(--status-amber-fg)]",
  blue: "bg-[var(--status-blue-fg)]",
  purple: "bg-[var(--status-purple-fg)]",
};

export type BadgeColor = keyof typeof BADGE_COLORS;

export function Badge({
  children,
  color = "slate",
  dot = true,
}: {
  children: ReactNode;
  color?: BadgeColor;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_COLORS[color]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color]}`} />}
      {children}
    </span>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[var(--status-blue-bg)] text-[var(--status-blue-fg)] font-semibold shrink-0 ring-2 ring-[var(--card)]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
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
      "bg-[var(--card)] text-[var(--ink)] border border-[var(--paper-line)] hover:border-[var(--navy)]/40 hover:text-[var(--navy)]",
    danger: "bg-[var(--oxblood)] text-white hover:brightness-110 shadow-sm",
  };
  return (
    <button
      type={type}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-[160ms] ${styles[variant]} ${className}`}
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
  "w-full rounded-lg border border-[var(--paper-line)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/30 focus:border-[var(--navy)]/50";
