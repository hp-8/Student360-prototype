import { prisma } from "@/lib/prisma";

export async function confirmCountry(
  studentId: string,
  countryId: string,
  byUserId: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.countryConfirmation.findFirst({
      where: { studentId, countryId, releasedAt: null },
    });
    if (existing) return existing;

    const confirmation = await tx.countryConfirmation.create({
      data: { studentId, countryId, confirmedById: byUserId, note },
    });

    const country = await tx.country.findUniqueOrThrow({
      where: { id: countryId },
    });

    await tx.workItem.create({
      data: {
        title: `Collect visa documents - ${country.name}`,
        department: "VISA",
        studentId,
        autoCreated: true,
        createdById: byUserId,
        priority: "MEDIUM",
      },
    });

    await tx.note.create({
      data: {
        studentId,
        authorId: byUserId,
        category: "GENERAL",
        body: `${country.name} route confirmed.${note ? ` ${note}` : ""}`,
      },
    });

    return confirmation;
  });
}

export async function releaseCountryConfirmation(
  studentId: string,
  countryId: string
) {
  return prisma.countryConfirmation.updateMany({
    where: { studentId, countryId, releasedAt: null },
    data: { releasedAt: new Date() },
  });
}

export async function isCountryConfirmed(studentId: string, countryId: string) {
  const active = await prisma.countryConfirmation.findFirst({
    where: { studentId, countryId, releasedAt: null },
  });
  return Boolean(active);
}
