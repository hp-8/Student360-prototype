import Link from "next/link";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  Inbox,
  ListChecks,
  FileText,
  Plane,
  PlusCircle,
  Gauge,
  Users2,
  Settings,
  Building2,
  Globe,
  ClipboardList,
  LogOut,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABEL, NAV_BY_ROLE } from "@/lib/roles";
import { logoutAction } from "@/app/logout/actions";
import { RoleSwitcher } from "@/components/RoleSwitcher";

const ICON_BY_HREF: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "/front-desk": Inbox,
  "/front-desk/students": Users,
  "/counsellor": Users,
  "/work-items": ListChecks,
  "/applications": FileText,
  "/visa": Plane,
  "/visa/new": PlusCircle,
  "/manager": LayoutDashboard,
  "/manager/workload": Gauge,
  "/manager/assignments": Users2,
  "/manager/students": Users,
  "/admin": Settings,
  "/admin/branches": Building2,
  "/admin/countries": Globe,
  "/admin/templates": ClipboardList,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({ session }: { session: SessionUser }) {
  const navItems = NAV_BY_ROLE[session.role];

  return (
    <aside className="w-64 shrink-0 h-full bg-[var(--card)] border-r border-[var(--paper-line)] flex flex-col">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--paper-line)]">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--navy)] text-white font-semibold text-sm">
          S
        </span>
        <span className="font-semibold text-[var(--ink)] tracking-tight">Student360</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 text-xs font-medium text-[var(--ink-faint)] mb-2">Main menu</p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = ICON_BY_HREF[item.href] ?? LayoutDashboard;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                >
                  <Icon size={17} className="shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--paper-line)] p-3 flex flex-col gap-2">
        {session.roles.length > 1 && <RoleSwitcher roles={session.roles} activeRole={session.role} />}
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--status-blue-bg)] text-[var(--status-blue-fg)] text-xs font-semibold shrink-0">
            {initials(session.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--ink)] truncate">{session.name}</p>
            <p className="text-xs text-[var(--ink-faint)] truncate">{ROLE_LABEL[session.role]}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Log out"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
