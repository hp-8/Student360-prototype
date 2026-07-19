import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, Field, inputClass, Button } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/roles";
import { staffName } from "@/lib/displayName";
import {
  createUserAction,
  toggleUserActiveAction,
  updateUserRolesAndManagerAction,
} from "./actions";

const ROLES = [
  "FRONT_DESK",
  "COUNSELLOR",
  "APPLICATIONS_TEAM",
  "VISA_TEAM",
  "MANAGER",
  "ADMINISTRATOR",
] as const;

function RoleCheckboxes({
  name,
  defaultRoles = [],
}: {
  name: string;
  defaultRoles?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {ROLES.map((r) => (
        <label key={r} className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name={name}
            value={r}
            defaultChecked={defaultRoles.includes(r)}
          />
          {ROLE_LABEL[r]}
        </label>
      ))}
    </div>
  );
}

export default async function AdminUsersPage() {
  await requireRole("ADMINISTRATOR");

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      include: { branch: true, manager: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Configuration only. Administrators do not manage live student, application or visa records. A user can hold more than one role, and can report to a manager for hierarchy-scoped assignment."
      />

      <Card className="p-5">
        <SectionTitle>All users</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Roles</th>
              <th className="py-2 font-medium">Reports to</th>
              <th className="py-2 font-medium">Branch</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--paper-line)] last:border-0 align-top">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} color="blue">
                        {ROLE_LABEL[r]}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-2">{u.manager?.name ?? "—"}</td>
                <td className="py-2">{u.branch?.name ?? "—"}</td>
                <td className="py-2">
                  <Badge color={u.active ? "green" : "slate"}>
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={String(u.active)} />
                      <button className="text-sm underline">
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <details>
                      <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">Edit</summary>
                      <form
                        action={updateUserRolesAndManagerAction}
                        className="flex flex-col gap-2 mt-2 text-left w-64"
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <RoleCheckboxes name="roles" defaultRoles={u.roles} />
                        <select name="managerId" defaultValue={u.managerId ?? ""} className={inputClass}>
                          <option value="">No manager</option>
                          {users
                            .filter((m) => m.id !== u.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {staffName(m)}
                              </option>
                            ))}
                        </select>
                        <Button type="submit" variant="secondary" className="w-fit">
                          Save
                        </Button>
                      </form>
                    </details>
                  </div>
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
          <div className="col-span-2">
            <Field label="Roles (select one or more)">
              <RoleCheckboxes name="roles" />
            </Field>
          </div>
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
          <Field label="Reports to (manager)">
            <select name="managerId" className={inputClass}>
              <option value="">No manager</option>
              {users.map((m) => (
                <option key={m.id} value={m.id}>
                  {staffName(m)}
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
