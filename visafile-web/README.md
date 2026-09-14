# VisaFile web

A frontend-only prototype for VisaFile: a consumer-friendly landing page and a guided DS-160 intake. It is deliberately isolated from the automation MVP in `../mvp`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint`, `npm run typecheck`, and `npm run build` before handoff.

The intake uses a versioned browser-local draft. Once signed in, it sends reviewed answers through an authenticated Next.js route, saves them to Supabase, and queues the separate MVP automation worker. The applicant chooses prepare-only mode or explicitly authorizes the final CEAC submission step. CAPTCHA and CEAC corrections always remain human-controlled. Field groupings and terminology were derived from `../mvp/frontend/src/schema/ds160-application.schema.json`, `../mvp/frontend/src/schema/fieldMeta.ts`, and the captured field metadata under `../data`.

## Supabase setup

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
AUTOMATION_API_URL=http://127.0.0.1:3001
AUTOMATION_API_TOKEN=use-the-same-secret-as-the-mvp-service
```

Run `supabase/schema.sql` in the Supabase SQL editor. It creates the `ds160_intake_submissions` table and row-level security policies so signed-in users can insert and read only their own submissions.

The intake sidebar supports email/password sign-in and sign-up. The review step writes a submission row, maps the flat intake answers to the canonical MVP DS-160 schema, and queues a job using only server-side automation credentials. Apply `supabase/schema.sql` again when upgrading an existing project so the automation status columns and RLS update policy are present.

## Run the end-to-end local flow

1. Configure Supabase in `visafile-web/.env.local` and apply `supabase/schema.sql`.
2. Put the same non-empty `AUTOMATION_API_TOKEN` in `visafile-web/.env.local` and `../mvp/.env`.
3. Run `npm run dev:api` from `../mvp`. With the default `LOCAL_STACK=true`, this starts SQLite plus the in-process worker without Redis or PostgreSQL.
4. Run `npm run dev` from this directory, sign in, review the intake, and choose either prepare-only or authorized final submission.
5. Keep the application progress page open when CAPTCHA or a CEAC correction needs a human response. Progress is also safe to refresh because pending interactions are persisted with the job.

The production shape remains separate services: deploy the persistent Puppeteer worker independently, set `LOCAL_STACK=false`, and configure PostgreSQL/Redis and private PDF storage as documented in `ARCHITECTURE.md`.

## Structure

- `src/app` — App Router pages and global design tokens
- `src/components/ui` — shadcn-style interface primitives
- `src/components/marketing` — landing-page composition
- `src/components/intake` — guided intake state and presentation
- `src/lib/intake-definition.ts` — typed questionnaire structure and conditional rules
- `src/lib/supabase.ts` — Supabase client configuration and submission table typing
- `src/lib/automation/intake-to-ds160.ts` — intake-to-worker contract mapping
- `src/app/api/applications` — authenticated queue, status, interaction, and PDF routes
- `src/components/applications` — polling progress and human-in-the-loop UI

The intake intentionally stops at a clearly labeled review-complete screen. It never claims to file a DS-160.
