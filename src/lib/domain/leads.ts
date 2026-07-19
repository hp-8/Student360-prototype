import { prisma } from "@/lib/prisma";

export async function findDuplicateStudents(params: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}) {
  return prisma.student.findMany({
    where: {
      OR: [
        { phone: params.phone },
        ...(params.email ? [{ email: params.email }] : []),
        {
          AND: [
            { firstName: { equals: params.firstName, mode: "insensitive" } },
            { lastName: { equals: params.lastName, mode: "insensitive" } },
          ],
        },
      ],
    },
    include: { currentCaseManager: true, branch: true },
  });
}

export async function findDuplicateLeads(params: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}) {
  return prisma.lead.findMany({
    where: {
      status: "OPEN",
      OR: [
        { phone: params.phone },
        ...(params.email ? [{ email: params.email }] : []),
        {
          AND: [
            { firstName: { equals: params.firstName, mode: "insensitive" } },
            { lastName: { equals: params.lastName, mode: "insensitive" } },
          ],
        },
      ],
    },
  });
}

export async function createLead(
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    source?: string | null;
    branchId: string;
    educationSnapshot?: string | null;
  },
  createdById: string
) {
  return prisma.lead.create({
    data: { ...data, createdById },
  });
}

export async function markLeadLost(leadId: string, reason: string) {
  return prisma.lead.update({
    where: { id: leadId },
    data: { status: "LOST", lostReason: reason },
  });
}

export async function convertLeadToStudent(
  leadId: string,
  extra: {
    dob?: Date | null;
    address?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    guardianRelation?: string | null;
    consentNotes?: string | null;
    educationSnapshot?: string | null;
  },
  caseManagerId: string,
  byUserId: string
) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        email: lead.email,
        branchId: lead.branchId,
        enquiryDate: lead.enquiryDate,
        leadSource: lead.source,
        educationSnapshot: extra.educationSnapshot ?? lead.educationSnapshot,
        dob: extra.dob,
        address: extra.address,
        guardianName: extra.guardianName,
        guardianPhone: extra.guardianPhone,
        guardianRelation: extra.guardianRelation,
        consentNotes: extra.consentNotes,
        currentCaseManagerId: caseManagerId,
      },
    });

    await tx.caseAssignment.create({
      data: {
        studentId: student.id,
        staffId: caseManagerId,
        assignedById: byUserId,
        note: "Initial case manager assignment on conversion from enquiry.",
      },
    });

    await tx.lead.update({
      where: { id: leadId },
      data: { status: "CONVERTED", convertedStudentId: student.id },
    });

    return student;
  });
}
