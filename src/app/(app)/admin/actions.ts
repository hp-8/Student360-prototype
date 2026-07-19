"use server";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const name = String(formData.get("name")).trim();
  const email = String(formData.get("email")).trim().toLowerCase();
  const role = String(formData.get("role")) as Role;
  const branchId = String(formData.get("branchId") ?? "") || null;
  const password = String(formData.get("password"));

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { name, email, role, branchId, passwordHash } });
  revalidatePath("/admin");
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const userId = String(formData.get("userId"));
  const active = formData.get("active") === "true";
  await prisma.user.update({ where: { id: userId }, data: { active: !active } });
  revalidatePath("/admin");
}

export async function createBranchAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const name = String(formData.get("name")).trim();
  const city = String(formData.get("city")).trim();
  await prisma.branch.create({ data: { name, city } });
  revalidatePath("/admin/branches");
}

export async function createCountryAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const name = String(formData.get("name")).trim();
  const code = String(formData.get("code")).trim().toUpperCase();
  await prisma.country.create({ data: { name, code } });
  revalidatePath("/admin/countries");
}

export async function createVisaRouteAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const countryId = String(formData.get("countryId"));
  const name = String(formData.get("name")).trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  await prisma.visaRoute.create({ data: { countryId, name, description } });
  revalidatePath("/admin/countries");
}

export async function createRequirementTemplateAction(formData: FormData) {
  await requireRole("ADMINISTRATOR");
  const visaRouteId = String(formData.get("visaRouteId"));
  const itemsRaw = String(formData.get("items") ?? "");
  const items = itemsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ title, required: true }));

  const latest = await prisma.requirementTemplate.findFirst({
    where: { visaRouteId },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  await prisma.$transaction([
    prisma.requirementTemplate.updateMany({
      where: { visaRouteId },
      data: { isActive: false },
    }),
    prisma.requirementTemplate.create({
      data: { visaRouteId, version: nextVersion, isActive: true, items },
    }),
  ]);
  revalidatePath("/admin/templates");
}
