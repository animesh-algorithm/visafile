# VisaFile web

A frontend-only prototype for VisaFile: a consumer-friendly landing page and a guided DS-160 intake. It is deliberately isolated from the automation MVP in `../mvp`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint`, `npm run typecheck`, and `npm run build` before handoff.

The intake uses a versioned browser-local draft. It does not call an API or submit anything to CEAC. Field groupings and terminology were derived from `../mvp/frontend/src/schema/ds160-application.schema.json`, `../mvp/frontend/src/schema/fieldMeta.ts`, and the captured field metadata under `../data`.

## Structure

- `src/app` — App Router pages and global design tokens
- `src/components/ui` — shadcn-style interface primitives
- `src/components/marketing` — landing-page composition
- `src/components/intake` — guided intake state and presentation
- `src/lib/intake-definition.ts` — typed questionnaire structure and conditional rules

The intake intentionally stops at a clearly labeled prototype completion screen. It never claims to file a DS-160.
