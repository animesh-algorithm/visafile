# Where to put real applicant data

Edit the JSON files under [`fixtures/`](fixtures/). The automation reads these
on each run. Use real values only when you intend to sign and submit a genuine
application.

## Required for a full run

| Page | File |
|------|------|
| Personal Information 1 (name, DOB, birthplace, sex, marital status) | [`fixtures/personal-information-1.test.json`](fixtures/personal-information-1.test.json) |
| Personal Information 2 (nationality, national ID, SSN/Tax NA) | [`fixtures/personal-information-2.test.json`](fixtures/personal-information-2.test.json) |
| Travel Information | [`fixtures/travel-information.test.json`](fixtures/travel-information.test.json) |
| Travel Companions | [`fixtures/travel-companions.test.json`](fixtures/travel-companions.test.json) |
| Previous U.S. Travel | [`fixtures/previous-us-travel.test.json`](fixtures/previous-us-travel.test.json) |
| Address and Phone (+ social media) | [`fixtures/address-phone.test.json`](fixtures/address-phone.test.json) |
| Passport | [`fixtures/passport.test.json`](fixtures/passport.test.json) |
| U.S. Point of Contact | [`fixtures/us-contact.test.json`](fixtures/us-contact.test.json) |
| Family / Relatives | [`fixtures/family.test.json`](fixtures/family.test.json) |
| Present Work / Education | [`fixtures/work-education.test.json`](fixtures/work-education.test.json) |
| Previous Work / Education | [`fixtures/work-education-2.test.json`](fixtures/work-education-2.test.json) |
| Additional Work / Education (languages) | [`fixtures/work-education-3.test.json`](fixtures/work-education-3.test.json) |
| Security and Background (mostly NO) | [`fixtures/security-background.test.json`](fixtures/security-background.test.json) |
| Sign and Submit | [`fixtures/sign-submit.test.json`](fixtures/sign-submit.test.json) |

Also set in [`.env`](.env):

- `DS160_LOCATION` — consulate code (e.g. `HYD`)
- `DS160_SECURITY_ANSWER` — answer chosen when the application was created
- `DS160_APPLICATION_ID` — optional when resuming (otherwise `data/session.json`)

## Sign and Submit

[`fixtures/sign-submit.test.json`](fixtures/sign-submit.test.json):

```json
{
  "assistedByPreparer": "NO",
  "passportNumber": null
}
```

- `passportNumber`: if `null`, uses `passportNumber` from
  `fixtures/passport.test.json` (keep them identical).
- `assistedByPreparer`: `YES` or `NO`. If `YES`, you can add a `preparer.texts`
  map of CEAC field partial IDs after probing that branch once.

Submission is **disabled by default**. To allow the script to click
**Sign and Submit Application**:

```bash
DS160_RESUME=true DS160_ALLOW_SUBMIT=true npm start
```

You will still enter the Sign-page CAPTCHA via [`data/captcha.txt`](data/captcha.txt).

After a successful submit, confirmation details are written to:

- `data/confirmation.json` — application ID + metadata
- `data/ds160-confirmation.pdf` — printable confirmation
- `data/ds160-confirmation.png` — screenshot

See [CONFIRMATION.md](CONFIRMATION.md).

## Run order

```bash
# Fill / resume up through review; stop at Sign unless ALLOW_SUBMIT is set
DS160_RESUME=true npm start

# After fixtures contain real data — sign and submit
DS160_RESUME=true DS160_ALLOW_SUBMIT=true npm start
```

Do not submit invented or placeholder data to CEAC.
