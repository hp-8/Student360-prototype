"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, ROLE_HOME } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { error: "Invalid email or password." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  if (user.roles.length === 0) {
    return { error: "This account has no role assigned. Contact an administrator." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
  });

  redirect(ROLE_HOME[user.roles[0]]);
}
