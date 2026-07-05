# @formality-js/react

## 0.1.0

### Minor Changes

- d521fae: Wire manual submit through the Formality submission pipeline.

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

### Patch Changes

- 88d9cdd: Fix auto-save validation to only target changed fields instead of validating all fields
- Updated dependencies [88d9cdd]
  - @formality-ui/core@0.1.0

## 0.1.0

### Minor Changes

- 463a2e0: Initial Release

### Patch Changes

- Updated dependencies [463a2e0]
  - @formality-js/core@0.1.0
