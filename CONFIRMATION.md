# DS-160 Confirmation page

After a successful **Sign and Submit**, CEAC shows a confirmation page with the
application ID / barcode. You must keep this page for the visa interview.

## What the automation does

`handleConfirmationPage()` in [`src/index.js`](src/index.js):

1. Detects the confirmation page (barcode image, Print Confirmation, or
   confirmation URL/title)
2. Saves field inventory to `data/confirmation.fields.json`
3. Writes `data/ds160-confirmation.pdf` and `data/ds160-confirmation.png`
4. Clicks **Print Confirmation** when available
5. Writes structured details to `data/confirmation.json`

Sign flow (`fillSignAndSubmit`) also handles the CEAC quirk where SignCertify
remains visible with **Next: Confirmation** after e-sign — it clicks through
before capturing the confirmation artifacts.

## Outputs

| File | Purpose |
|------|---------|
| `data/confirmation.json` | Application ID, URL, barcode flag, paths |
| `data/ds160-confirmation.pdf` | Printable confirmation |
| `data/ds160-confirmation.png` | Full-page screenshot |
| `data/session.json` | Updated with Application ID |

## Run

```bash
DS160_RESUME=true DS160_ALLOW_SUBMIT=true npm start
```

If you land on SignCertify with only **Next: Confirmation** (no Sign button),
the same command advances to confirmation and saves the files above.

Use real applicant data in `fixtures/` before submitting. See
[APPLICANT_DATA.md](APPLICANT_DATA.md).
