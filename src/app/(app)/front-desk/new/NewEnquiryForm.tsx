"use client";

import { useActionState, useState } from "react";
import { newEnquiryAction, type NewEnquiryState } from "./actions";
import { Field, inputClass, Button, Card } from "@/components/ui";

const initialState: NewEnquiryState = {};

export function NewEnquiryForm({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    newEnquiryAction,
    initialState
  );
  const [override, setOverride] = useState(false);
  const v = state.values;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="confirmed" value={override ? "true" : "false"} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          <input
            name="firstName"
            required
            defaultValue={v?.firstName}
            className={inputClass}
          />
        </Field>
        <Field label="Last name">
          <input
            name="lastName"
            required
            defaultValue={v?.lastName}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">
          <input
            name="phone"
            required
            defaultValue={v?.phone}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={v?.email}
            className={inputClass}
          />
        </Field>
      </div>
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
      <Field label="Education snapshot">
        <textarea
          name="educationSnapshot"
          rows={2}
          defaultValue={v?.educationSnapshot}
          className={inputClass}
          placeholder="e.g. B.Tech Computer Science, 8.2 CGPA, 2025 graduate"
        />
      </Field>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
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
