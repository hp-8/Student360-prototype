import { getSession, ROLE_HOME } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

const DEMO_USERS = [
  { role: "Front Desk", email: "frontdesk@student360.test" },
  { role: "Counsellor", email: "counsellor@student360.test" },
  { role: "Applications Team", email: "applications@student360.test" },
  { role: "Visa Team", email: "visateam@student360.test" },
  { role: "Manager", email: "manager@student360.test" },
  { role: "Administrator", email: "admin@student360.test" },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-stretch">
        <div className="bg-white rounded-xl border border-[var(--paper-line)] shadow-[0_1px_3px_rgba(28,35,51,0.06)] p-9">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[var(--navy)] text-white font-display text-base font-semibold">
              S
            </span>
            <h1 className="font-display text-xl font-semibold text-[var(--navy-deep)]">
              Student360
            </h1>
          </div>
          <p className="text-sm text-[var(--ink-soft)] mt-1 mb-7">
            Visa consultancy case management
          </p>
          <LoginForm />
        </div>
        <div className="rounded-xl border border-[var(--paper-line)] p-7 text-sm bg-[var(--navy-deep)] text-white/90 flex flex-col">
          <h2 className="font-display font-medium text-white mb-1">
            Demo accounts
          </h2>
          <p className="text-white/50 text-xs mb-5">
            Password for all: <code className="text-[var(--brass-soft)]">password123</code>
          </p>
          <ul className="space-y-2.5">
            {DEMO_USERS.map((u) => (
              <li
                key={u.email}
                className="flex justify-between gap-4 pb-2.5 border-b border-white/10 last:border-0"
              >
                <span className="text-white/60">{u.role}</span>
                <code className="text-white/90">{u.email}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
