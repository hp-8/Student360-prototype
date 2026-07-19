"use client";

import type { Role } from "@prisma/client";
import { ROLE_LABEL } from "@/lib/roles";
import { switchActiveRoleAction } from "@/app/switch-role/actions";

export function RoleSwitcher({
  roles,
  activeRole,
}: {
  roles: Role[];
  activeRole: Role;
}) {
  return (
    <form action={switchActiveRoleAction} className="flex items-center">
      <select
        name="role"
        defaultValue={activeRole}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-sm text-[var(--brass)] bg-transparent border border-[var(--paper-line)] rounded-md px-2 py-1 focus:outline-none"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            Acting as: {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
