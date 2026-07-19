import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, Field, inputClass, Button } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/roles";
import { createUserAction, toggleUserActiveAction } from "./actions";

const ROLES = [
  "FRONT_DESK",
  "COUNSELLOR",
  "APPLICATIONS_TEAM",
  "VISA_TEAM",
  "MANAGER",
  "ADMINISTRATOR",
] as const;

export default async function AdminUsersPage() {
  await requireRole("ADMINISTRATOR");

  const [users, branches] = await Promise.all([
    prisma.user.findMany({ include: { branch: true }, orderBy: { createdAt: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Configuration only. Administrators do not manage live student, application or visa records."
      />

      <Card className="p-5">
        <SectionTitle>All users</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Branch</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{ROLE_LABEL[u.role]}</td>
                <td className="py-2">{u.branch?.name ?? "—"}</td>
                <td className="py-2">
                  <Badge color={u.active ? "green" : "slate"}>
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="active" value={String(u.active)} />
                    <button className="text-sm underline">
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <SectionTitle>Create user</SectionTitle>
        <form action={createUserAction} className="grid grid-cols-3 gap-3">
          <Field label="Name">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className={inputClass} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required minLength={6} className={inputClass} />
          </Field>
          <Field label="Role">
            <select name="role" required className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Branch">
            <select name="branchId" className={inputClass}>
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="secondary">
              Create user
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
