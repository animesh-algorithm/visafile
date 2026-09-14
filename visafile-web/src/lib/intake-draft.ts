import { allFields, type Answer, type Answers } from "@/lib/intake-definition";

export const INTAKE_DRAFT_STORAGE_KEY = "visafile-intake-draft-v1";

const LEGACY_COUNTRY_CODES: Record<string, string> = {
  AUS: "ASTL",
  ARE: "UAE",
  BRA: "BRZL",
  CHN: "CHIN",
  DEU: "GER",
  FRA: "FRAN",
  GBR: "GRBR",
  SGP: "SING",
  ZAF: "SAFR",
};

const COUNTRY_FIELD_IDS = new Set([
  "personalInformation1.countryRegionOfBirth",
  "personalInformation2.nationality",
  "passport.issuedCountry",
  "passport.issuedInCountry",
  "addressPhone.country",
  "workEducation.employerCountry",
]);

interface StoredDraft {
  answers?: Answers;
  step?: number;
}

export function loadIntakeDraft() {
  const stored = window.localStorage.getItem(INTAKE_DRAFT_STORAGE_KEY);
  if (!stored) return null;

  const parsed = JSON.parse(stored) as StoredDraft;
  return {
    answers: migrateDraftAnswers(parsed.answers ?? {}),
    step: parsed.step ?? 0,
  };
}

export function saveIntakeDraft(answers: Answers, step: number) {
  window.localStorage.setItem(
    INTAKE_DRAFT_STORAGE_KEY,
    JSON.stringify({
      version: 2,
      answers,
      step,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearIntakeDraft() {
  window.localStorage.removeItem(INTAKE_DRAFT_STORAGE_KEY);
}

function migrateDraftAnswers(storedAnswers: Answers): Answers {
  const nextAnswers = { ...storedAnswers };
  delete nextAnswers["meta.applicationId"];
  delete nextAnswers["travelInformation.lengthOfStay"];

  const invertKnownAnswer = (value: Answer | undefined) =>
    value === "YES" ? false : value === "NO" ? true : undefined;
  const nativeNameApplies = invertKnownAnswer(
    nextAnswers["personalInformation1.nativeNameApplies"],
  );
  if (nativeNameApplies !== undefined) {
    nextAnswers["personalInformation1.fullNameNativeAlphabetDoesNotApply"] =
      nativeNameApplies;
  }
  delete nextAnswers["personalInformation1.nativeNameApplies"];

  const hasNationalId = invertKnownAnswer(
    nextAnswers["personalInformation2.hasNationalId"],
  );
  if (hasNationalId !== undefined) {
    nextAnswers[
      "personalInformation2.nationalIdentificationNumberDoesNotApply"
    ] = hasNationalId;
  }
  delete nextAnswers["personalInformation2.hasNationalId"];

  const migrateParentKnownAnswers = (parent: "father" | "mother") => {
    const nameKnown = invertKnownAnswer(
      nextAnswers[`family.${parent}NameKnown`],
    );
    if (nameKnown !== undefined) {
      nextAnswers[`family.${parent}SurnameUnknown`] = nameKnown;
      nextAnswers[`family.${parent}GivenNamesUnknown`] = nameKnown;
    }
    delete nextAnswers[`family.${parent}NameKnown`];

    const dobKnown = invertKnownAnswer(nextAnswers[`family.${parent}DobKnown`]);
    if (dobKnown !== undefined) {
      nextAnswers[`family.${parent}DobUnknown`] = dobKnown;
    }
    delete nextAnswers[`family.${parent}DobKnown`];
  };
  migrateParentKnownAnswers("father");
  migrateParentKnownAnswers("mother");

  const contactNameDoesNotApply = nextAnswers["usContact.nameDoesNotApply"];
  if (contactNameDoesNotApply === "YES") {
    nextAnswers["usContact.nameDoesNotApply"] = true;
  } else if (contactNameDoesNotApply === "NO") {
    nextAnswers["usContact.nameDoesNotApply"] = false;
  }

  const fieldSpecificReplacements: Record<string, Record<string, string>> = {
    "meta.locationCode": { CHN: "MDR", CLT: "CLC", MUM: "BMB" },
    "travelInformation.purposeOfTrip": { OTHER: "N" },
    "travelInformation.otherPurpose": { B1: "B1-CF", B2: "B2-TM" },
  };

  for (const field of allFields) {
    if (field.kind !== "select") continue;
    const current = nextAnswers[field.id];
    if (typeof current !== "string") continue;

    const replacement =
      fieldSpecificReplacements[field.id]?.[current] ??
      (COUNTRY_FIELD_IDS.has(field.id)
        ? LEGACY_COUNTRY_CODES[current]
        : undefined);
    const migrated = replacement ?? current;

    if (field.options?.some((option) => option.value === migrated)) {
      nextAnswers[field.id] = migrated;
    } else {
      delete nextAnswers[field.id];
    }
  }

  return nextAnswers;
}
