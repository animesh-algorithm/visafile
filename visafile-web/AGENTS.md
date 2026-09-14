# AGENTS.md

## Project

VisaFile is a Next.js application that automates DS-160 form completion using a separate Puppeteer worker.

Before making architectural or infrastructure changes, read:

- `ARCHITECTURE.md`

Treat the architecture documented there as authoritative unless explicitly instructed otherwise.

## Core Rules

- Use TypeScript.
- Use Next.js for the web application.
- Use Tailwind CSS and shadcn/ui for UI.
- Use Supabase for PostgreSQL, authentication, and file storage.
- Use BullMQ + Redis for asynchronous automation jobs.
- Run Puppeteer only inside the dedicated worker.
- Never execute the full DS-160 automation inside a Next.js request.
- Keep application state in PostgreSQL rather than BullMQ.
- Keep queue payloads minimal; prefer IDs over sensitive form data.
- Design automation as resumable, checkpointed steps.
- Treat final submission and other irreversible actions as idempotency-sensitive.
- CAPTCHA must remain human-in-the-loop.
- Never implement CAPTCHA bypass or automated CAPTCHA solving.
- Never expose sensitive DS-160 information through logs, analytics, errors, or public storage.

## Repository

```text
apps/web       Next.js frontend/API
apps/worker    Puppeteer automation worker

packages/database
packages/schemas
packages/types
packages/config
```

Prefer shared packages over duplicating schemas or types between the web application and worker.

## Development

Before implementing a feature:

1. Identify whether it belongs to `web`, `worker`, or a shared package.
2. Check `ARCHITECTURE.md` for relevant architectural constraints.
3. Reuse existing types and schemas where possible.
4. Avoid introducing new infrastructure or dependencies when the existing architecture can reasonably solve the problem.

If an implementation requires deviating from `ARCHITECTURE.md`, explain the proposed deviation and its trade-offs before making the architectural change.

## Required Reading

Before making substantial changes, read:

- `ARCHITECTURE.md` — system architecture and infrastructure decisions
- `CODE_STYLE.md` — coding conventions, module boundaries, testing, and maintainability rules

Treat these documents as authoritative unless explicitly instructed otherwise.

For substantial feature work, review the implementation against both documents before considering the task complete.
