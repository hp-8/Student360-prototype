"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
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
  CalendarClock,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABEL, NAV_BY_ROLE } from "@/lib/roles";
import { logoutAction } from "@/app/logout/actions";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

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
  "/admin/intakes": CalendarClock,
  "/admin/templates": ClipboardList,
};

const COLLAPSE_STORAGE_KEY = "s360-sidebar-collapsed";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: Date;
};

export function Sidebar({
  session,
  notifications,
}: {
  session: SessionUser;
  notifications: NotificationItem[];
}) {
  const navItems = NAV_BY_ROLE[session.role];
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`shrink-0 h-full bg-[var(--card)] border-r border-[var(--paper-line)] flex flex-col transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-[var(--paper-line)]">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--navy)] text-white font-semibold text-sm shrink-0">
          S
        </span>
        {!collapsed && (
          <>
            <span className="font-semibold text-[var(--ink)] tracking-tight truncate flex-1">Student360</span>
            <NotificationBell notifications={notifications} />
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && <p className="px-3 text-xs font-medium text-[var(--ink-faint)] mb-2">Main menu</p>}
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = ICON_BY_HREF[item.href] ?? LayoutDashboard;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors ${
                    collapsed ? "justify-center px-2" : "px-3"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--paper-line)] p-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex items-center gap-2.5 rounded-lg py-2 text-sm text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          {!collapsed && "Collapse"}
        </button>

        {!collapsed && session.roles.length > 1 && (
          <RoleSwitcher roles={session.roles} activeRole={session.role} />
        )}

        <div className={`flex items-center gap-2.5 rounded-lg py-2 ${collapsed ? "justify-center px-0" : "px-2"}`}>
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--status-blue-bg)] text-[var(--status-blue-fg)] text-xs font-semibold shrink-0">
            {initials(session.name)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--ink)] truncate">{session.name}</p>
              <p className="text-xs text-[var(--ink-faint)] truncate">{ROLE_LABEL[session.role]}</p>
            </div>
          )}
          {!collapsed && (
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Log out"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
              >
                <LogOut size={16} />
              </button>
            </form>
          )}
        </div>
        {collapsed && (
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Log out"
              title="Log out"
              className="w-full flex items-center justify-center py-2 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
