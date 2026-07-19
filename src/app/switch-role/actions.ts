"use server";

import { getSession, createSession, ROLE_HOME } from "@/lib/auth/session";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function switchActiveRoleAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const newRole = String(formData.get("role")) as Role;
  if (!session.roles.includes(newRole)) {
    redirect("/unauthorized");
  }

  await createSession({
    id: session.id,
    name: session.name,
    email: session.email,
    roles: session.roles,
    activeRole: newRole,
  });

  redirect(ROLE_HOME[newRole]);
}
