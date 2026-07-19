"use client";

import { useMemo, useState } from "react";
import { openVisaCaseAction } from "./actions";
import { Field, inputClass, Button } from "@/components/ui";

type StudentOpt = { id: string; name: string };
type RouteOpt = { id: string; countryId: string; countryName: string; name: string };
type OfferOpt = {
  id: string;
  studentId: string;
  countryId: string;
  universityName: string;
  status: string;
};
type StaffOpt = { id: string; name: string };

export function NewVisaCaseForm({
  students,
  routes,
  offers,
  visaStaff,
  defaultStudentId,
}: {
  students: StudentOpt[];
  routes: RouteOpt[];
  offers: OfferOpt[];
  visaStaff: StaffOpt[];
  defaultStudentId?: string;
}) {
  const [studentId, setStudentId] = useState(defaultStudentId ?? "");
  const [routeId, setRouteId] = useState("");
  const [offerMode, setOfferMode] = useState<"none" | "existing" | "external">("none");

  const selectedRoute = routes.find((r) => r.id === routeId);
  const matchingOffers = useMemo(
    () =>
      offers.filter(
        (o) => o.studentId === studentId && (!selectedRoute || o.countryId === selectedRoute.countryId)
      ),
    [offers, studentId, selectedRoute]
  );

  return (
    <form action={openVisaCaseAction} className="flex flex-col gap-4 max-w-xl">
      <Field label="Student">
        <select
          name="studentId"
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className={inputClass}
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Country / visa route">
        <select
          name="visaRouteId"
          required
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className={inputClass}
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.countryName} — {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Assign to (Visa Team)">
        <select name="assignedToId" className={inputClass}>
          <option value="">Unassigned</option>
          {visaStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="block text-xs font-medium text-slate-600 mb-1">
          Active offer for this case
        </span>
        <div className="flex gap-4 text-sm mb-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={offerMode === "none"}
              onChange={() => setOfferMode("none")}
            />
            None yet
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={offerMode === "existing"}
              onChange={() => setOfferMode("existing")}
            />
            Use an existing internal offer
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={offerMode === "external"}
              onChange={() => setOfferMode("external")}
            />
            External offer (visa-only student)
          </label>
        </div>
        <input type="hidden" name="offerMode" value={offerMode} />

        {offerMode === "existing" && (
          <select name="existingOfferId" className={inputClass} required>
            <option value="">Select offer</option>
            {matchingOffers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.universityName} ({o.status})
              </option>
            ))}
          </select>
        )}

        {offerMode === "external" && (
          <div className="grid grid-cols-2 gap-3">
            <input name="universityName" placeholder="University" required className={inputClass} />
            <input name="courseName" placeholder="Course" required className={inputClass} />
            <input name="intake" placeholder="Intake, e.g. Fall 2026" required className={inputClass} />
            <select name="offerStatus" required className={inputClass}>
              <option value="UNCONDITIONAL">Unconditional</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </div>
        )}
      </div>

      <Field label="Notes (optional)">
        <input name="notes" className={inputClass} />
      </Field>

      <Button type="submit" className="w-fit">
        Open visa case
      </Button>
    </form>
  );
}
