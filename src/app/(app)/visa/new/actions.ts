"use server";

import { requireRole } from "@/lib/auth/session";
import { openVisaCase } from "@/lib/domain/visaCases";
import { recordOffer } from "@/lib/domain/studyOptions";
import { prisma } from "@/lib/prisma";
import type { OfferStatus } from "@prisma/client";
import { redirect } from "next/navigation";

export async function openVisaCaseAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");

  const studentId = String(formData.get("studentId"));
  const visaRouteId = String(formData.get("visaRouteId"));
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const offerMode = String(formData.get("offerMode"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const visaRoute = await prisma.visaRoute.findUniqueOrThrow({
    where: { id: visaRouteId },
  });

  let activeOfferId: string | null = null;

  if (offerMode === "existing") {
    activeOfferId = String(formData.get("existingOfferId") ?? "") || null;
  } else if (offerMode === "external") {
    const offer = await recordOffer(
      {
        studentId,
        countryId: visaRoute.countryId,
        universityName: String(formData.get("universityName")).trim(),
        courseName: String(formData.get("courseName")).trim(),
        intake: String(formData.get("intake")).trim(),
        status: String(formData.get("offerStatus")) as OfferStatus,
        isExternal: true,
        notes: "Externally sourced offer, no internal study option on file.",
      },
      session.id
    );
    activeOfferId = offer.id;
  }

  const visaCase = await openVisaCase({
    studentId,
    countryId: visaRoute.countryId,
    visaRouteId,
    activeOfferId,
    assignedToId,
    byUserId: session.id,
    notes,
  });

  redirect(`/visa/${visaCase.id}`);
}
