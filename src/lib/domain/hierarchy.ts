import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/** Direct reports of a given manager, optionally filtered to a role. */
export async function getDirectReports(managerId: string, roleFilter?: Role) {
  return prisma.user.findMany({
    where: {
      managerId,
      active: true,
      ...(roleFilter ? { roles: { has: roleFilter } } : {}),
    },
    orderBy: { name: "asc" },
  });
}
