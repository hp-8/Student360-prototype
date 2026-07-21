import type { BadgeColor } from "@/components/ui";

export type StudentStage =
  | "New"
  | "Exploring Options"
  | "Offer Received"
  | "Country Confirmed"
  | "Visa In Progress"
  | "Visa Refused"
  | "Visa Approved"
  | "Closed";

export type StudentStageInput = {
  studyOptions: { id: string }[];
  offers: { status: string }[];
  countryConfirmations: { releasedAt: Date | null }[];
  visaCases: {
    lifecycleStatus: string;
    attempts: { status: string }[];
  }[];
};

const ACTIVE_ATTEMPT_STATUSES = new Set([
  "DOCUMENTS_PENDING",
  "READY_TO_FILE",
  "SUBMITTED",
  "BIOMETRICS_PENDING",
  "INTERVIEW_PENDING",
  "ADDITIONAL_DOCUMENTS",
  "DECISION_PENDING",
]);

const OFFER_RECEIVED_STATUSES = new Set(["CONDITIONAL", "UNCONDITIONAL", "ACCEPTED"]);

// Priority order, most-advanced first: a student's overall stage is the
// furthest point reached across all of their (possibly parallel) visa cases.
export function computeStudentStage(s: StudentStageInput): StudentStage {
  const cases = s.visaCases.map((vc) => ({
    lifecycleStatus: vc.lifecycleStatus,
    latest: vc.attempts[0]?.status,
  }));

  if (cases.some((c) => c.latest === "APPROVED")) return "Visa Approved";

  if (cases.some((c) => c.lifecycleStatus === "OPEN" && c.latest && ACTIVE_ATTEMPT_STATUSES.has(c.latest))) {
    return "Visa In Progress";
  }

  if (cases.some((c) => c.lifecycleStatus === "OPEN" && c.latest === "REFUSED")) {
    return "Visa Refused";
  }

  if (s.countryConfirmations.some((cc) => cc.releasedAt === null)) return "Country Confirmed";

  if (s.visaCases.length > 0) return "Closed";

  if (s.offers.some((o) => OFFER_RECEIVED_STATUSES.has(o.status))) return "Offer Received";

  if (s.studyOptions.length > 0) return "Exploring Options";

  return "New";
}

// What a counsellor should do next, and which tab to do it in - shown as a
// banner on the student page so "what's the next step" isn't a guessing game.
export function nextStepFor(stage: StudentStage): { message: string; tab: string } {
  switch (stage) {
    case "New":
      return {
        message: "No study options yet — add the student's first one to get things moving.",
        tab: "Study Options",
      };
    case "Exploring Options":
      return {
        message:
          "Study options are in progress. Follow up on applications, and once an offer arrives, move forward with a country from that study option.",
        tab: "Study Options",
      };
    case "Offer Received":
      return {
        message:
          "An offer has landed. Once the student decides, use \"Move forward with this country\" on that study option.",
        tab: "Study Options",
      };
    case "Country Confirmed":
      return {
        message: "Country confirmed — open a visa application to start the visa process.",
        tab: "Visa Applications",
      };
    case "Visa In Progress":
      return {
        message: "Visa application is underway — check for the next required step (documents, biometrics, interview, decision).",
        tab: "Visa Applications",
      };
    case "Visa Refused":
      return {
        message: "Visa was refused — review the case and decide on reapplication or an alternate route.",
        tab: "Visa Applications",
      };
    case "Visa Approved":
      return {
        message: "Visa approved — confirm final travel and pre-departure logistics with the student.",
        tab: "Visa Applications",
      };
    case "Closed":
      return { message: "This case is closed. No further action needed.", tab: "Activity" };
  }
}

export function stageColor(stage: StudentStage): BadgeColor {
  switch (stage) {
    case "New":
      return "slate";
    case "Exploring Options":
      return "blue";
    case "Offer Received":
      return "amber";
    case "Country Confirmed":
      return "purple";
    case "Visa In Progress":
      return "amber";
    case "Visa Refused":
      return "red";
    case "Visa Approved":
      return "green";
    case "Closed":
      return "slate";
  }
}
