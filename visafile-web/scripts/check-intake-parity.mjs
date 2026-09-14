import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const definition = await readFile(
  resolve(appRoot, "src/lib/intake-definition.ts"),
  "utf8",
);
const experience = await readFile(
  resolve(appRoot, "src/components/intake/intake-experience.tsx"),
  "utf8",
);
const fieldDefinition = await readFile(
  resolve(appRoot, "src/lib/intake-field-definition.ts"),
  "utf8",
);
const draft = await readFile(
  resolve(appRoot, "src/lib/intake-draft.ts"),
  "utf8",
);
const review = await readFile(
  resolve(appRoot, "src/components/intake/intake-review.tsx"),
  "utf8",
);

assert.match(definition, /What is your Mother's Maiden name\?/);
assert.doesNotMatch(definition, /Existing DS-160 application ID/);
assert.doesNotMatch(definition, /optionalText\("meta\.applicationId"/);
assert.match(definition, /INTERVIEW_LOCATIONS/);
assert.match(definition, /COUNTRIES_BIRTH/);
assert.match(definition, /COUNTRIES_NATIONALITY/);
assert.match(definition, /COUNTRIES_ADDRESS/);
assert.match(definition, /COUNTRIES_PASSPORT_ISSUED/);
assert.match(definition, /COUNTRIES_PASSPORT_ISSUED_IN/);
assert.match(definition, /PURPOSE_OF_TRIP/);
assert.match(definition, /OTHER_PURPOSE/);
assert.match(
  definition,
  /field: "travelInformation\.purposeOfTrip",\s*equals: "B"/,
);
assert.match(definition, /LENGTH_OF_STAY_UNIT/);
assert.match(definition, /redactOnReview: true/);
assert.match(fieldDefinition, /yesNoValues\?: \{ YES: boolean; NO: boolean \}/);
assert.doesNotMatch(definition, /family\.motherNameKnown/);
assert.doesNotMatch(definition, /personalInformation2\.hasNationalId/);
assert.match(draft, /delete nextAnswers\["meta\.applicationId"\]/);
assert.match(draft, /CHN: "MDR", CLT: "CLC", MUM: "BMB"/);
assert.match(draft, /field\.options\?\.some/);
assert.match(review, /field\.redactOnReview\s*\?\s*"Provided"/);
assert.doesNotMatch(experience, /value !== false/);

console.log("Intake definition and recovery-field checks passed.");
