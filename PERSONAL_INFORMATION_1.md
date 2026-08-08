# DS-160: Personal Information 1

This page is conditional: selecting **Yes** for other names or telecodes reveals
additional fields. The test fixture uses invented data only and must never be
submitted as a real application.

## Names

- **Surnames:** free text matching the passport. Test: `TEST`.
- **Given Names:** free text matching the passport. Official guidance uses
  `FNU` when the passport has no given name. Test: `APPLICANT`.
- **Full Name in Native Alphabet:** native-script text or **Does Not Apply**.
  Test: Does Not Apply.
- **Other names used:** `YES` or `NO`. Choosing `YES` reveals other surname and
  given-name fields. Test: `NO`.
- **Telecode representing the name:** `YES` or `NO`. Choosing `YES` reveals
  telecode surname and given-name fields. Test: `NO`.

## Personal details

- **Sex:** `MALE` or `FEMALE`. Test: `MALE`.
- **Marital Status:** `MARRIED`, `COMMON LAW MARRIAGE`,
  `CIVIL UNION/DOMESTIC PARTNERSHIP`, `SINGLE`, `WIDOWED`, `DIVORCED`,
  `LEGALLY SEPARATED`, or `OTHER`. Test: `SINGLE`.
- **Date of Birth:** day `01`–`31`, month `JAN`–`DEC`, and a four-digit year.
  Test: `01 JAN 1990`.
- **City of Birth:** free text. Test: `HYDERABAD`.
- **State/Province of Birth:** free text or **Does Not Apply**. Test:
  `TELANGANA`.
- **Country/Region of Birth:** a country/region from CEAC's current list. Test:
  `INDIA`.

The script also records the controls and current option values exposed by CEAC
to `data/personal-information-1.fields.json` on each run. This local inventory
is git-ignored because the live site can change.

Test data: [`fixtures/personal-information-1.test.json`](fixtures/personal-information-1.test.json)

Official references:

- [DS-160 FAQ](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application/ds-160-faqs.html)
- [Official DS-160 exemplar](https://travel.state.gov/content/dam/visas/PDF-other/DS-160-Example_11-19-2020.pdf)
