# VisaFile Architecture

## Overview

VisaFile automates the DS-160 application workflow. Users complete a guided form in the web application. The submitted data is persisted and an asynchronous browser-automation job uses Puppeteer to populate the official DS-160 website.

A typical automation takes approximately 3–4 minutes and may require human interaction for CAPTCHA verification. Browser automation must therefore run asynchronously and must not be tied to an HTTP request lifecycle.

## Technology Stack

### Web Application

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Next.js handles the user-facing application and API endpoints.

### Database and Storage

Use Supabase for:

- PostgreSQL database
- Authentication
- File storage

The database is the source of truth for DS-160 application state.

Supabase Storage should store generated artifacts such as confirmation PDFs and screenshots. Buckets containing user documents must remain private and files should be exposed through authenticated access or temporary signed URLs.

DS-160 data contains highly sensitive personal information. Sensitive data must not be unnecessarily written to logs, analytics, error-reporting systems, or queue payloads.

### Job Queue

Use:

- BullMQ
- Redis

Browser automation must not execute directly inside Next.js API requests.

When a user submits an application:

1. Validate and persist the application.
2. Add an automation job containing the application ID to BullMQ.
3. Return immediately to the client.
4. Allow an independent worker to process the job.

Queue payloads should contain identifiers such as `applicationId` rather than complete DS-160 form data. The worker retrieves the necessary data from the database.

The queue provides:

- asynchronous processing
- concurrency control
- retry handling
- job scheduling
- separation between the API and automation infrastructure

### Automation Worker

Run a dedicated Node.js worker on Railway.

The worker:

1. Consumes jobs from BullMQ.
2. Retrieves application data from Supabase.
3. Launches Puppeteer/Chromium.
4. Completes the DS-160 workflow.
5. Persists progress after meaningful steps.
6. Pauses when human CAPTCHA interaction is required.
7. Resumes after CAPTCHA completion.
8. Submits the application.
9. Stores resulting documents in Supabase Storage.
10. Marks the application as completed.

Because the worker is a persistent service rather than an HTTP request, automation can run for several minutes without relying on a long-lived API request.

## Application State

Persist automation state in PostgreSQL rather than relying exclusively on BullMQ.

Example states:

```text
DRAFT
QUEUED
STARTING
FILLING_FORM
WAITING_FOR_CAPTCHA
RESUMING
SUBMITTING
COMPLETED
FAILED_RETRYABLE
FAILED_MANUAL_REVIEW
```

Store useful metadata such as:

```text
application_id
user_id
status
current_step
automation_job_id
browser_session_id
confirmation_file_path
error_code
created_at
updated_at
```

The database is the source of truth for application status. BullMQ coordinates execution but should not become the application database.

## Automation Design

Do not implement the entire DS-160 automation as one monolithic function.

Break the workflow into explicit steps, for example:

```text
personal
travel
travel_companions
previous_travel
address
passport
us_contact
family
work_education
security
captcha
review
submit
confirmation
```

Persist checkpoints between important stages.

Automation should be designed defensively because browser processes, network requests, selectors, and external pages can fail.

Retries must be safe. In particular, the final submission step must not blindly repeat if the worker crashes after submission. Verify the current DS-160 state before attempting irreversible operations again.

## CAPTCHA / Human-in-the-Loop

CAPTCHA must remain a human interaction.

When automation reaches CAPTCHA:

1. Persist `WAITING_FOR_CAPTCHA`.
2. Notify the frontend.
3. Provide the user access to the active browser session.
4. Allow the user to complete CAPTCHA.
5. Resume automation using the same browser session.

Do not implement automated CAPTCHA solving or CAPTCHA bypass mechanisms.

The exact remote-browser interaction mechanism should remain modular so the implementation can evolve independently from the rest of the automation architecture.

## Progress Updates

For the initial MVP, polling is acceptable.

The frontend can periodically request:

```text
GET /api/applications/{id}/status
```

For example:

```json
{
  "status": "FILLING_FORM",
  "currentStep": "travel",
  "progress": 38
}
```

Polling every few seconds keeps the initial architecture simple.

Server-Sent Events (SSE) can later replace polling when smoother real-time progress updates are desirable.

WebSockets are unnecessary unless substantial bidirectional real-time communication becomes necessary.

## Deployment

Recommended initial deployment:

```text
Next.js
    |
    +---- Supabase PostgreSQL
    |
    +---- Supabase Auth
    |
    +---- Supabase Storage
    |
    +---- Redis / BullMQ
               |
               v
        Railway Worker
               |
        Node.js + Puppeteer
               |
           Chromium
               |
               v
             DS-160
```

The web application and automation worker must remain separate deployable processes.

## Repository Structure

Prefer a monorepo:

```text
visafile/
├── apps/
│   ├── web/
│   │   └── Next.js application
│   │
│   └── worker/
│       ├── automation/
│       │   ├── steps/
│       │   └── ds160.ts
│       ├── queue/
│       └── worker.ts
│
├── packages/
│   ├── database/
│   ├── schemas/
│   ├── types/
│   └── config/
│
├── ARCHITECTURE.md
├── AGENTS.md
└── package.json
```

Shared packages should contain common Zod schemas, TypeScript types, database definitions, DS-160 field definitions, and configuration.

## Architectural Principles

1. Never run the complete Puppeteer workflow inside an HTTP request.
2. PostgreSQL is the source of truth for application state.
3. BullMQ coordinates asynchronous work.
4. Browser automation runs in dedicated workers.
5. Automation must persist progress and tolerate failures.
6. Irreversible actions such as final submission require idempotency safeguards.
7. CAPTCHA remains human-in-the-loop.
8. Sensitive DS-160 information must not leak into logs, analytics, queue payloads, or public storage.
9. Start with polling and introduce SSE only when needed.
10. Prefer simple infrastructure for the MVP and introduce additional distributed-system complexity only when scale requires it.
