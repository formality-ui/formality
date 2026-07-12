# @formality-js/react

## 0.2.3

### Patch Changes

- 0dca79a: `submitImmediate()` now flushes pending per-field numeric debounce saves. Previously only the Form-level timer was flushed, so edits to fields using a numeric `InputConfig.debounce` were silently dropped on "Save Now" / flush-before-navigate. (Issue 1)
- 0dca79a: `DebouncedFunction.pending()` now reports accurate scheduled state for both the Form-level and per-field debouncers (previously hardcoded to `false`). (Issue 3)
- 1863b44: Removed committed diagnostic probe files and skipped the out-of-scope `isDisabled` tests; the React-adapter `isDisabled` limitation is now tracked in `KNOWN_ISSUES.md`. (Issue 2)
- 716b44c: Eliminated `forwardRef render-function` warnings in the test suite by dropping unnecessary `React.forwardRef()` wraps around test input components. (Issue 4)

## 0.1.0

### Minor Changes

- 463a2e0: Initial Release

### Patch Changes

- Updated dependencies [463a2e0]
  - @formality-js/core@0.1.0
