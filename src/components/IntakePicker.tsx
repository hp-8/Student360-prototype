"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui";

type Country = { id: string; name: string };
type Intake = { id: string; name: string; countryId: string };

const OTHER_VALUE = "__other__";

export function IntakePicker({
  countries,
  intakes,
  fixedCountryId,
}: {
  countries?: Country[];
  intakes: Intake[];
  // When set, the country is already implied by context (e.g. a chosen visa
  // route) - the Country select is hidden and this drives the intake filter
  // directly instead.
  fixedCountryId?: string;
}) {
  // When fixedCountryId is supplied it *is* the country - derive rather than
  // mirror it into state, so there's nothing to keep in sync.
  const [pickedCountryId, setPickedCountryId] = useState("");
  const countryId = fixedCountryId ?? pickedCountryId;

  const [intakeChoice, setIntakeChoice] = useState("");

  // A chosen intake belongs to a country, so changing country - by either
  // route - invalidates it. React's documented "adjust state during render"
  // pattern; runs before the children render, so no wasted pass.
  const [lastCountryId, setLastCountryId] = useState(countryId);
  if (lastCountryId !== countryId) {
    setLastCountryId(countryId);
    setIntakeChoice("");
  }

  const availableIntakes = intakes.filter((i) => i.countryId === countryId);
  const selectedIntake = availableIntakes.find((i) => i.id === intakeChoice);
  const showManualEntry = intakeChoice === OTHER_VALUE || (countryId !== "" && availableIntakes.length === 0);

  return (
    <>
      {fixedCountryId === undefined && (
        <Field label="Country">
          <select
            name="countryId"
            required
            value={countryId}
            onChange={(e) => setPickedCountryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select country</option>
            {(countries ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Intake">
        <select
          value={intakeChoice}
          onChange={(e) => setIntakeChoice(e.target.value)}
          disabled={!countryId}
          className={inputClass}
        >
          <option value="">{countryId ? "Select intake" : "Select a country first"}</option>
          {availableIntakes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
          {countryId && <option value={OTHER_VALUE}>Other / not listed</option>}
        </select>
      </Field>

      {showManualEntry ? (
        <Field label="Intake name">
          <input name="intake" required placeholder="e.g. Fall 2026" className={inputClass} />
        </Field>
      ) : (
        <input type="hidden" name="intake" value={selectedIntake?.name ?? ""} />
      )}
      <input type="hidden" name="intakeId" value={intakeChoice === OTHER_VALUE ? "" : intakeChoice} />
    </>
  );
}
