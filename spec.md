# DS-160 Automation — MVP Spec

## Goal

Get a working end-to-end loop: user fills out a form on a basic frontend →
backend queues and runs the existing Puppeteer script → user resolves any
CAPTCHA and field-correction prompts live → user gets a confirmation PDF.

**Explicitly out of scope for this phase:** authentication, payments, GCP
deployment, multi-tenancy hardening. Single user, local machine, one job at
a time is an acceptable MVP target. Add auth/payments/cloud only after this
loop is solid.

---

## 1. Job schema

Before writing new code, define the DS-160 field schema as a single source
of truth — matches your existing `data/*.fields.json` / `fixtures/*.test.json`
files, grouped by CEAC page section:

- Personal Information 1
- Personal Information 2
- Travel Information
- Travel Companions
- Previous US Travel
- Address & Phone
- Passport
- US Contact
- Family
- Work/Education
- Security & Background
- Sign & Submit

Represent this as a TypeScript type or JSON Schema shared by frontend
(form generation/validation) and backend (job payload validation). This
is the contract everything else depends on — get it right before building
the form UI.

---

## 2. Backend — components

### 2a. Job runner (wrap the existing script)

Refactor `main()` into:

```
async function runDs160Job(jobData, hooks)
```

Where `hooks` is:

```
{
  onCaptchaNeeded: (imageBuffer) => Promise<string>,   // resolves with typed answer
  onValidationError: (errors[]) => Promise<corrections> // resolves with field fixes
}
```

- `promptForCaptcha` currently does file-write + file-poll → replace its
  internals with a call to `hooks.onCaptchaNeeded`.
- `clickNext`'s current "throw on validation error" branch → replace with
  a call to `hooks.onValidationError`, apply corrections via existing
  `fillControlByIdOrName` / `selectByPartialId` helpers, then retry.
- Everything else in the script (the `fillXxx` pipeline, `clickNext`,
  `continueFromCurrentPage`) stays as-is.

**Test this in isolation first** with terminal-based hooks (`readline`)
before wiring queues or WebSockets. Confirms the refactor didn't break
anything.

### 2b. Queue — Redis + BullMQ

- One queue, one job type (`ds160-submission`).
- Job payload = the schema from section 1, plus a generated `jobId`.
- Concurrency: start at 1–2 concurrent jobs per worker process (Puppeteer
  is heavy).
- Local dev: Redis via Docker (`docker run -p 6379:6379 redis`).

### 2c. Worker process

- Pulls jobs off BullMQ.
- Launches one Puppeteer browser per job (simplest isolation for MVP —
  don't share browser contexts yet).
- Calls `runDs160Job(jobData, hooks)`.
- Hooks now publish/subscribe via Redis pub/sub instead of terminal:
  - `onCaptchaNeeded`: publish to `job:{jobId}:captcha-needed` with
    base64 image, await message on `job:{jobId}:captcha-answer`.
  - `onValidationError`: publish to `job:{jobId}:correction-needed` with
    structured error list, await message on `job:{jobId}:correction-answer`.
- On completion: upload PDF to local disk (or S3/Cloud Storage stub) and
  publish `job:{jobId}:completed` with a download path.
- On failure: publish `job:{jobId}:failed` with the error.

### 2d. API — Express or Fastify

Endpoints:

- `POST /jobs` — accepts the job schema payload, validates it, enqueues
  it, returns `{ jobId }`.
- `GET /jobs/:jobId` — returns current status
  (`queued | filling | awaiting_captcha | awaiting_correction | submitting
| completed | failed`).
- `GET /jobs/:jobId/pdf` — returns the confirmation PDF once completed.
- WebSocket endpoint (e.g. `/ws?jobId=...`) — on connect, subscribes to
  that job's Redis channels and relays messages both directions:
  - Worker → browser: captcha image, validation errors, status updates.
  - Browser → worker: captcha answer, field corrections.

No auth middleware yet — MVP assumes trusted single-user access.

### 2e. Database — Postgres (or even SQLite for pure MVP)

Minimal `jobs` table:

| column     | type        | notes                    |
| ---------- | ----------- | ------------------------ |
| id         | uuid        | primary key              |
| status     | text        | state machine value      |
| payload    | jsonb       | the submitted form data  |
| pdf_path   | text        | nullable until completed |
| created_at | timestamptz |                          |
| updated_at | timestamptz |                          |

No column-level encryption required yet for local MVP — add before any
real user data touches it.

---

## 3. Frontend — components (no auth, no payments)

### 3a. Intake form

- Multi-step form, one step per CEAC section from the schema in section 1.
- Client-side validation matching field types (dates, dropdowns, etc.).
- On final submit: `POST /jobs`, then redirect to the job status page
  with the returned `jobId`.

### 3b. Job status / live interaction page

- On load, opens WebSocket to `/ws?jobId=...`.
- Renders based on incoming messages:
  - `captcha-needed` → show image + text input + submit button → sends
    `captcha-answer` back over the socket.
  - `correction-needed` → show the list of validation errors with
    editable fields for the ones implicated → sends `correction-answer`
    back over the socket.
  - `status update` → show current step (simple progress indicator).
  - `completed` → show a download link (`GET /jobs/:jobId/pdf`).
  - `failed` → show the error message.

This page is the hardest UI piece — build it after the plumbing
(section 2c/2d) is proven with a throwaway HTML test page first.

---

## 4. Build order (condensed)

1. Define job schema (section 1).
2. Refactor script into `runDs160Job` + hooks; test with terminal hooks.
3. Stand up Redis + BullMQ + worker; still terminal hooks.
4. Build API skeleton (`POST /jobs`, `GET /jobs/:id`, no WebSocket yet).
5. Swap hooks to Redis pub/sub; add WebSocket relay in API.
6. Test the CAPTCHA/correction flow with a bare-bones HTML page + `wscat`.
7. Build the real frontend intake form (section 3a).
8. Build the real frontend job-status page (section 3b).
9. Add Postgres persistence for job state + PDF path.
10. End-to-end test: submit a real form through the UI, resolve a live
    CAPTCHA, confirm PDF download works.

**Stop here for MVP.** Auth, payments, GCP deployment, multi-tenancy, and
encryption are all next-phase work — deliberately excluded so this loop
can be proven quickly.

---

## 5. Explicitly deferred (do not build yet)

- User accounts / auth
- Stripe / payments
- Cloud deployment (Cloud Run, GKE, Memorystore, Cloud SQL)
- Per-job data namespacing for true multi-tenant concurrency
- Column-level encryption of sensitive fields
- Rate-limit / proxy rotation for CEAC
- Monitoring/alerting (Sentry, Cloud Logging)

Each of these was covered in the fuller production rollout plan — pick
this spec back up and layer them in once the core loop above is working.
