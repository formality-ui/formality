# External Dependencies & API Contracts

## lodash-es debounce

**Used in:** `Form.tsx` via `import { debounce } from "lodash-es"`

### Relevant API surface

```ts
// lodash debounce returns a DebouncedFunc<T> with:
//   .cancel(): void   — cancel pending delayed invocation
//   .flush(): T       — immediately invoke if pending, return result
//   .pending(): boolean — TRUE if a debounced invocation is pending
//
// IMPORTANT: lodash's debounce DOES expose .pending() — BUT the project wraps
// the lodash fn in an Object.assign that replaces it, so the wrapper's
// .pending() must delegate or track state explicitly. The project's earlier
// comments assumed lodash tracked it internally through the wrapper — it does
// not, because Object.assign creates a new function object.
```

**Key insight for Issue 3:** The original code used `Object.assign(debounced, { ... })`
where `debounced` was already a lodash debounced function. The wrapper's
`pending: () => false` shadowed lodash's real `.pending()`. The fix
(`wrapDebounced`) tracks `isPending` explicitly because the wrapper's call
function (`Object.assign(() => { ... }, adapters)`) is a NEW function that
doesn't share lodash's internal pending state.

## react-hook-form (RHF)

**Used in:** `Form.tsx` via `useForm`, `FormProvider`, `useFormContext`

### Relevant APIs

```ts
// methods.getFieldState(name) — reads field state without creating subscriptions
// methods.getValues() — reads current values
// methods.handleSubmit(fn) — wraps submit handler with validation
```

**Key insight for Issue 2:** The `fieldStates` built in `useFieldDisabledState.ts`
use `methods.getFieldState()` which does NOT include disabled state. RHF doesn't
track "disabled" as part of field state — it's a DOM attribute. Formality tracks
disabled through its own priority system (prop > config > conditions > group).

## Testing Library

- `@testing-library/react` — `render`, `screen`, `act`, `cleanup`
- `@testing-library/user-event` — `userEvent.type(element, text, { delay: null })`
- `@testing-library/jest-dom` — DOM matchers (`toBeDisabled`, etc.)

## vitest

- `vi.useFakeTimers({ shouldAdvanceTime: true })` — fake timers that still advance
  real async work (critical for React state updates during timer advancement)
- `vi.advanceTimersByTimeAsync(ms)` — advance fake timers and flush microtasks
- `vi.fn()` — mock function for submit handlers

## Project Test Conventions

1. **Every test file is self-contained:** Each defines its own input components,
   configs, and render setup. No shared test fixtures across files.
2. **Fake timers with shouldAdvanceTime:** All auto-save tests use
   `vi.useFakeTimers({ shouldAdvanceTime: true })` to control debounce timing
   while letting React state updates flush.
3. **ContextCapture pattern:** A null-rendering component that stashes
   `useFormContext()` onto a ref for direct API testing.
4. **Test input components:** Plain function components consuming `forwardRef`
   from props (per §20 contract). NOT wrapped in `React.forwardRef()`.
5. **Coverage gate:** ≥90% on statements/branches/functions/lines (vitest config).
   Current: 97.26% statements / 95.72% branches / 98.16% functions / 97.26% lines.
