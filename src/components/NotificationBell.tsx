"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/notifications/actions";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--oxblood)] text-white text-[10px] font-semibold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-[var(--shadow-card-hover)] z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--paper-line)]">
              <p className="text-sm font-semibold text-[var(--ink)]">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsReadAction()}
                  className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--ink-faint)] text-center">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col">
                {notifications.map((n) => (
                  <li key={n.id} className="border-b border-[var(--paper-line)] last:border-0">
                    <Link
                      href={n.href ?? "#"}
                      onClick={() => {
                        setOpen(false);
                        if (!n.read) markNotificationReadAction(n.id);
                      }}
                      className={`block px-4 py-3 hover:bg-[var(--paper)] transition-colors ${
                        !n.read ? "bg-[var(--status-blue-bg)]/30" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-[var(--ink)]">{n.title}</p>
                      {n.body && <p className="text-xs text-[var(--ink-soft)] mt-0.5">{n.body}</p>}
                      <p className="text-xs text-[var(--ink-faint)] mt-1">
                        {n.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
