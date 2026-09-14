import type { Answer, Answers } from "@/lib/intake-definition";

type JsonObject = Record<string, unknown>;

export class IntakeMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakeMappingError";
  }
}

const MONTH_CODES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function value(answers: Answers, path: string) {
  return answers[path];
}

function textValue(answers: Answers, path: string) {
  const answer = value(answers, path);
  return typeof answer === "string" && answer.trim()
    ? answer.trim()
    : undefined;
}

function lines(answer: Answer | undefined) {
  if (Array.isArray(answer))
    return answer.map((item) => item.trim()).filter(Boolean);
  if (typeof answer !== "string") return [];
  return answer
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parts(line: string, expected: number, label: string) {
  const values = line.split(/\s*(?:\||—)\s*/).map((item) => item.trim());
  if (values.length < expected || values.some((item) => !item)) {
    throw new IntakeMappingError(
      `${label} must use ${expected} pipe-separated values on each line.`,
    );
  }
  return values;
}

function isoDate(
  answer: Answer | undefined,
  monthStyle: "code" | "number" | "padded",
) {
  if (typeof answer !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(answer);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return {
    day: monthStyle === "number" ? String(Number(day)) : day,
    month:
      monthStyle === "code"
        ? MONTH_CODES[Number(month) - 1]
        : monthStyle === "number"
          ? String(Number(month))
          : month,
    year,
  };
}

function setPath(target: JsonObject, path: string, answer: unknown) {
  const keys = path.split(".");
  let cursor = target;
  for (const key of keys.slice(0, -1)) {
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as JsonObject;
  }
  cursor[keys.at(-1)!] = answer;
}

function copySimpleAnswers(answers: Answers) {
  const application: JsonObject = {};
  const handledPrefixes = [
    "security.",
    "personalInformation1.dateOfBirth",
    "passport.issuedDate",
    "passport.expirationDate",
    "family.fatherDateOfBirth",
    "family.motherDateOfBirth",
    "workEducation.startDate",
    "travelInformation.arrivalDate",
    "travelInformation.departureDate",
  ];
  const handledFields = new Set([
    "travelInformation.payer",
    "addressPhone.mailingAddress",
    "previousUsTravel.lastVisa",
    "additionalWorkEducation.militaryServiceDetails",
    "personalInformation2.ssn",
    "previousWorkEducation.employers",
    "previousWorkEducation.schools",
  ]);

  for (const [path, answer] of Object.entries(answers)) {
    if (
      handledFields.has(path) ||
      handledPrefixes.some((prefix) => path.startsWith(prefix)) ||
      Array.isArray(answer)
    ) {
      continue;
    }
    setPath(application, path, answer);
  }
  return application;
}

function mapSecurityAnswers(answers: Answers) {
  const securityBackground: JsonObject = {};
  for (const [path, answer] of Object.entries(answers)) {
    const match = /^security\.(part[1-5])\.([^.]+)$/.exec(path);
    if (!match || (answer !== "YES" && answer !== "NO")) continue;
    const [, part, question] = match;
    const partObject = (securityBackground[part] ??= {}) as JsonObject;
    const explanation = textValue(answers, `${path}.explain`);
    partObject[question] = explanation
      ? { answer, explain: explanation }
      : { answer };
  }
  return securityBackground;
}

function mapDelimitedLists(answers: Answers, application: JsonObject) {
  const simpleLists = [
    "personalInformation2.permanentResidentCountries",
    "travelInformation.locationsToVisit",
    "addressPhone.additionalPhones",
    "addressPhone.additionalEmails",
    "additionalWorkEducation.languages",
    "additionalWorkEducation.countriesVisitedList",
    "additionalWorkEducation.organizations",
  ];
  for (const path of simpleLists) {
    const entries = lines(value(answers, path));
    if (entries.length) setPath(application, path, entries);
  }

  const schemas: Array<{
    path: string;
    label: string;
    count: number;
    map: (entry: string[]) => JsonObject;
  }> = [
    {
      path: "personalInformation1.otherNames",
      label: "Other names",
      count: 2,
      map: ([surname, givenNames]) => ({ surname, givenNames }),
    },
    {
      path: "personalInformation2.otherNationalities",
      label: "Other nationalities",
      count: 2,
      map: ([nationality, passportNumber]) => ({
        nationality,
        hasPassport: passportNumber.toUpperCase() === "NO" ? "NO" : "YES",
        ...(passportNumber.toUpperCase() === "NO" ? {} : { passportNumber }),
      }),
    },
    {
      path: "travelCompanions.companions",
      label: "Travel companions",
      count: 3,
      map: ([surname, givenNames, relationship]) => ({
        surname,
        givenNames,
        relationship,
      }),
    },
    {
      path: "previousUsTravel.usDriversLicenses",
      label: "Driver licenses",
      count: 2,
      map: ([number, state]) => ({ number, state }),
    },
    {
      path: "addressPhone.socialMediaAccounts",
      label: "Social media accounts",
      count: 2,
      map: ([platform, identifier]) => ({ platform, identifier }),
    },
    {
      path: "family.immediateRelatives",
      label: "Immediate relatives",
      count: 4,
      map: ([surname, givenNames, relationship, status]) => ({
        surname,
        givenNames,
        relationship,
        status,
      }),
    },
  ];
  for (const schema of schemas) {
    const entries = lines(value(answers, schema.path));
    if (entries.length) {
      setPath(
        application,
        schema.path,
        entries.map((entry) =>
          schema.map(parts(entry, schema.count, schema.label)),
        ),
      );
    }
  }

  const previousVisits = lines(
    value(answers, "previousUsTravel.previousVisits"),
  );
  if (previousVisits.length) {
    setPath(
      application,
      "previousUsTravel.previousVisits",
      previousVisits.map((entry) => {
        const [arrival, duration, unit] = parts(entry, 3, "Previous visits");
        const arrivalDate = isoDate(arrival, "code");
        if (!arrivalDate)
          throw new IntakeMappingError(
            "Previous visit dates must use YYYY-MM-DD.",
          );
        return { arrivalDate, lengthOfStay: { duration, unit } };
      }),
    );
  }

  const lostPassports = lines(value(answers, "passport.lostStolenDetails"));
  if (lostPassports.length) {
    setPath(
      application,
      "passport.lostStolenDetails",
      lostPassports.map((entry) => {
        const [number, country, explain] = parts(entry, 3, "Lost passports");
        return {
          ...(number.toUpperCase() === "NA"
            ? { numberDoesNotApply: true }
            : { number, numberDoesNotApply: false }),
          country,
          explain,
        };
      }),
    );
  }

  const employers = lines(value(answers, "previousWorkEducation.employers"));
  if (employers.length) {
    setPath(
      application,
      "previousWorkEducation.employers",
      employers.map((entry) => {
        const [name, jobTitle, country, city, start, end, duties] = parts(
          entry,
          7,
          "Previous employers",
        );
        const startDate = isoDate(start, "code");
        const endDate = isoDate(end, "code");
        if (!startDate || !endDate) {
          throw new IntakeMappingError(
            "Previous employment dates must use YYYY-MM-DD.",
          );
        }
        return { name, jobTitle, country, city, startDate, endDate, duties };
      }),
    );
  }

  const schools = lines(value(answers, "previousWorkEducation.schools"));
  if (schools.length) {
    setPath(
      application,
      "previousWorkEducation.schools",
      schools.map((entry) => {
        const [name, courseOfStudy, country, city, start, end] = parts(
          entry,
          6,
          "Schools",
        );
        const startDate = isoDate(start, "code");
        const endDate = isoDate(end, "code");
        if (!startDate || !endDate) {
          throw new IntakeMappingError("School dates must use YYYY-MM-DD.");
        }
        return { name, courseOfStudy, country, city, startDate, endDate };
      }),
    );
  }
}

function addDerivedValues(answers: Answers, application: JsonObject) {
  const dateMappings: Array<[string, string, "code" | "number" | "padded"]> = [
    [
      "personalInformation1.dateOfBirth",
      "personalInformation1.dateOfBirth",
      "code",
    ],
    [
      "travelInformation.arrivalDate",
      "travelInformation.arrivalDate",
      "number",
    ],
    [
      "travelInformation.departureDate",
      "travelInformation.departureDate",
      "number",
    ],
    ["workEducation.startDate", "workEducation.startDate", "code"],
  ];
  for (const [source, destination, style] of dateMappings) {
    const mapped = isoDate(value(answers, source), style);
    if (mapped) setPath(application, destination, mapped as unknown as Answer);
  }

  const issued = isoDate(value(answers, "passport.issuedDate"), "padded");
  const expires = isoDate(value(answers, "passport.expirationDate"), "padded");
  if (issued) {
    setPath(application, "passport.issuedDay", issued.day);
    setPath(application, "passport.issuedMonth", issued.month);
    setPath(application, "passport.issuedYear", issued.year);
  }
  if (expires) {
    setPath(application, "passport.expireDay", expires.day);
    setPath(application, "passport.expireMonth", expires.month);
    setPath(application, "passport.expireYear", expires.year);
  }

  for (const parent of ["father", "mother"] as const) {
    const date = isoDate(value(answers, `family.${parent}DateOfBirth`), "code");
    if (!date) continue;
    setPath(application, `family.${parent}DobDay`, date.day);
    setPath(application, `family.${parent}DobMonth`, date.month);
    setPath(application, `family.${parent}DobYear`, date.year);
  }

  setPath(
    application,
    "personalInformation1.stateProvinceOfBirthDoesNotApply",
    !textValue(answers, "personalInformation1.stateProvinceOfBirth"),
  );
  setPath(
    application,
    "passport.bookNumberDoesNotApply",
    !textValue(answers, "passport.bookNumber"),
  );
  setPath(
    application,
    "addressPhone.stateDoesNotApply",
    !textValue(answers, "addressPhone.state"),
  );
  setPath(
    application,
    "addressPhone.postalCodeDoesNotApply",
    !textValue(answers, "addressPhone.postalCode"),
  );
  setPath(
    application,
    "addressPhone.workPhoneDoesNotApply",
    !textValue(answers, "addressPhone.workPhone"),
  );
  setPath(
    application,
    "addressPhone.secondaryPhoneDoesNotApply",
    !textValue(answers, "addressPhone.secondaryPhone"),
  );
  setPath(
    application,
    "usContact.organizationDoesNotApply",
    !textValue(answers, "usContact.organization"),
  );
  setPath(
    application,
    "usContact.emailDoesNotApply",
    !textValue(answers, "usContact.email"),
  );
  setPath(
    application,
    "workEducation.employerStateDoesNotApply",
    !textValue(answers, "workEducation.employerState"),
  );
  setPath(
    application,
    "workEducation.employerPostalCodeDoesNotApply",
    !textValue(answers, "workEducation.employerPostalCode"),
  );

  const mailing = textValue(answers, "addressPhone.mailingAddress");
  if (mailing) {
    const [street, street2, city, state, postalCode, country] = parts(
      mailing,
      6,
      "Mailing address",
    );
    setPath(application, "addressPhone.mailingAddress", {
      street,
      ...(street2.toUpperCase() === "NA" ? {} : { street2 }),
      city,
      ...(state.toUpperCase() === "NA"
        ? { stateDoesNotApply: true }
        : { state, stateDoesNotApply: false }),
      ...(postalCode.toUpperCase() === "NA"
        ? { postalCodeDoesNotApply: true }
        : { postalCode, postalCodeDoesNotApply: false }),
      country,
    });
  }

  const payer = textValue(answers, "travelInformation.payer");
  if (payer) {
    const [
      surname,
      givenNames,
      phone,
      email,
      relationship,
      street,
      city,
      state,
      zipCode,
      country,
    ] = parts(payer, 10, "Payer details");
    setPath(application, "travelInformation.payer", {
      surname,
      givenNames,
      phone,
      email,
      relationship,
      address: { street, city, state, zipCode, country },
    });
  }

  const ssn = textValue(answers, "personalInformation2.ssn");
  if (ssn) {
    const match = /^(\d{3})-?(\d{2})-?(\d{4})$/.exec(ssn);
    if (!match)
      throw new IntakeMappingError(
        "The Social Security Number must contain nine digits.",
      );
    setPath(application, "personalInformation2.ssn", {
      area: match[1],
      group: match[2],
      serial: match[3],
    });
  }

  const lastVisa = textValue(answers, "previousUsTravel.lastVisa");
  if (lastVisa) {
    const [issued, visaNumber, sameType, sameLocation, tenPrinted] = parts(
      lastVisa,
      5,
      "Most recent visa",
    );
    const issuedDate = isoDate(issued, "code");
    if (!issuedDate)
      throw new IntakeMappingError(
        "The most recent visa date must use YYYY-MM-DD.",
      );
    setPath(application, "previousUsTravel.lastVisa", {
      issuedDate,
      ...(visaNumber.toUpperCase() === "NA" ? {} : { visaNumber }),
      sameType: sameType.toUpperCase(),
      sameLocation: sameLocation.toUpperCase(),
      tenPrinted: tenPrinted.toUpperCase(),
    });
  }

  const military = textValue(
    answers,
    "additionalWorkEducation.militaryServiceDetails",
  );
  if (military) {
    const [country, branch, rank, specialty, start, end] = parts(
      military,
      6,
      "Military service",
    );
    const startDate = isoDate(start, "code");
    const endDate = isoDate(end, "code");
    if (!startDate || !endDate) {
      throw new IntakeMappingError(
        "Military service dates must use YYYY-MM-DD.",
      );
    }
    setPath(application, "additionalWorkEducation.militaryServiceDetails", [
      { country, branch, rank, specialty, startDate, endDate },
    ]);
  }
}

export function intakeAnswersToDs160(
  answers: Answers,
  options: { authorizeOfficialSubmission?: boolean } = {},
) {
  const application = copySimpleAnswers(answers);
  mapDelimitedLists(answers, application);
  addDerivedValues(answers, application);
  application.securityBackground = mapSecurityAnswers(answers);
  application.signSubmit = {
    assistedByPreparer: "NO",
    passportNumber: textValue(answers, "passport.passportNumber") ?? null,
  };
  const meta = (application.meta ??= {}) as JsonObject;
  meta.allowSubmit = Boolean(options.authorizeOfficialSubmission);
  return application;
}
