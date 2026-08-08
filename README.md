# DS-160 Puppeteer boilerplate

This project opens the official CEAC DS-160 page and selects a configured
application location. CAPTCHA completion, review, signing, and submission are
intentionally left to the applicant.

## Setup

```bash
cp .env.example .env
npm start
```

Set `DS160_LOCATION` in `.env` to the CEAC location code you need. Common India
codes are:

- `MDR` — Chennai
- `HYD` — Hyderabad
- `CLC` — Kolkata
- `BMB` — Mumbai
- `NWD` — New Delhi

The site times out after 20 minutes of inactivity, so save frequently and keep
the generated Application ID in a safe place. Do not commit personal
application data or credentials to source control.

See [DS160_INPUTS.md](DS160_INPUTS.md) for a preparation checklist of the
information the form may request. Automated form pages are documented in:

- [PERSONAL_INFORMATION_1.md](PERSONAL_INFORMATION_1.md)
- [PERSONAL_INFORMATION_2.md](PERSONAL_INFORMATION_2.md)

Official form: <https://ceac.state.gov/GenNIV/Default.aspx>
