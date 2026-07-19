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
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900">Student360</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Visa consultancy case management
          </p>
          <LoginForm />
        </div>
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-6 text-sm">
          <h2 className="font-medium text-slate-900 mb-3">
            Demo accounts (password: <code>password123</code>)
          </h2>
          <ul className="space-y-1.5">
            {DEMO_USERS.map((u) => (
              <li key={u.email} className="flex justify-between gap-4">
                <span className="text-slate-600">{u.role}</span>
                <code className="text-slate-900">{u.email}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
