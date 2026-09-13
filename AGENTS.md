# VisaFile repository guide

## Product and stage

VisaFile turns the long, repetitive DS-160 visa application into a guided intake that can later be used by an automation worker. The repository is currently a prototype: the automation MVP exists, while the polished consumer frontend is a standalone, frontend-only experience.

## Repository structure

- `/mvp`: the existing end-to-end MVP (Vite intake, Fastify API, queue, Puppeteer worker). Treat it as reference material and do not restructure it.
- `/schema`, `/data`, `/fixtures`: DS-160 contract, captured CEAC field metadata, and representative payloads used by the automation.
- `/src`, `/scripts`: the original automation prototype.
- `/visafile-web`: the standalone Next.js frontend prototype. Product UI work belongs here.

The MVP schema and the files under `/data` are the source of truth for official field names, wire values, validation, conditionals, and domain terminology. The new frontend may regroup or explain these fields, but should not silently change their meaning.

## Frontend scope

This phase is frontend only. Use browser-local state and mocks. Do not add authentication, accounts, multi-tenancy, persistence services, backend APIs, CEAC integration, CAPTCHA handling, workers, actual submission, PDF generation, or production infrastructure.

## Frontend stack and commands

The app in `/visafile-web` uses Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style primitives, and Lucide icons.

Run commands from `/visafile-web`:

- `npm run dev` — local development
- `npm run lint` — ESLint
- `npm run format` — Prettier write
- `npm run format:check` — Prettier check
- `npm run typecheck` — TypeScript without emitting
- `npm run build` — production build

## Architecture and conventions

- Routes and server-rendered page composition live under `src/app`.
- Reusable shadcn-style primitives live under `src/components/ui`.
- Product-specific components live under `src/components/marketing` or `src/components/intake`.
- Form definitions, types, and local persistence live under `src/lib`.
- Components and TypeScript types use PascalCase; functions, variables, and files use camelCase or kebab-case consistently with their folder.
- Keep server components by default. Add `"use client"` only at the interactive boundary.
- Prefer small components and direct local state over speculative service layers or global state.
- Use CSS variables in `globals.css` for color, type, radius, shadow, focus, and status tokens. Avoid repeated arbitrary color literals in components.
- Primitives should accept `className`, forward relevant native props, and keep visible focus states.

## Design principles

The product should feel calm, trustworthy, and human—not governmental or like an admin dashboard. Use expressive editorial headings, generous whitespace, rounded controls, a cobalt primary action, warm neutral backgrounds, and small playful document motifs. Keep the intake quieter and more task-focused than the landing page. Avoid excessive gradients, glass effects, nested cards, decorative shadows, bureaucratic copy, or copied Oscar assets/layouts.

## Accessibility and responsive design

- Meet WCAG AA contrast targets and retain visible `:focus-visible` states.
- Every input needs a programmatic label; errors and supporting text need stable IDs and `aria-describedby` links.
- Use semantic landmarks, headings, buttons, lists, and fieldsets/legends.
- All interactions must work by keyboard. Do not encode state using color alone.
- Respect reduced-motion preferences.
- Design mobile-first; navigation, progress, form controls, and action bars must work at 320px without horizontal scrolling.
- Test the landing page and intake at mobile and desktop widths before handoff.

## Important decisions and things to avoid

- The new frontend is intentionally isolated in `/visafile-web`; do not import runtime code from `/mvp` or modify MVP files for frontend convenience.
- The intake stores a versioned draft in `localStorage` only and makes that behavior explicit in the UI.
- “Complete” means completing the prototype intake; it must never imply that a DS-160 was filed with the U.S. government.
- Security/background answers are sensitive and should be presented individually with neutral explanations. Do not default official answers on a user's behalf.
- Do not collect secrets, add analytics, transmit applicant data, or create environment variables unless the product scope changes explicitly.
- Do not claim government affiliation, guaranteed approval, or legal advice.
