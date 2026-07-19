import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  FRONT_DESK: "Front Desk",
  COUNSELLOR: "Counsellor",
  APPLICATIONS_TEAM: "Applications Team",
  VISA_TEAM: "Visa Team",
  MANAGER: "Manager",
  ADMINISTRATOR: "Administrator",
};

export type NavItem = { href: string; label: string };

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  FRONT_DESK: [
    { href: "/front-desk", label: "Enquiries" },
    { href: "/front-desk/students", label: "Students" },
  ],
  COUNSELLOR: [
    { href: "/counsellor", label: "My Students" },
    { href: "/work-items", label: "Work Items" },
  ],
  APPLICATIONS_TEAM: [
    { href: "/applications", label: "My Study Options" },
    { href: "/work-items", label: "Work Items" },
  ],
  VISA_TEAM: [
    { href: "/visa", label: "My Visa Cases" },
    { href: "/visa/new", label: "Open Visa Case" },
    { href: "/work-items", label: "Work Items" },
  ],
  MANAGER: [
    { href: "/manager", label: "Pipeline" },
    { href: "/manager/workload", label: "Workload" },
    { href: "/manager/assignments", label: "Assignments" },
    { href: "/manager/students", label: "All Students" },
    { href: "/work-items", label: "Work Items" },
  ],
  ADMINISTRATOR: [
    { href: "/admin", label: "Users" },
    { href: "/admin/branches", label: "Branches" },
    { href: "/admin/countries", label: "Countries & Routes" },
    { href: "/admin/templates", label: "Requirement Templates" },
  ],
};
