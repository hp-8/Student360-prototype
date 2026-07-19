"use client";

import { useActionState, useState } from "react";
import { newEnquiryAction, type NewEnquiryState } from "./actions";
import { Field, inputClass, Button, Card } from "@/components/ui";

const initialState: NewEnquiryState = {};

export function NewEnquiryForm({
  branches,
  countries,
}: {
  branches: { id: string; name: string }[];
  countries: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    newEnquiryAction,
    initialState
  );
  const [override, setOverride] = useState(false);
  const [ieltsAttempted, setIeltsAttempted] = useState(
    state.values?.ieltsAttempted === "true"
  );
  const v = state.values;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="confirmed" value={override ? "true" : "false"} />
      <input type="hidden" name="ieltsAttempted" value={ieltsAttempted ? "true" : "false"} />

      <p className="text-xs font-semibold text-[var(--brass)] uppercase tracking-wide -mb-2">
        Student
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          <input name="firstName" required defaultValue={v?.firstName} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name="lastName" required defaultValue={v?.lastName} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">
          <input name="phone" required defaultValue={v?.phone} className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={v?.email} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Father's name">
          <input name="fatherName" defaultValue={v?.fatherName} className={inputClass} />
        </Field>
        <Field label="Mother's name">
          <input name="motherName" defaultValue={v?.motherName} className={inputClass} />
        </Field>
      </div>

      <p className="text-xs font-semibold text-[var(--brass)] uppercase tracking-wide mt-2 -mb-2">
        Academic background
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="School name">
          <input name="schoolName" required defaultValue={v?.schoolName} className={inputClass} />
        </Field>
        <Field label="% received">
          <input
            name="percentageReceived"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            defaultValue={v?.percentageReceived}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="University attended (if any)">
        <input
          name="universityAttended"
          defaultValue={v?.universityAttended}
          className={inputClass}
          placeholder="Optional — for students who already hold a degree"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4 items-end">
        <Field label="Country intended">
          <select
            name="intendedCountryId"
            defaultValue={v?.intendedCountryId ?? ""}
            key={v?.intendedCountryId ?? "none"}
            className={inputClass}
          >
            <option value="">Not decided yet</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <label className="flex items-center gap-2 text-sm mb-1.5">
            <input
              type="checkbox"
              checked={ieltsAttempted}
              onChange={(e) => setIeltsAttempted(e.target.checked)}
            />
            IELTS given?
          </label>
          {ieltsAttempted && (
            <input
              name="ieltsScore"
              placeholder="Score, e.g. 7.5"
              defaultValue={v?.ieltsScore}
              className={inputClass}
            />
          )}
        </div>
      </div>

      <p className="text-xs font-semibold text-[var(--brass)] uppercase tracking-wide mt-2 -mb-2">
        Enquiry details
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lead source">
          <input
            name="source"
            placeholder="e.g. Instagram ad, Walk-in, Referral"
            defaultValue={v?.source}
            className={inputClass}
          />
        </Field>
        <Field label="Branch">
          <select
            name="branchId"
            required
            defaultValue={v?.branchId ?? ""}
            key={v?.branchId ?? "none"}
            className={inputClass}
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Additional notes (optional)">
        <textarea
          name="additionalNotes"
          rows={2}
          defaultValue={v?.additionalNotes}
          className={inputClass}
          placeholder="Anything else worth capturing at first touchpoint"
        />
      </Field>

      {state.error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {state.duplicates &&
        (state.duplicates.students.length > 0 ||
          state.duplicates.leads.length > 0) &&
        !override && (
          <Card className="p-4 border-amber-300 bg-amber-50">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Possible duplicates found. Review before creating a new record.
            </p>
            <ul className="text-sm text-amber-900 space-y-1">
              {state.duplicates.students.map((s) => (
                <li key={s.id}>
                  Existing student: {s.name} · {s.phone} · {s.email ?? "—"}
                </li>
              ))}
              {state.duplicates.leads.map((l) => (
                <li key={l.id}>
                  Existing open enquiry: {l.name} · {l.phone} · {l.email ?? "—"}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOverride(true)}
              className="mt-3 text-sm underline text-amber-900"
            >
              These are different people — create the enquiry anyway
            </button>
          </Card>
        )}

      <Button type="submit" className="w-fit">
        {pending ? "Checking..." : override ? "Create enquiry anyway" : "Create enquiry"}
      </Button>
    </form>
  );
}
