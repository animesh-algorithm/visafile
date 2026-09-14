import assert from "node:assert/strict";
import { intakeAnswersToDs160 } from "../src/lib/automation/intake-to-ds160";
import { createLocalhostPrefillAnswers } from "../src/lib/local-prefill";
import { fieldById, labelForAnswer } from "../src/lib/intake-definition";
import { validateApplication } from "../../mvp/shared/validate";

const prepared = intakeAnswersToDs160(createLocalhostPrefillAnswers());
const validation = validateApplication(prepared);

assert.deepEqual(validation.errors, []);
assert.equal(validation.ok, true);
assert.equal((prepared.meta as { allowSubmit: boolean }).allowSubmit, false);
assert.equal(
  (prepared.personalInformation1 as { dateOfBirth: { month: string } })
    .dateOfBirth.month,
  "JAN",
);
assert.equal(
  (prepared.signSubmit as { assistedByPreparer: string }).assistedByPreparer,
  "NO",
);
assert.equal(
  labelForAnswer(fieldById.get("family.fatherSurnameUnknown")!, false),
  "Yes",
);
assert.equal(
  labelForAnswer(
    fieldById.get("personalInformation1.fullNameNativeAlphabetDoesNotApply")!,
    true,
  ),
  "No",
);

console.log("Automation payload matches the MVP DS-160 schema.");
