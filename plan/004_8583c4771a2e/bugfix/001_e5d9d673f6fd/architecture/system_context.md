# System Context: Auto-Save Bug Fix PRD

## Project Structure

```
formality/
├── packages/
│   ├── core/              # Framework-agnostic form logic (conditions, validation, config)
│   │   └── src/
│   │       ├── conditions/evaluate.ts   # isDisabled/isValid condition matchers
│   │       ├── types/                   # InputConfig, FormFieldsConfig, FormState types
│   │       └── validation/             # Validators
│   └── react/             # React adapter
│       └── src/
│           ├── components/Form.tsx     # MAIN FILE — auto-save, debounce, submitImmediate
│           ├── components/Field.tsx    # Field renderer, condition evaluation
│           ├── context/FormContext.ts  # FormContextValue interface (public API)
│           ├── hooks/useFieldDisabledState.ts  # Disabled state resolution + fieldStates builder
│           ├── types.ts                # DebouncedFunction interface
│           └── __tests__/             # 37 test files, 989 tests (5 skipped)
├── examples/06-auto-save.tsx          # Auto-save examples (Example 4 = scoped validation)
└── plan/                              # Planning artifacts
```

## Current Codebase State (HEAD: 8281ad7)

The repository HEAD is PAST the PRD's reference commit (`8e3fd4c`). Four commits
were made on top of it that appear to address all four issues:

```
8281ad7 docs: add P1 bugfix validation results and issue log
716b44c test(react): drop unnecessary forwardRef wraps to silence render warnings   ← Issue 4
0dca79a fix(react): flush per-field debounce saves in submitImmediate; fix pending() ← Issues 1+3
1863b44 test(react): skip out-of-scope failing isDisabled tests; remove probes       ← Issue 2
8e3fd4c test: consolidate disabled-layer tests and add isDisabled probes             ← PRD ref point
```

**Working tree:** clean (no uncommitted changes). Test suite: **989 passed, 5 skipped**.

## DebouncedFunction Contract

**File:** `packages/react/src/types.ts:117-123`

```ts
export interface DebouncedFunction {
  (): void;          // Schedule/trigger the debounced invocation
  cancel: () => void;   // Cancel any pending invocation
  flush: () => void;    // Immediately execute any pending invocation
  pending: () => boolean; // Check if there's a pending invocation
}
```

This is the public contract for both the Form-level debounced submit
(`debouncedSubmit` on `FormContextValue`) and the per-field debounce cache
(`fieldDebouncersRef`).

## Auto-Save Architecture (Form.tsx)

### Key References

| Component | Location | Purpose |
|-----------|----------|---------|
| `fieldDebouncersRef` | Form.tsx:225 | `useRef(new Map<number, DebouncedFunction>())` — per-field debounce cache keyed by ms interval |
| `pendingChangedFields` | Form.tsx:215 | `useRef(new Set<string>())` — accumulates field names while debounce is pending |
| `changeField` | Form.tsx:358-390 | Handles field changes; routes to immediate/per-field/Form-level debounce |
| `executeAutoSave` | Form.tsx:~540-560 | Drains `pendingChangedFields`, validates, submits |
| `getOrCreateDebounced` | Form.tsx:650-668 | Factory for per-field debounced fns, cached in `fieldDebouncersRef` |
| `debouncedSubmit` | Form.tsx:689-704 | Form-level debounced submit (useMemo, rebuilt on `debounceMs` change) |
| `submitImmediate` | Form.tsx:722-743 | Public flush API — must flush BOTH per-field and Form-level timers |
| `wrapDebounced` | Form.tsx:862-884 | Wraps lodash debounce with correct `pending()` tracking |
| `debouncedSubmitRef` | Form.tsx:506 | Ref to current `debouncedSubmit` for stable access |

### Debounce Routing (changeField, Form.tsx:375-390)

```
inputConfig.debounce === false      → executeAutoSave immediately (no timer)
inputConfig.debounce === <number>   → getOrCreateDebounced(fieldDebounce)()  [per-field timer]
inputConfig.debounce === undefined  → debouncedSubmitRef.current()()         [Form-level timer]
```

### Coalescing Design

Fields sharing the same numeric debounce interval share a SINGLE timer
(`fieldDebouncersRef` is keyed by ms, not by field name). All pending changes
accumulate in `pendingChangedFields`, so when any timer fires, `executeAutoSave`
captures ALL pending fields in one save — regardless of which timer fired.

## Issue-by-Issue Status

### Issue 1 (Major): submitImmediate per-field flush — ✅ FIXED

**Current implementation (Form.tsx:722-743):**
```ts
const submitImmediate = useCallback(() => {
    const anyPending =
      debouncedSubmitRef.current?.pending() === true ||
      [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());
    if (!anyPending) return;

    debouncedSubmitRef.current?.cancel();
    fieldDebouncersRef.current.forEach((fn) => fn.cancel());

    executeAutoSaveRef.current?.();
}, []);
```

This is SUPERIOR to the PRD's suggested fix (naive `forEach(fn => fn.flush())`):
- Detects pending state across both timer sources
- Cancels ALL timers to prevent the version-abort race (a trailing timer firing
  after the flush would bump `executionVersionRef` and abort the flushed save)
- Runs `executeAutoSave` exactly once (shared `pendingChangedFields` captures all)

**Tests:** 4 tests in `autosave-submit-immediate.test.tsx`:
1. Form-level flush still fires (baseline)
2. Per-field flush now fires (Issue 1 repro)
3. Both pending simultaneously → single submit, no double (race guard)
4. No-op when nothing pending (no spurious empty save)

### Issue 2 (Major): Red CI + probe files — ✅ HYGIENE DONE, ⚠️ LIMITATION UNTRACKED

**What was done:**
- Probe files `_tmp_isdisabled_probe*.test.tsx` removed from repo
- 5 failing isDisabled tests changed to `it.skip(...)` with KNOWN LIMITATION comments
- Changes committed (`1863b44`)

**Root cause of isDisabled limitation:**
`useFieldDisabledState.ts:126-145` builds `fieldStates` WITHOUT the `disabled`
property (comment: "CRITICAL: Do NOT add disabled to fieldStates (creates
circular dependency)"). The core `evaluateConditions` function
(`packages/core/src/conditions/evaluate.ts:84-87`) checks `fieldState?.disabled`
for the `isDisabled` matcher — which is always `undefined` because the React
adapter intentionally omits it.

**What still needs doing:**
The PRD says: "decide whether the isDisabled React limitation is tracked as a
known issue elsewhere (not just in skip comments)." Currently it's ONLY in skip
comments. No KNOWN_ISSUES.md or equivalent tracking exists.

### Issue 3 (Minor): pending() correctness — ✅ FIXED

**Current implementation (wrapDebounced, Form.tsx:862-884):**
```ts
function wrapDebounced(callback: () => void, ms: number): DebouncedFunction {
  let isPending = false;
  const debounced = debounce(() => {
    isPending = false;
    callback();
  }, ms);
  return Object.assign(
    () => { isPending = true; debounced(); },
    {
      cancel: () => { isPending = false; debounced.cancel(); },
      flush: () => { isPending = false; debounced.flush(); },
      pending: () => isPending,
    },
  ) as DebouncedFunction;
}
```

The immediate adapter (`debounce === false`) correctly hardcodes
`pending: () => false` — an immediate function is never "pending".

**Tests:** 5 tests in `autosave-submit-immediate.test.tsx`:
1. pending() true while Form-level save scheduled, false after it fires
2. pending() false after cancel() clears scheduled save
3. flush() fires pending numeric-debounce save immediately
4. Immediate (debounce: false) adapter is never pending

### Issue 4 (Minor): forwardRef warnings — ✅ FIXED

All shared test input components in the autosave and Field test suites now use
plain function components consuming `forwardRef` from props (per §20 contract),
not `React.forwardRef()` wraps. No "forwardRef render functions accept exactly
two parameters" warnings appear in test output.

Some test files still use `forwardRef<...>((props, ref) => ...)` but they DO
wire the `ref` parameter (e.g., `FormalityProvider.test.tsx`, `useFormState.test.tsx`),
so they don't generate the warning.

## Testing Patterns

- **Fake timers:** `vi.useFakeTimers({ shouldAdvanceTime: true })` in beforeEach
- **Real timers:** `vi.useRealTimers()` in afterEach
- **Context capture:** `ContextCapture` component using `useFormContext()` to
  stash context on a ref for direct API invocation
- **User interaction:** `userEvent.type(field, "x", { delay: null })` wrapped in `act()`
- **Timer advancement:** `vi.advanceTimersByTimeAsync(ms)` wrapped in `act()`
- **Test structure:** Each test file is self-contained with its own input
  components, FormalityProvider setup, and Form/Field rendering

## Key Files for Each Issue

| Issue | Primary file | Test file | Types/docs |
|-------|-------------|-----------|------------|
| 1 | Form.tsx:722-743 (submitImmediate) | autosave-submit-immediate.test.tsx | FormContext.ts (FormContextValue) |
| 2 | Field.test.tsx:1132+ (skipped tests); useFieldDisabledState.ts:126-145 | Field.test.tsx | None |
| 3 | Form.tsx:862-884 (wrapDebounced) | autosave-submit-immediate.test.tsx | types.ts:117-123 (DebouncedFunction) |
| 4 | Multiple test files (test input components) | N/A | N/A |
