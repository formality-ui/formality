---
"@formality-ui/react": minor
---

Wire manual submit through the Formality submission pipeline.

The render-API now exposes a `handleSubmit` that runs form-level `validate`
and `transformValuesForSubmit` (valueField extraction + getSubmitField rename)
before delivering values to the consumer's submit handler. Previously these
only ran on the auto-save path; consumers using `methods.handleSubmit` (the
documented primary submit pattern) silently bypassed validation and value
transforms. Also fixes the README flagship visibility example, the inverted
condition patterns in `examples/03-conditions.tsx`, a dead `DEVELOPMENT.md`
link, prettier formatting drift in two test files, makes the `examples/`
directory type-clean under strict TypeScript, and gates
`pnpm typecheck:examples` in CI to prevent regressions.
