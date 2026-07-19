import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABEL, NAV_BY_ROLE } from "@/lib/roles";
import { logoutAction } from "@/app/logout/actions";

export function AppHeader({ session }: { session: SessionUser }) {
  const navItems = NAV_BY_ROLE[session.role];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-900">
            Student360
          </Link>
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {session.name}{" "}
            <span className="text-slate-400">· {ROLE_LABEL[session.role]}</span>
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
