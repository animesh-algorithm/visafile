# DS-160: Personal Information 2

This page collects nationality and identification information. The test fixture uses
invented data only and must never be submitted as a real application.

## Nationality

- **Current Nationality:** a country from CEAC's current list. Test: `INDIA`.
- **Other nationalities held:** `YES` or `NO`. Choosing `YES` reveals additional
  fields for previous nationalities. Test: `NO`.

## Identification Numbers

- **National Identification Number:** free text, if applicable. Test:
  `TEST123456789`.
- **U.S. Social Security Number:** `YES` or `NO`. Choosing `YES` reveals a field
  for the number. Test: `NO`.
- **U.S. Taxpayer ID Number:** `YES` or `NO`. Choosing `YES` reveals a field for
  the number. Test: `NO`.

The script also records the controls and current option values exposed by CEAC
to `data/personal-information-2.fields.json` on each run. This local inventory
is git-ignored because the live site can change.

Test data: [`fixtures/personal-information-2.test.json`](fixtures/personal-information-2.test.json)

Official references:

- [DS-160 FAQ](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application/ds-160-faqs.html)
- [Official DS-160 exemplar](https://travel.state.gov/content/dam/visas/PDF-other/DS-160-Example_11-19-2020.pdf)
