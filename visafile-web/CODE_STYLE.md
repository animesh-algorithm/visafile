# Code Style and Engineering Guidelines

This document defines the coding and engineering conventions for VisaFile.

The objective is to keep the codebase modular, readable, testable, and easy for both humans and coding agents to modify safely.

When generating or modifying code, prioritize maintainability over minimizing the number of files.

## Core Principles

### 1. Keep responsibilities narrow

Each file, module, component, class, or function should have one clear responsibility.

Avoid files that combine:

- UI rendering
- API requests
- database operations
- validation
- automation logic
- business rules
- formatting utilities
- state management

Split these concerns into appropriate modules.

A large file should be treated as a signal that multiple responsibilities may have been combined.

### 2. Prefer small composable modules

Do not create monolithic files merely to avoid adding files.

As a general guideline:

- React components should usually remain below ~200–300 lines.
- Service and business-logic modules should usually remain below ~300–400 lines.
- Functions should generally remain below ~40–60 lines.
- Files approaching ~500 lines should be reviewed for possible decomposition.
- Files approaching or exceeding ~800–1000 lines should require a strong structural reason.

These are guidelines, not hard limits.

Do not split cohesive code artificially simply to satisfy a line-count target.

## React and Next.js

### Component responsibilities

Pages and route-level components should primarily compose smaller components.

Avoid:

```text
app/applications/[id]/page.tsx
    1200 lines
    API calls
    form definitions
    validation
    dialogs
    status UI
    business logic
```

Prefer:

```text
app/applications/[id]/
├── page.tsx
├── loading.tsx
└── _components/
    ├── application-header.tsx
    ├── automation-progress.tsx
    ├── captcha-step.tsx
    ├── application-summary.tsx
    └── application-actions.tsx
```

Keep reusable components in shared component directories when they are genuinely reusable.

Do not create generic abstractions prematurely.

### Server vs Client Components

Prefer Server Components by default.

Add `"use client"` only when a component actually requires:

- browser APIs
- event handlers
- client-side state
- effects
- client-only libraries

Keep client boundaries as small as practical.

Do not turn entire pages into Client Components because one nested component needs interactivity.

### Data access

Do not perform raw database operations throughout React components.

Prefer:

```text
UI
 ↓
server action / route / service
 ↓
domain/service layer
 ↓
database
```

Database queries should live in dedicated data-access or service modules.

## Feature Organization

Prefer organizing code around features or domains rather than accumulating unrelated code in global folders.

Example:

```text
features/
└── applications/
    ├── components/
    ├── server/
    │   ├── application-service.ts
    │   └── application-repository.ts
    ├── schemas/
    ├── types/
    └── utils/
```

For shared infrastructure:

```text
lib/
├── supabase/
├── queue/
├── logging/
└── errors/
```

Avoid dumping unrelated utilities into large files such as:

```text
utils.ts
helpers.ts
common.ts
misc.ts
```

Prefer descriptive modules:

```text
format-passport-number.ts
application-status.ts
normalize-address.ts
```

## DS-160 Automation

The Puppeteer automation must be decomposed by workflow step.

Do not create a single large automation file containing the entire DS-160 workflow.

Prefer:

```text
automation/
├── ds160-runner.ts
├── context.ts
├── selectors/
├── steps/
│   ├── personal.ts
│   ├── travel.ts
│   ├── companions.ts
│   ├── previous-travel.ts
│   ├── address.ts
│   ├── passport.ts
│   ├── us-contact.ts
│   ├── family.ts
│   ├── work-education.ts
│   ├── security.ts
│   ├── captcha.ts
│   ├── review.ts
│   └── submit.ts
└── utils/
```

Each automation step should expose a small, predictable interface.

For example:

```ts
export async function fillTravelStep(
  context: AutomationContext,
  data: TravelInformation,
): Promise<void> {
  // ...
}
```

Automation steps should not independently fetch unrelated application data from the database.

Prepare the required inputs before invoking them.

### Selectors

Centralize important selectors rather than scattering unexplained strings throughout automation code.

Prefer:

```ts
const SELECTORS = {
  surname: "#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME",
  givenName: "#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME",
};
```

Avoid repeating selectors across multiple files.

### Page helpers

Repeated Puppeteer behavior should become meaningful helpers.

For example:

```ts
await fillTextField(page, SELECTORS.surname, data.surname);
await selectOption(page, SELECTORS.country, data.country);
await clickAndWaitForNavigation(page, SELECTORS.nextButton);
```

Do not abstract every Puppeteer call merely for abstraction's sake.

Create helpers for repeated behavior, error handling, logging, or domain-specific operations.

## Functions

Functions should:

- perform one conceptual task
- have descriptive names
- minimize side effects
- avoid excessive nesting
- return predictable values

Prefer early returns over deeply nested conditionals.

Avoid:

```ts
if (...) {
  if (...) {
    if (...) {
      // ...
    }
  }
}
```

Prefer:

```ts
if (!application) {
  throw new ApplicationNotFoundError(id);
}

if (!application.isReady) {
  return;
}
```

If a function requires many unrelated parameters, consider passing a typed context object.

## Types

Use TypeScript strictly.

Avoid:

```ts
any;
```

unless interfacing with an unavoidable untyped external API.

Prefer:

```ts
unknown;
```

and validate/narrow it.

Do not duplicate domain types across the web and worker applications.

Shared types should live in shared packages.

Prefer deriving types from schemas when appropriate:

```ts
export const passportSchema = z.object({
  number: z.string(),
  issuingCountry: z.string(),
});

export type Passport = z.infer<typeof passportSchema>;
```

## Validation

Validate data at system boundaries.

Examples include:

- form submissions
- API requests
- queue job payloads
- environment variables
- third-party API responses when appropriate

Use Zod for runtime validation.

Do not assume TypeScript compile-time types guarantee the validity of external data.

## Queue Jobs

Queue payloads should remain small.

Prefer:

```ts
{
  applicationId: string;
}
```

instead of putting the entire DS-160 application into Redis.

Define queue payloads explicitly:

```ts
export const ds160JobSchema = z.object({
  applicationId: z.string().uuid(),
});

export type DS160Job = z.infer<typeof ds160JobSchema>;
```

Workers must validate job payloads before processing them.

## Database Code

Keep database access separate from business logic where practical.

Prefer:

```text
ApplicationService
      ↓
ApplicationRepository
      ↓
Supabase/Postgres
```

Repository modules should handle persistence.

Service modules should handle business rules.

Avoid embedding complex business logic directly inside SQL query construction.

## Error Handling

Do not swallow errors.

Avoid:

```ts
try {
  await operation();
} catch {
  // ignore
}
```

Errors should either:

- be handled meaningfully
- be translated into a domain-specific error
- be logged and rethrown
- cause the operation to fail

Prefer typed domain errors where useful:

```ts
ApplicationNotFoundError;
AutomationStepError;
CaptchaTimeoutError;
SubmissionVerificationError;
```

Automation errors should include contextual information such as:

- application ID
- automation step
- retryability
- relevant safe metadata

Never include sensitive DS-160 fields in error messages.

## Logging

Use structured logging.

Prefer:

```ts
logger.info("automation_step_completed", {
  applicationId,
  step: "travel",
  durationMs,
});
```

Avoid:

```ts
console.log("worked");
console.log(data);
```

Never log:

- passport numbers
- dates of birth unnecessarily
- addresses
- security-question responses
- complete DS-160 payloads
- authentication tokens
- session cookies

Use application IDs and internal identifiers for correlation.

## Comments

Code should generally explain itself through naming and structure.

Use comments to explain:

- why unusual behavior exists
- external website quirks
- non-obvious DS-160 constraints
- important reliability decisions
- workarounds

Avoid comments that merely describe the next line.

Bad:

```ts
// Click next button
await page.click(nextButton);
```

Useful:

```ts
// CEAC occasionally enables the button before its postback handler is
// attached. Waiting for network idle here prevents intermittent skipped pages.
await page.waitForNetworkIdle();
await page.click(nextButton);
```

## Naming

Use names that describe intent.

Prefer:

```ts
application;
applicationId;
automationStatus;
waitForCaptchaCompletion;
submitDS160Application;
```

Avoid:

```ts
data;
obj;
temp;
thing;
handleStuff;
processData;
```

unless the scope makes the meaning immediately obvious.

Booleans should generally read naturally:

```ts
isSubmitted;
hasPassport;
requiresCaptcha;
canRetry;
```

## Constants

Avoid unexplained magic values.

Bad:

```ts
await page.waitForTimeout(7500);
```

Better:

```ts
const CEAC_POSTBACK_TIMEOUT_MS = 7_500;
```

If a value is specific to one small function and immediately obvious, introducing a constant is unnecessary.

## Duplication

Prefer small amounts of obvious duplication over premature abstractions.

Extract shared logic when:

- it appears repeatedly
- it represents a meaningful domain concept
- centralizing it reduces the chance of inconsistent behavior

Do not create generic abstractions simply because two functions currently look similar.

## Dependencies

Before adding a dependency:

1. Check whether an existing dependency already solves the problem.
2. Determine whether the functionality is simple enough to implement safely.
3. Consider maintenance, security, bundle size, and operational cost.

Do not add libraries for trivial helpers.

## Testing

Prioritize tests around business-critical and failure-prone behavior.

Especially test:

- input validation
- form-data transformations
- application state transitions
- queue job validation
- retry decisions
- automation helper functions
- mappings between VisaFile fields and DS-160 fields
- idempotency safeguards
- final submission state handling

Avoid tests that merely duplicate implementation details.

Automation integration tests should separate external-site behavior from pure business logic whenever possible.

## Refactoring During Feature Work

When modifying an existing large file:

Do not automatically rewrite the entire file.

If the requested change touches a clearly separable responsibility, extract that responsibility into a focused module as part of the change when doing so is low risk.

If substantial refactoring would significantly increase scope, mention it rather than silently rewriting unrelated areas.

## AI Coding Agent Rules

When generating code:

1. Inspect existing nearby patterns before introducing new ones.
2. Do not place an entire feature into one file.
3. Do not generate files approaching 500+ lines without checking whether responsibilities can be separated.
4. If a proposed implementation would create a very large file, split it by responsibility before implementation.
5. Reuse existing schemas, types, utilities, and components.
6. Do not introduce generic abstraction layers without a concrete need.
7. Preserve clear server/client boundaries.
8. Keep business logic outside presentation components.
9. Keep database logic outside UI components.
10. Keep Puppeteer automation decomposed into workflow steps.
11. Prefer explicit readable code over clever compressed code.
12. Before completing substantial work, review newly created files for excessive size, duplicated logic, and mixed responsibilities.

## Definition of Done

Before considering a feature complete, verify:

- TypeScript passes.
- Relevant linting passes.
- Relevant tests pass.
- No sensitive user data is logged.
- New code follows existing project conventions.
- Large files have been reviewed for decomposition.
- Business logic is not unnecessarily embedded in UI components.
- Shared types and schemas are reused.
- Error states are handled.
- Automation state changes are persisted when relevant.
- Architectural constraints in `ARCHITECTURE.md` are respected.
