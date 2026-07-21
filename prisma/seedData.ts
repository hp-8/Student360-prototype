import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { findDuplicateStudents } from "../src/lib/domain/leads";
import { reassignCaseManager } from "../src/lib/domain/caseManager";
import {
  createStudyOption,
  createApplication,
  recordOffer,
  updateOfferStatus,
} from "../src/lib/domain/studyOptions";
import { confirmCountry } from "../src/lib/domain/countryConfirmation";
import {
  openVisaCase,
  updateVisaAttempt,
  reopenAttempt,
  closeVisaCase,
  changeActiveOffer,
} from "../src/lib/domain/visaCases";
import { createWorkItem, assignWorkItem, updateWorkItemStatus } from "../src/lib/domain/workItems";
import { addDocument, verifyDocument } from "../src/lib/domain/documents";
import { addNote } from "../src/lib/domain/notes";
import { upsertEnrollment, recordTestAttempt } from "../src/lib/domain/learning";

const PASSWORD = "password123";

export async function seedDatabase() {
  console.log("Clearing existing data...");
  const tableNames = [
    "DocumentLink",
    "Document",
    "Note",
    "WorkItem",
    "CaseChecklistItem",
    "VisaEvent",
    "VisaAttempt",
    "VisaCase",
    "CountryConfirmation",
    "TestAttempt",
    "LearningEnrollment",
    "Offer",
    "SopRecord",
    "ApplicationRecord",
    "StudyOption",
    "CaseAssignment",
    "Lead",
    "Student",
    "RequirementTemplate",
    "VisaRoute",
    "Country",
    "User",
    "Branch",
  ];
  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }

  console.log("Creating branches...");
  const ahmedabad = await prisma.branch.create({
    data: { name: "Ahmedabad HQ", city: "Ahmedabad" },
  });
  const mumbai = await prisma.branch.create({
    data: { name: "Mumbai Branch", city: "Mumbai" },
  });

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  type RoleName =
    | "FRONT_DESK"
    | "COUNSELLOR"
    | "APPLICATIONS_TEAM"
    | "VISA_TEAM"
    | "MANAGER"
    | "ADMINISTRATOR";
  const mkUser = (
    name: string,
    email: string,
    roles: RoleName[],
    branchId?: string,
    managerId?: string
  ) => prisma.user.create({ data: { name, email, roles, passwordHash, branchId, managerId } });

  // Manager also holds Administrator rights, to demonstrate multi-role support
  // and the role switcher in the header.
  const manager = await mkUser(
    "Manoj Manager",
    "manager@student360.test",
    ["MANAGER", "ADMINISTRATOR"],
    ahmedabad.id
  );
  const admin = await mkUser("Ayesha Admin", "admin@student360.test", ["ADMINISTRATOR"]);
  const frontDesk = await mkUser("Farah Sheikh", "frontdesk@student360.test", ["FRONT_DESK"], ahmedabad.id, manager.id);
  const counsellor = await mkUser("Chirag Bhatt", "counsellor@student360.test", ["COUNSELLOR"], ahmedabad.id, manager.id);
  const counsellor2 = await mkUser("Sneha Kulkarni", "counsellor2@student360.test", ["COUNSELLOR"], mumbai.id, manager.id);
  const appsTeam = await mkUser("Aditi Verma", "applications@student360.test", ["APPLICATIONS_TEAM"], ahmedabad.id, manager.id);
  const appsTeam2 = await mkUser("Rahul Joshi", "applications2@student360.test", ["APPLICATIONS_TEAM"], mumbai.id, manager.id);
  const visaTeam = await mkUser("Vivek Rana", "visateam@student360.test", ["VISA_TEAM"], ahmedabad.id, manager.id);
  const visaTeam2 = await mkUser("Neha Kapoor", "visateam2@student360.test", ["VISA_TEAM"], mumbai.id, manager.id);

  console.log("Creating countries, visa routes, requirement templates...");
  const germany = await prisma.country.create({ data: { name: "Germany", code: "DE" } });
  const uk = await prisma.country.create({ data: { name: "United Kingdom", code: "GB" } });
  const france = await prisma.country.create({ data: { name: "France", code: "FR" } });
  const canada = await prisma.country.create({ data: { name: "Canada", code: "CA" } });

  const germanyRoute = await prisma.visaRoute.create({
    data: {
      countryId: germany.id,
      name: "Germany National (D) Visa - Student",
      description: "National visa for degree-seeking students entering Germany.",
    },
  });
  const ukRoute = await prisma.visaRoute.create({
    data: {
      countryId: uk.id,
      name: "UK Student Route Visa",
      description: "Points-based Student visa route.",
    },
  });
  const franceRoute = await prisma.visaRoute.create({
    data: {
      countryId: france.id,
      name: "France VLS-TS Student Visa",
      description: "Long-stay student visa validated as a residence permit.",
    },
  });
  const canadaRoute = await prisma.visaRoute.create({
    data: {
      countryId: canada.id,
      name: "Canada Study Permit",
      description: "Study permit for degree programs in Canada.",
    },
  });

  console.log("Creating intakes with application deadlines...");
  const intakeDefs: { countryId: string; name: string; applicationDeadline: Date | null }[] = [
    { countryId: germany.id, name: "Fall 2026", applicationDeadline: new Date("2026-09-01") },
    { countryId: germany.id, name: "Spring 2026", applicationDeadline: new Date("2026-02-01") },
    { countryId: germany.id, name: "Spring 2027", applicationDeadline: null },
    { countryId: uk.id, name: "Fall 2026", applicationDeadline: new Date("2026-08-15") },
    { countryId: uk.id, name: "Spring 2026", applicationDeadline: new Date("2026-01-10") },
    { countryId: uk.id, name: "January 2027", applicationDeadline: null },
    { countryId: france.id, name: "Fall 2026", applicationDeadline: new Date("2026-08-20") },
    { countryId: canada.id, name: "Fall 2026", applicationDeadline: new Date("2026-08-01") },
    { countryId: canada.id, name: "Winter 2027", applicationDeadline: null },
  ];
  const intakesByKey = new Map<string, string>();
  for (const def of intakeDefs) {
    const intake = await prisma.intake.create({ data: def });
    intakesByKey.set(`${def.countryId}::${def.name}`, intake.id);
  }
  const intakeIdFor = (countryId: string, name: string) => intakesByKey.get(`${countryId}::${name}`);

  await prisma.requirementTemplate.create({
    data: {
      visaRouteId: germanyRoute.id,
      version: 1,
      isActive: true,
      items: [
        { title: "Valid passport copy", required: true },
        { title: "University admission letter", required: true },
        { title: "Blocked account confirmation (Verpflichtungserklärung / Finanzierungsnachweis)", required: true },
        { title: "APS certificate", required: true },
        { title: "Health insurance proof", required: true },
        { title: "Visa application form (VIDEX)", required: true },
        { title: "Biometric photos", required: true },
        { title: "Academic transcripts", required: false },
      ],
    },
  });
  await prisma.requirementTemplate.create({
    data: {
      visaRouteId: ukRoute.id,
      version: 1,
      isActive: true,
      items: [
        { title: "Valid passport copy", required: true },
        { title: "CAS (Confirmation of Acceptance for Studies)", required: true },
        { title: "Financial evidence (28-day bank statement)", required: true },
        { title: "TB test certificate", required: true },
        { title: "English proficiency proof (IELTS/UKVI)", required: true },
      ],
    },
  });
  await prisma.requirementTemplate.create({
    data: {
      visaRouteId: franceRoute.id,
      version: 1,
      isActive: true,
      items: [
        { title: "Valid passport copy", required: true },
        { title: "Campus France (Etudes en France) validation", required: true },
        { title: "Proof of financial resources", required: true },
        { title: "Accommodation proof", required: true },
        { title: "Long-stay visa application form", required: true },
      ],
    },
  });
  await prisma.requirementTemplate.create({
    data: {
      visaRouteId: canadaRoute.id,
      version: 1,
      isActive: true,
      items: [
        { title: "Valid passport copy", required: true },
        { title: "Letter of acceptance", required: true },
        { title: "Proof of financial support (GIC or bank statement)", required: true },
        { title: "Medical exam confirmation", required: false },
      ],
    },
  });

  // =======================================================================
  // Scenario 1-3 & 9: Ananya Shah - two study options, Germany confirmed,
  // visa refused then reopened & approved, then case manager reassigned.
  // =======================================================================
  console.log("Seeding Ananya Shah (scenarios 1, 2, 3, 9)...");
  const ananyaLead = await prisma.lead.create({
    data: {
      firstName: "Ananya",
      lastName: "Shah",
      phone: "+919820011111",
      email: "ananya.shah@example.com",
      source: "Instagram ad",
      branchId: ahmedabad.id,
      fatherName: "Rakesh Shah",
      motherName: "Priti Shah",
      schoolName: "Delhi Public School, Ahmedabad",
      percentageReceived: 82,
      universityAttended: "Gujarat Technological University (B.Tech Computer Science)",
      intendedCountryId: germany.id,
      ieltsAttempted: true,
      ieltsScore: "7.5",
      additionalNotes: "8.2 CGPA, 2025 graduate",
      createdById: frontDesk.id,
    },
  });
  const ananya = await prisma.student.create({
    data: {
      firstName: ananyaLead.firstName,
      lastName: ananyaLead.lastName,
      phone: ananyaLead.phone,
      email: ananyaLead.email,
      branchId: ahmedabad.id,
      leadSource: ananyaLead.source,
      fatherName: ananyaLead.fatherName,
      motherName: ananyaLead.motherName,
      schoolName: ananyaLead.schoolName,
      percentageReceived: ananyaLead.percentageReceived,
      universityAttended: ananyaLead.universityAttended,
      intendedCountryId: ananyaLead.intendedCountryId,
      ieltsAttempted: ananyaLead.ieltsAttempted,
      ieltsScore: ananyaLead.ieltsScore,
      additionalNotes: ananyaLead.additionalNotes,
      consentNotes: "Consented to data processing on enquiry form, signed 12 Jan 2026.",
      currentCaseManagerId: counsellor.id,
    },
  });
  await prisma.lead.update({
    where: { id: ananyaLead.id },
    data: { status: "CONVERTED", convertedStudentId: ananya.id },
  });
  await prisma.caseAssignment.create({
    data: {
      studentId: ananya.id,
      staffId: counsellor.id,
      assignedById: frontDesk.id,
      note: "Initial case manager assignment on conversion from enquiry.",
    },
  });

  const ananyaGermanyOption = await createStudyOption(
    {
      studentId: ananya.id,
      countryId: germany.id,
      universityName: "RWTH Aachen University",
      courseName: "MSc Computer Science",
      intake: "Fall 2026",
      intakeId: intakeIdFor(germany.id, "Fall 2026"),
      assignedCounsellorId: counsellor.id,
      assignedAppsUserId: appsTeam.id,
    },
    counsellor.id
  );
  const ananyaUkOption = await createStudyOption(
    {
      studentId: ananya.id,
      countryId: uk.id,
      universityName: "University of Manchester",
      courseName: "MSc Data Science",
      intake: "Fall 2026",
      intakeId: intakeIdFor(uk.id, "Fall 2026"),
      assignedCounsellorId: counsellor.id,
      assignedAppsUserId: appsTeam.id,
    },
    counsellor.id
  );

  const ananyaGermanyApp = await createApplication({ studyOptionId: ananyaGermanyOption.id });
  const ananyaUkApp = await createApplication({ studyOptionId: ananyaUkOption.id });

  const ananyaGermanyOffer = await recordOffer(
    {
      studentId: ananya.id,
      countryId: germany.id,
      applicationId: ananyaGermanyApp.id,
      universityName: "RWTH Aachen University",
      courseName: "MSc Computer Science",
      intake: "Fall 2026",
      status: "CONDITIONAL",
    },
    appsTeam.id
  );
  await updateOfferStatus(ananyaGermanyOffer.id, "UNCONDITIONAL", appsTeam.id);
  await updateOfferStatus(ananyaGermanyOffer.id, "ACCEPTED", appsTeam.id);

  const ananyaUkOffer = await recordOffer(
    {
      studentId: ananya.id,
      countryId: uk.id,
      applicationId: ananyaUkApp.id,
      universityName: "University of Manchester",
      courseName: "MSc Data Science",
      intake: "Fall 2026",
      status: "REJECTED",
    },
    appsTeam.id
  );
  await prisma.studyOption.update({ where: { id: ananyaUkOption.id }, data: { status: "REJECTED" } });

  await confirmCountry(ananya.id, germany.id, counsellor.id, "Accepted RWTH Aachen offer; proceeding with Germany.");

  const ananyaVisaCase = await openVisaCase({
    studentId: ananya.id,
    countryId: germany.id,
    visaRouteId: germanyRoute.id,
    activeOfferId: ananyaGermanyOffer.id,
    assignedToId: visaTeam.id,
    byUserId: manager.id,
  });
  const ananyaAttempt1 = await prisma.visaAttempt.findFirstOrThrow({
    where: { visaCaseId: ananyaVisaCase.id, attemptNumber: 1 },
  });
  await updateVisaAttempt({ attemptId: ananyaAttempt1.id, newStatus: "READY_TO_FILE", eventType: "NOTE", notes: "Documents collected and verified.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt1.id, newStatus: "SUBMITTED", eventType: "FILING", notes: "Application filed at German consulate, Mumbai.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt1.id, newStatus: "BIOMETRICS_PENDING", eventType: "APPOINTMENT", notes: "Biometrics appointment scheduled.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt1.id, newStatus: "DECISION_PENDING", eventType: "BIOMETRICS", notes: "Biometrics completed.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt1.id, newStatus: "REFUSED", eventType: "REFUSAL", notes: "Refused: insufficient proof of funds in blocked account.", byUserId: visaTeam.id });

  const ananyaAttempt2 = await reopenAttempt(ananyaVisaCase.id, visaTeam.id, "Blocked account topped up; refiling with updated financial evidence.");
  await updateVisaAttempt({ attemptId: ananyaAttempt2.id, newStatus: "READY_TO_FILE", eventType: "NOTE", notes: "Updated financial documents verified.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt2.id, newStatus: "SUBMITTED", eventType: "FILING", notes: "Re-filed application.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt2.id, newStatus: "DECISION_PENDING", eventType: "BIOMETRICS", notes: "Biometrics completed.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: ananyaAttempt2.id, newStatus: "APPROVED", eventType: "APPROVAL", notes: "Visa approved.", byUserId: visaTeam.id });

  await reassignCaseManager(ananya.id, counsellor2.id, manager.id, "Rebalancing Ahmedabad branch counsellor workload.");

  // =======================================================================
  // Scenario 4: Rohan Mehta - Germany refused & closed, pivots to on-hold UK option.
  // =======================================================================
  console.log("Seeding Rohan Mehta (scenario 4)...");
  const rohanLead = await prisma.lead.create({
    data: {
      firstName: "Rohan",
      lastName: "Mehta",
      phone: "+919820022222",
      email: "rohan.mehta@example.com",
      source: "Walk-in",
      branchId: mumbai.id,
      fatherName: "Suresh Mehta",
      motherName: "Kavita Mehta",
      schoolName: "St. Xavier's High School, Mumbai",
      percentageReceived: 76,
      universityAttended: "Mumbai University (B.E. Mechanical Engineering)",
      intendedCountryId: germany.id,
      ieltsAttempted: true,
      ieltsScore: "6.5",
      additionalNotes: "7.6 CGPA, 2024 graduate",
      createdById: frontDesk.id,
    },
  });
  const rohan = await prisma.student.create({
    data: {
      firstName: rohanLead.firstName,
      lastName: rohanLead.lastName,
      phone: rohanLead.phone,
      email: rohanLead.email,
      branchId: mumbai.id,
      leadSource: rohanLead.source,
      fatherName: rohanLead.fatherName,
      motherName: rohanLead.motherName,
      schoolName: rohanLead.schoolName,
      percentageReceived: rohanLead.percentageReceived,
      universityAttended: rohanLead.universityAttended,
      intendedCountryId: rohanLead.intendedCountryId,
      ieltsAttempted: rohanLead.ieltsAttempted,
      ieltsScore: rohanLead.ieltsScore,
      additionalNotes: rohanLead.additionalNotes,
      currentCaseManagerId: counsellor2.id,
    },
  });
  await prisma.lead.update({ where: { id: rohanLead.id }, data: { status: "CONVERTED", convertedStudentId: rohan.id } });
  await prisma.caseAssignment.create({
    data: { studentId: rohan.id, staffId: counsellor2.id, assignedById: frontDesk.id, note: "Initial case manager assignment on conversion from enquiry." },
  });

  const rohanGermanyOption = await createStudyOption(
    {
      studentId: rohan.id,
      countryId: germany.id,
      universityName: "TU Munich",
      courseName: "MSc Mechanical Engineering",
      intake: "Spring 2026",
      intakeId: intakeIdFor(germany.id, "Spring 2026"),
      assignedCounsellorId: counsellor2.id,
      assignedAppsUserId: appsTeam2.id,
    },
    counsellor2.id
  );
  const rohanUkOption = await createStudyOption(
    {
      studentId: rohan.id,
      countryId: uk.id,
      universityName: "University of Leeds",
      courseName: "MSc Mechanical Engineering",
      intake: "Spring 2026",
      intakeId: intakeIdFor(uk.id, "Spring 2026"),
      assignedCounsellorId: counsellor2.id,
      assignedAppsUserId: appsTeam2.id,
    },
    counsellor2.id
  );
  await prisma.studyOption.update({ where: { id: rohanUkOption.id }, data: { status: "ON_HOLD" } });

  const rohanGermanyApp = await createApplication({ studyOptionId: rohanGermanyOption.id });
  const rohanGermanyOffer = await recordOffer(
    {
      studentId: rohan.id,
      countryId: germany.id,
      applicationId: rohanGermanyApp.id,
      universityName: "TU Munich",
      courseName: "MSc Mechanical Engineering",
      intake: "Spring 2026",
      status: "ACCEPTED",
    },
    appsTeam2.id
  );

  await confirmCountry(rohan.id, germany.id, counsellor2.id, "Prioritising Germany route; UK kept on hold.");
  const rohanVisaCase = await openVisaCase({
    studentId: rohan.id,
    countryId: germany.id,
    visaRouteId: germanyRoute.id,
    activeOfferId: rohanGermanyOffer.id,
    assignedToId: visaTeam2.id,
    byUserId: manager.id,
  });
  const rohanAttempt1 = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: rohanVisaCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: rohanAttempt1.id, newStatus: "SUBMITTED", eventType: "FILING", notes: "Filed application.", byUserId: visaTeam2.id });
  await updateVisaAttempt({ attemptId: rohanAttempt1.id, newStatus: "DECISION_PENDING", eventType: "BIOMETRICS", notes: "Biometrics completed.", byUserId: visaTeam2.id });
  await updateVisaAttempt({ attemptId: rohanAttempt1.id, newStatus: "REFUSED", eventType: "REFUSAL", notes: "Refused: course relevance to prior degree not established.", byUserId: visaTeam2.id });

  await closeVisaCase({
    visaCaseId: rohanVisaCase.id,
    reason: "PIVOTED",
    byUserId: counsellor2.id,
    notes: "Student decided not to reapply for Germany; pivoting to the UK study option that was on hold.",
    pivotToStudyOptionId: rohanUkOption.id,
  });
  await confirmCountry(rohan.id, uk.id, counsellor2.id, "Pivoted from Germany after refusal; confirming UK route instead.");
  const rohanUkVisaCase = await openVisaCase({
    studentId: rohan.id,
    countryId: uk.id,
    visaRouteId: ukRoute.id,
    activeOfferId: null,
    assignedToId: visaTeam2.id,
    byUserId: manager.id,
  });
  const rohanUkAttempt1 = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: rohanUkVisaCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: rohanUkAttempt1.id, newStatus: "READY_TO_FILE", eventType: "NOTE", notes: "CAS received, documents ready.", byUserId: visaTeam2.id });

  // =======================================================================
  // Scenario 5: Meera Iyer - four German university offers, one Germany
  // visa case, active offer switched between universities.
  // =======================================================================
  console.log("Seeding Meera Iyer (scenario 5)...");
  const meeraLead = await prisma.lead.create({
    data: {
      firstName: "Meera",
      lastName: "Iyer",
      phone: "+919820033333",
      email: "meera.iyer@example.com",
      source: "Referral",
      branchId: ahmedabad.id,
      fatherName: "Ganesh Iyer",
      motherName: "Lakshmi Iyer",
      schoolName: "Kendriya Vidyalaya, Ahmedabad",
      percentageReceived: 89,
      universityAttended: "Nirma University (B.Tech Information Technology)",
      intendedCountryId: germany.id,
      ieltsAttempted: true,
      ieltsScore: "8.0",
      additionalNotes: "8.9 CGPA, 2025 graduate",
      createdById: frontDesk.id,
    },
  });
  const meera = await prisma.student.create({
    data: {
      firstName: meeraLead.firstName,
      lastName: meeraLead.lastName,
      phone: meeraLead.phone,
      email: meeraLead.email,
      branchId: ahmedabad.id,
      leadSource: meeraLead.source,
      fatherName: meeraLead.fatherName,
      motherName: meeraLead.motherName,
      schoolName: meeraLead.schoolName,
      percentageReceived: meeraLead.percentageReceived,
      universityAttended: meeraLead.universityAttended,
      intendedCountryId: meeraLead.intendedCountryId,
      ieltsAttempted: meeraLead.ieltsAttempted,
      ieltsScore: meeraLead.ieltsScore,
      additionalNotes: meeraLead.additionalNotes,
      currentCaseManagerId: counsellor.id,
    },
  });
  await prisma.lead.update({ where: { id: meeraLead.id }, data: { status: "CONVERTED", convertedStudentId: meera.id } });
  await prisma.caseAssignment.create({
    data: { studentId: meera.id, staffId: counsellor.id, assignedById: frontDesk.id, note: "Initial case manager assignment on conversion from enquiry." },
  });

  const germanUnis = [
    { uni: "RWTH Aachen University", offerStatus: "CONDITIONAL" as const },
    { uni: "TU Munich", offerStatus: "UNCONDITIONAL" as const },
    { uni: "University of Stuttgart", offerStatus: "CONDITIONAL" as const },
    { uni: "LMU Munich", offerStatus: "CONDITIONAL" as const },
  ];
  const meeraOffers: { uni: string; offerId: string }[] = [];
  for (const entry of germanUnis) {
    const option = await createStudyOption(
      {
        studentId: meera.id,
        countryId: germany.id,
        universityName: entry.uni,
        courseName: "MSc Data Engineering",
        intake: "Fall 2026",
        intakeId: intakeIdFor(germany.id, "Fall 2026"),
        assignedCounsellorId: counsellor.id,
        assignedAppsUserId: appsTeam.id,
      },
      counsellor.id
    );
    const app = await createApplication({ studyOptionId: option.id });
    const offer = await recordOffer(
      {
        studentId: meera.id,
        countryId: germany.id,
        applicationId: app.id,
        universityName: entry.uni,
        courseName: "MSc Data Engineering",
        intake: "Fall 2026",
        status: entry.offerStatus,
      },
      appsTeam.id
    );
    meeraOffers.push({ uni: entry.uni, offerId: offer.id });
  }

  await confirmCountry(meera.id, germany.id, counsellor.id, "Confirming Germany with four offers in hand.");
  const tuMunichOffer = meeraOffers.find((o) => o.uni === "TU Munich")!;
  const rwthOffer = meeraOffers.find((o) => o.uni === "RWTH Aachen University")!;
  const meeraVisaCase = await openVisaCase({
    studentId: meera.id,
    countryId: germany.id,
    visaRouteId: germanyRoute.id,
    activeOfferId: tuMunichOffer.offerId,
    assignedToId: visaTeam.id,
    byUserId: manager.id,
  });
  const meeraAttempt1 = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: meeraVisaCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: meeraAttempt1.id, newStatus: "READY_TO_FILE", eventType: "NOTE", notes: "Initial documents ready with TU Munich as active offer.", byUserId: visaTeam.id });
  await changeActiveOffer(meeraVisaCase.id, rwthOffer.offerId, visaTeam.id);

  // =======================================================================
  // Scenario 6: Kabir Nair - visa-only student, external offer, no internal
  // study option, same manual visa case entry point.
  // =======================================================================
  console.log("Seeding Kabir Nair (scenario 6)...");
  const kabirLead = await prisma.lead.create({
    data: {
      firstName: "Kabir",
      lastName: "Nair",
      phone: "+919820044444",
      email: "kabir.nair@example.com",
      source: "Walk-in - already holds an offer",
      branchId: mumbai.id,
      fatherName: "Vinod Nair",
      motherName: "Radha Nair",
      schoolName: "Bombay Scottish School",
      percentageReceived: 68,
      universityAttended: "University of Mumbai (B.Com)",
      intendedCountryId: germany.id,
      ieltsAttempted: false,
      additionalNotes: "Already secured an offer independently.",
      createdById: frontDesk.id,
    },
  });
  const kabir = await prisma.student.create({
    data: {
      firstName: kabirLead.firstName,
      lastName: kabirLead.lastName,
      phone: kabirLead.phone,
      email: kabirLead.email,
      branchId: mumbai.id,
      leadSource: kabirLead.source,
      fatherName: kabirLead.fatherName,
      motherName: kabirLead.motherName,
      schoolName: kabirLead.schoolName,
      percentageReceived: kabirLead.percentageReceived,
      universityAttended: kabirLead.universityAttended,
      intendedCountryId: kabirLead.intendedCountryId,
      ieltsAttempted: kabirLead.ieltsAttempted,
      ieltsScore: kabirLead.ieltsScore,
      additionalNotes: kabirLead.additionalNotes,
      currentCaseManagerId: counsellor2.id,
    },
  });
  await prisma.lead.update({ where: { id: kabirLead.id }, data: { status: "CONVERTED", convertedStudentId: kabir.id } });
  await prisma.caseAssignment.create({
    data: { studentId: kabir.id, staffId: counsellor2.id, assignedById: frontDesk.id, note: "Initial case manager assignment on conversion from enquiry." },
  });

  const kabirExternalOffer = await recordOffer(
    {
      studentId: kabir.id,
      countryId: germany.id,
      universityName: "Universität Hamburg",
      courseName: "MSc International Business",
      intake: "Fall 2026",
      status: "ACCEPTED",
      isExternal: true,
      notes: "Offer obtained independently before approaching Student360; no internal study option/application on file.",
    },
    visaTeam2.id
  );
  const kabirVisaCase = await openVisaCase({
    studentId: kabir.id,
    countryId: germany.id,
    visaRouteId: germanyRoute.id,
    activeOfferId: kabirExternalOffer.id,
    assignedToId: visaTeam2.id,
    byUserId: manager.id,
    notes: "Visa-only engagement opened directly against an externally sourced offer.",
  });
  const kabirAttempt1 = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: kabirVisaCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: kabirAttempt1.id, newStatus: "READY_TO_FILE", eventType: "NOTE", notes: "Documents collected for external offer.", byUserId: visaTeam2.id });

  // =======================================================================
  // Scenario 7 & 8: Priya Desai - two parallel visa cases (Germany approved,
  // France mid-process), for case-level dashboard metric verification.
  // =======================================================================
  console.log("Seeding Priya Desai (scenarios 7, 8)...");
  const priyaLead = await prisma.lead.create({
    data: {
      firstName: "Priya",
      lastName: "Desai",
      phone: "+919820055555",
      email: "priya.desai@example.com",
      source: "Education fair",
      branchId: ahmedabad.id,
      fatherName: "Nitin Desai",
      motherName: "Alka Desai",
      schoolName: "Anand Niketan School, Ahmedabad",
      percentageReceived: 91,
      universityAttended: "Gujarat University (B.Sc Physics)",
      intendedCountryId: germany.id,
      ieltsAttempted: true,
      ieltsScore: "8.5",
      additionalNotes: "9.1 CGPA, 2025 graduate",
      createdById: frontDesk.id,
    },
  });
  const priya = await prisma.student.create({
    data: {
      firstName: priyaLead.firstName,
      lastName: priyaLead.lastName,
      phone: priyaLead.phone,
      email: priyaLead.email,
      branchId: ahmedabad.id,
      leadSource: priyaLead.source,
      fatherName: priyaLead.fatherName,
      motherName: priyaLead.motherName,
      schoolName: priyaLead.schoolName,
      percentageReceived: priyaLead.percentageReceived,
      universityAttended: priyaLead.universityAttended,
      intendedCountryId: priyaLead.intendedCountryId,
      ieltsAttempted: priyaLead.ieltsAttempted,
      ieltsScore: priyaLead.ieltsScore,
      additionalNotes: priyaLead.additionalNotes,
      currentCaseManagerId: counsellor.id,
    },
  });
  await prisma.lead.update({ where: { id: priyaLead.id }, data: { status: "CONVERTED", convertedStudentId: priya.id } });
  await prisma.caseAssignment.create({
    data: { studentId: priya.id, staffId: counsellor.id, assignedById: frontDesk.id, note: "Initial case manager assignment on conversion from enquiry." },
  });

  const priyaGermanyOption = await createStudyOption(
    {
      studentId: priya.id,
      countryId: germany.id,
      universityName: "Karlsruhe Institute of Technology",
      courseName: "MSc Physics",
      intake: "Fall 2026",
      intakeId: intakeIdFor(germany.id, "Fall 2026"),
      assignedCounsellorId: counsellor.id,
      assignedAppsUserId: appsTeam.id,
    },
    counsellor.id
  );
  const priyaFranceOption = await createStudyOption(
    {
      studentId: priya.id,
      countryId: france.id,
      universityName: "Sorbonne University",
      courseName: "MSc Physics",
      intake: "Fall 2026",
      intakeId: intakeIdFor(france.id, "Fall 2026"),
      assignedCounsellorId: counsellor.id,
      assignedAppsUserId: appsTeam.id,
    },
    counsellor.id
  );

  const priyaGermanyApp = await createApplication({ studyOptionId: priyaGermanyOption.id });
  const priyaGermanyOffer = await recordOffer(
    {
      studentId: priya.id,
      countryId: germany.id,
      applicationId: priyaGermanyApp.id,
      universityName: "Karlsruhe Institute of Technology",
      courseName: "MSc Physics",
      intake: "Fall 2026",
      status: "ACCEPTED",
    },
    appsTeam.id
  );
  const priyaFranceApp = await createApplication({ studyOptionId: priyaFranceOption.id });
  const priyaFranceOffer = await recordOffer(
    {
      studentId: priya.id,
      countryId: france.id,
      applicationId: priyaFranceApp.id,
      universityName: "Sorbonne University",
      courseName: "MSc Physics",
      intake: "Fall 2026",
      status: "ACCEPTED",
    },
    appsTeam.id
  );

  await confirmCountry(priya.id, germany.id, counsellor.id, "Confirming Germany route.");
  await confirmCountry(priya.id, france.id, counsellor.id, "Confirming France route in parallel.");

  const priyaGermanyCase = await openVisaCase({
    studentId: priya.id,
    countryId: germany.id,
    visaRouteId: germanyRoute.id,
    activeOfferId: priyaGermanyOffer.id,
    assignedToId: visaTeam.id,
    byUserId: manager.id,
  });
  const priyaGermanyAttempt = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: priyaGermanyCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: priyaGermanyAttempt.id, newStatus: "SUBMITTED", eventType: "FILING", notes: "Filed application.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: priyaGermanyAttempt.id, newStatus: "DECISION_PENDING", eventType: "BIOMETRICS", notes: "Biometrics completed.", byUserId: visaTeam.id });
  await updateVisaAttempt({ attemptId: priyaGermanyAttempt.id, newStatus: "APPROVED", eventType: "APPROVAL", notes: "Visa approved.", byUserId: visaTeam.id });

  const priyaFranceCase = await openVisaCase({
    studentId: priya.id,
    countryId: france.id,
    visaRouteId: franceRoute.id,
    activeOfferId: priyaFranceOffer.id,
    assignedToId: visaTeam2.id,
    byUserId: manager.id,
  });
  const priyaFranceAttempt = await prisma.visaAttempt.findFirstOrThrow({ where: { visaCaseId: priyaFranceCase.id, attemptNumber: 1 } });
  await updateVisaAttempt({ attemptId: priyaFranceAttempt.id, newStatus: "SUBMITTED", eventType: "FILING", notes: "Filed Campus France validated application.", byUserId: visaTeam2.id });

  // =======================================================================
  // Extra open/lost leads for Front Desk duplicate-check demo (scenario 1/10)
  // =======================================================================
  console.log("Seeding extra open/lost leads...");
  await prisma.lead.create({
    data: {
      firstName: "Aarav",
      lastName: "Kapoor",
      phone: "+919820066666",
      email: "aarav.kapoor@example.com",
      source: "Google Ads",
      branchId: ahmedabad.id,
      schoolName: "Ryan International School, Ahmedabad",
      percentageReceived: 74,
      intendedCountryId: uk.id,
      ieltsAttempted: false,
      additionalNotes: "B.A. Economics, final year",
      createdById: frontDesk.id,
    },
  });
  await prisma.lead.create({
    data: {
      firstName: "Ananya",
      lastName: "Shah",
      phone: "+919820011111",
      email: "ananya.shah.alt@example.com",
      source: "Facebook ad",
      branchId: ahmedabad.id,
      schoolName: "Delhi Public School, Ahmedabad",
      percentageReceived: 82,
      intendedCountryId: germany.id,
      ieltsAttempted: false,
      additionalNotes: "Possible duplicate of existing converted student - same phone number.",
      createdById: frontDesk.id,
    },
  });
  await prisma.lead.create({
    data: {
      firstName: "Vikram",
      lastName: "Singh",
      phone: "+919820077777",
      email: "vikram.singh@example.com",
      source: "Newspaper ad",
      branchId: mumbai.id,
      schoolName: "Don Bosco School, Mumbai",
      percentageReceived: 71,
      intendedCountryId: canada.id,
      ieltsAttempted: false,
      additionalNotes: "B.Tech Civil Engineering",
      status: "LOST",
      lostReason: "Decided to pursue an in-house job offer instead of studying abroad.",
      createdById: frontDesk.id,
    },
  });

  console.log("Seeding work items across departments/staff...");
  const wi1 = await createWorkItem({ title: "Verify passport copy", department: "APPLICATIONS", studentId: ananya.id, studyOptionId: ananyaGermanyOption.id, createdById: counsellor2.id, priority: "HIGH" });
  await assignWorkItem(wi1.id, appsTeam.id, counsellor2.id);
  await updateWorkItemStatus(wi1.id, "DONE", appsTeam.id);

  const wi2 = await createWorkItem({ title: "Draft SOP for TU Munich application", department: "APPLICATIONS", studentId: rohan.id, studyOptionId: rohanGermanyOption.id, createdById: counsellor2.id, priority: "MEDIUM" });
  await assignWorkItem(wi2.id, appsTeam2.id, counsellor2.id);
  await updateWorkItemStatus(wi2.id, "IN_PROGRESS", appsTeam2.id);

  const wi3 = await createWorkItem({ title: "Book biometrics appointment", department: "VISA", studentId: meera.id, visaCaseId: meeraVisaCase.id, createdById: manager.id, priority: "HIGH" });
  await assignWorkItem(wi3.id, visaTeam.id, manager.id);
  await updateWorkItemStatus(wi3.id, "BLOCKED", visaTeam.id);

  await createWorkItem({ title: "Chase blocked account confirmation letter", department: "VISA", studentId: kabir.id, visaCaseId: kabirVisaCase.id, createdById: manager.id, priority: "URGENT" });

  const wi5 = await createWorkItem({ title: "Collect updated bank statement", department: "COUNSELLING", studentId: priya.id, createdById: manager.id, priority: "LOW" });
  await assignWorkItem(wi5.id, counsellor.id, manager.id);
  await updateWorkItemStatus(wi5.id, "NOT_STARTED", counsellor.id);

  const wi6 = await createWorkItem({ title: "Follow up on CAS issuance", department: "VISA", studentId: rohan.id, visaCaseId: rohanUkVisaCase.id, createdById: manager.id, priority: "MEDIUM" });
  await assignWorkItem(wi6.id, visaTeam2.id, manager.id);
  await updateWorkItemStatus(wi6.id, "IN_PROGRESS", visaTeam2.id);

  console.log("Seeding documents...");
  const passportDoc = await addDocument({
    studentId: ananya.id,
    type: "PASSPORT",
    label: "Ananya Shah - Passport",
    expiryDate: new Date("2031-04-15"),
    uploadedById: appsTeam.id,
    linkTo: { studyOptionId: ananyaGermanyOption.id },
  });
  await verifyDocument(passportDoc.id, appsTeam.id);

  await addDocument({
    studentId: meera.id,
    type: "OFFER_LETTER",
    label: "Meera Iyer - TU Munich Offer Letter",
    uploadedById: appsTeam.id,
    linkTo: { visaCaseId: meeraVisaCase.id },
  });

  const kabirBankDoc = await addDocument({
    studentId: kabir.id,
    type: "BANK_STATEMENT",
    label: "Kabir Nair - Bank Statement",
    expiryDate: new Date("2026-08-01"),
    uploadedById: visaTeam2.id,
    linkTo: { visaCaseId: kabirVisaCase.id },
  });
  await verifyDocument(kabirBankDoc.id, visaTeam2.id);

  console.log("Seeding learning enrollments and test attempts...");
  await upsertEnrollment({ studentId: ananya.id, service: "IELTS", status: "COMPLETED" }, counsellor.id);
  await recordTestAttempt({ studentId: ananya.id, testType: "IELTS", score: "Overall 7.5 (L:8.0 R:7.5 W:7.0 S:7.5)", testDate: new Date("2025-11-10") }, counsellor.id);

  await upsertEnrollment({ studentId: meera.id, service: "GERMAN_CLASS", status: "ENROLLED" }, counsellor.id);
  await upsertEnrollment({ studentId: priya.id, service: "SOP_ASSISTANCE", status: "COMPLETED" }, counsellor.id);
  await upsertEnrollment({ studentId: rohan.id, service: "IELTS", status: "ENROLLED" }, counsellor2.id);

  console.log("Seeding extra counselling notes...");
  await addNote(meera.id, counsellor.id, "Student has strong preference for Munich area universities; keep this in mind when discussing active offer choice.", "COUNSELLING");
  await addNote(priya.id, counsellor.id, "Very organized applicant, all documents submitted well ahead of deadlines.", "COUNSELLING");

  const ids = {
    ananya: ananya.id,
    rohan: rohan.id,
    meera: meera.id,
    kabir: kabir.id,
    priya: priya.id,
  };
  console.log("Seed complete.");
  console.log(ids);
  return ids;
}
