import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABEL, NAV_BY_ROLE } from "@/lib/roles";
import { logoutAction } from "@/app/logout/actions";

export function AppHeader({ session }: { session: SessionUser }) {
  const navItems = NAV_BY_ROLE[session.role];

  return (
    <header className="border-b border-[var(--paper-line)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-[7px] bg-[var(--navy)] text-white font-display text-sm font-semibold">
              S
            </span>
            <span className="font-display font-semibold text-[var(--navy-deep)] tracking-tight">
              Student360
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-[var(--ink-soft)] hover:text-[var(--navy)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--ink-soft)] hidden sm:inline">
            {session.name}{" "}
            <span className="text-[var(--brass)]">· {ROLE_LABEL[session.role]}</span>
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-[var(--ink-soft)] hover:text-[var(--navy)] border border-[var(--paper-line)] hover:border-[var(--navy)]/30 rounded-md px-3 py-1 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
