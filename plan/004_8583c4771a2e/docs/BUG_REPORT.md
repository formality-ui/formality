# Bug Report: Auto-save ignores per-field `debounce` (and a couple of related smells)

Filed from a consumer app (`sellario-ui-feature/forms`, an entity-CRM UI built on
`@formality-ui/react`). While auditing whether live-save was enabled across all of
the app's main forms, I traced the full auto-save path and found one real
behavioral bug plus two related issues. The app's live-save is *on* and works —
this report is about Formality's auto-save **timing/semantics**, not a
"it never saves" outage.

---

## Environment

| | |
|---|---|
| **Repo HEAD** | `@formality-ui/react` `0.2.1` (`packages/react/package.json`) — last commit `6555291` |
| **Consumer (reporting) version** | `@formality-ui/react@^0.2.1` (installed dist `0.2.1`) |
| **Verification** | Bug confirmed against **both** the source below (`packages/react/src/**`) **and** the installed `0.2.1` dist (`dist/index.js`). The logic is identical in both, so the fix should land before the next release. |
| **Consumer stack** | React 19, RHF 7, MUI 9; entity edit forms render `<Form autoSave>` via a thin wrapper (`AutoModalForm` → `UpdateForm` → `ModalForm` → Formality `<Form>`) |

> Note on versions: this checkout's `packages/react` is at `0.2.1`, but the
> consumer depends on `^0.2.1`. The relevant code is unchanged between them, so
> the report is valid against HEAD. Worth confirming nothing on an unpublished
> `0.2.1` branch already addresses this.

---

## TL;DR

1. **Per-field numeric `debounce` is silently ignored** (the headline bug).
   `changeField` only special-cases `debounce === false`; **any other value
   (e.g. `4000`, `2000`) falls through to the single Form-level debounced
   submit (default `1000ms`)**. The numeric `debounce` on an `InputConfig` is
   effectively dead config. There is also **no per-field value-commit
   debounce** — every keystroke writes to RHF immediately.
2. **`executeAutoSave` bails if *any* field has an error**, so one invalid
   field silently blocks auto-save of unrelated, valid edits.
3. Existing autosave tests only ever exercise the Form-level `debounce` prop
   (`debounce={500}`) — **none** assert per-field numeric debounce, so #1 has
   zero test coverage.

---

## Issue 1 (primary): Per-field `debounce` is dead config

### Symptom

A consumer sets a numeric `debounce` on an input type expecting per-field
auto-save cadence, e.g.:

```ts
// consumer app: src/forms/config.tsx
textField: { component: ..., defaultValue: "", debounce: 4000 }, // "save text 4s after typing"
decimal:   { component: ..., defaultValue: "", debounce: 2000 }, // "save decimals 2s after typing"
```

**Actual behavior:** both auto-save at the Form-level default of **1000ms**,
not 4000ms / 2000ms. The configured numbers have no effect.

### Root cause

`changeField` only branches on the immediate case; it never reads the numeric
value:

```ts
// packages/react/src/components/Form.tsx  (HEAD)
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    if (autoSave) {
      pendingChangedFields.current.add(name);
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // Trigger auto-save (immediate or debounced based on inputConfig)
      if (inputConfig?.debounce === false) {        // ← ONLY this is honored
        // Immediate submission: bypass debounce entirely
        executeAutoSaveRef.current?.();
      } else {
        // Normal debounced submission
        debouncedSubmitRef.current?.();             // ← always Form-level debounceMs
      }
    }
  },
  [autoSave, getAffectedFields],
);
```

- The `else` branch calls `debouncedSubmitRef.current`, which is built once in
  an effect from the **Form-level** `debounceMs` prop
  (`debounce: debounceMs = 1000`, `Form.tsx:150` / setup at `Form.tsx:609-644`).
  That is a **single debounced function at one fixed interval**; the field's
  own numeric `debounce` is never consulted.
- The Field never debounces its own value either. `Field.handleChange` commits
  to RHF synchronously on every keystroke, *then* notifies auto-save:

```ts
// packages/react/src/components/Field.tsx
const handleChange = useCallback(
  (onChange: (value: unknown) => void) => (newValue: unknown) => {
    const parsedValue = parse(newValue, inputConfig.parser, providerConfig.parsers);
    onChange(parsedValue);                        // ← committed immediately, every keystroke
    changeField(name, parsedValue, inputConfig);  // ← only place debounce is read (and only === false)
  },
  [inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig],
);
```

- `debouncedSubmit` is even exposed on the form context
  (`Form.tsx:706`), but **no field consumes it** (grep: single definition, zero
  reads) — so there's no alternate per-field path that would use it.

### The type explicitly promises this works

The `InputConfig.debounce` JSDoc says exactly what a consumer would expect:

```ts
// packages/core/src/types/config.ts
export interface InputConfig<TValue = unknown> {
  ...
  /** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */
  debounce?: number | false;
  ...
}
```

…and the Form-level prop doc mirrors it:

```ts
// packages/react/src/components/Form.tsx (FormProps)
/** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
debounce?: number | false;
```

So the public contract advertises "number = delay", but at the field level a
number is indistinguishable from "unset" — they both resolve to the Form-level
default.

### Impact

- **Misleading config / silent no-ops.** Consumers write `debounce: 4000`
  thinking they're throttling auto-save; they get 1000ms. Nothing warns them.
- **Saves are more frequent than intended** for text/number fields (intended
  4s → actual 1s), which means more update mutations than the app author
  thought they signed up for.
- **More RHF churn than intended.** If anyone read `debounce` as "throttle
  value commits to reduce re-renders," that's also not happening — every
  keystroke calls `setValue`.

### Repro / evidence (from the consumer app)

Consumer input config (`src/forms/config.tsx`):

| Input type | Configured `debounce` | What actually happens |
|---|---|---|
| `textField` | `4000` | auto-saves at **1000ms** (Form default) |
| `decimal` / `percent` | `2000` | auto-saves at **1000ms** |
| `number`, `date`, `time`, `password` | unset | auto-saves at **1000ms** |
| `autocomplete`, `expandingAuto`, `toggleButtonGroup`, `exclusiveToggleButtonGroup`, `enumToggleButtonGroup`, `switch` | `false` | auto-saves **immediately** ✅ (this is the only branch that works) |

None of the app's forms set a Form-level `debounce` prop, so the global default
of `1000ms` is what every debounced field actually uses.

---

## Issue 2 (secondary): One invalid field blocks *all* auto-save

### Root cause

In `executeAutoSave`, after the per-changed-field error check, there's a
second, stricter guard against the whole form's errors:

```ts
// packages/react/src/components/Form.tsx
const executeAutoSave = useCallback(async () => {
  ...
  // Check if changed fields have errors (from onChange validation)
  for (const fieldName of changedFields) {            // ← (a) already guards changed fields
    const fieldState = methods.getFieldState(fieldName as any);
    if (fieldState.error) {
      return;
    }
  }

  if (fieldsToTrigger.length > 0) {
    const isValid = await methods.trigger(fieldsToTrigger as any);  // ← validates affected fields
    if (executionVersionRef.current !== executionVersion) return;
    if (!isValid) return;
    ...
  }

  // Check if form is valid (may have other errors from other fields)
  const formState = methods.formState;
  if (Object.keys(formState.errors).length > 0) {     // ← (b) ALSO bails on ANY error, anywhere
    return;
  }

  const values = methods.getValues();
  await handleSubmit(values as TFieldValues);
}, [...]);
```

Guard (a) plus the `fieldsToTrigger` `trigger()` already validate everything
that the current change can affect. Guard (b) then rejects the submit if **any
unrelated field** in the form is currently invalid.

### Impact

Concrete scenario from the consumer app: an edit form has a required `email`
field. The user leaves it empty (validation error), then edits the `notes`
field. Auto-save for `notes` fires, sees `formState.errors` is non-empty
(the `email` error), and **silently returns without saving `notes`**. The
user's edit sits unsaved and can be lost on close, with no feedback — even
though `notes` itself is perfectly valid. The valid-edit-silently-dropped
behavior is the dangerous part.

(Minor: reading `methods.formState` imperatively outside of a subscribed
render leans on RHF's formState-proxy subscription semantics; safer to rely on
the explicit `getFieldState`/`trigger` checks that are already there.)

---

## Issue 3 (minor / note): ref timing on first render

`executeAutoSaveRef.current = executeAutoSave;` runs during render
(`Form.tsx:606`), while `debouncedSubmitRef.current` is assigned inside an
effect (`Form.tsx:609-644`). On the very first render there's a window before
the effect runs where `debouncedSubmitRef.current` is `undefined` (the
`?.()` no-ops). In practice a user change can't land in that window, so it's
not a live bug — just flagging that the two auto-save triggers are wired
through different mechanisms. Not blocking; mention only because it's adjacent
to the fix.

---

## Test-coverage gap

The existing autosave suites are thorough for the Form-level prop but do not
cover the field-level numeric case at all:

- `packages/react/src/__tests__/autosave-async-timing.test.tsx`
- `packages/react/src/__tests__/autosave-rapid-changes.test.tsx`
- `packages/react/src/__tests__/autosave-validation.test.tsx`

Every one of them drives timing via the Form prop (`<Form debounce={500} ...>`)
or relies on the default. **None sets a numeric `debounce` on an
`InputConfig`** to assert that per-field cadence is honored — which is exactly
why Issue 1 went unnoticed. Likewise there's no test asserting "auto-save
fires for a valid field while an unrelated field is invalid" (Issue 2).

---

## Preliminary fix suggestions

I did the research; happy to leave the implementation to whoever picks this
up, but here's what I'd propose.

### Fix for Issue 1 — honor per-field numeric `debounce`

The tricky part: `debouncedSubmitRef` is a single function at a single
interval, so you can't just "use `inputConfig.debounce` if it's a number" with
the existing ref. Two viable shapes:

- **(A) Behavior-correct, minimal: per-interval debounce cache.** Keep a small
  `Map<number, DebouncedFunction>` (keyed by interval) so a field whose
  `debounce` is a number schedules against its own interval, while
  `debounce === false` stays immediate and unset falls back to the Form-level
  `debounceMs`. Pseudocode for the `changeField` branch:

  ```ts
  const fieldDebounce = inputConfig?.debounce; // number | false | undefined
  if (fieldDebounce === false) {
    executeAutoSaveRef.current?.();
  } else {
    const ms = typeof fieldDebounce === "number" ? fieldDebounce : debounceMs;
    getOrCreateDebounced(ms)();   // memoized per ms, same executeAutoSave target
  }
  ```

  Don't forget to `.cancel()` all cached debounce fns on unmount / when
  `executeAutoSave` changes.

- **(B) Bigger, also reduces churn: debounce the value commit at the field
  level.** Move debounce into `Field.handleChange` so `setValue` + `changeField`
  fire after the field's interval. This both fixes the cadence *and* cuts RHF
  re-renders during typing. Larger blast radius (interacts with validation
  timing, `shouldValidate`/`shouldDirty`, the `waitForFieldValidation` loop),
  so I'd treat it as a follow-on rather than the first fix.

**Recommendation:** ship (A) first to make the public contract true, then
evaluate (B). Either way, **update the `InputConfig.debounce` doc** to state
unambiguously whether a number also throttles value commits to RHF (today it
does not), so intent isn't ambiguous.

One semantics decision to make explicit: when multiple fields with *different*
numeric debounces are dirty at once, what should fire? Today (single global
debounce) they coalesce into one submit. With per-interval caches, a 2000ms
field and a 4000ms field would submit independently at their own cadences —
which is arguably the *correct* reading of per-field debounce, but it's a
behavior change worth being deliberate about (and the
`autosave-rapid-changes.test.tsx` "alternating between fields" case should be
re-checked under it).

### Fix for Issue 2 — scope the validity gate to what changed

Drop guard (b) at `Form.tsx:596`, or scope it to `changedFields ∪
affectedFields`:

```ts
// Instead of the whole-form check, only re-validate fields this save touches:
// (changedFields are already validated by onChange; affectedFields by trigger() above)
// → remove the `Object.keys(formState.errors).length > 0` return entirely.
```

The per-changed-field check (a) plus the affected-field `trigger()` already
gate the save on exactly the fields that matter, so the global check is
redundant *and* over-broad. If you want to keep a safety net, restrict it to
the same `fieldsToWaitFor` set used above rather than the whole form.

### Tests to add

- Per-field numeric debounce: define an input with `debounce: 2000`, type,
  advance 1000ms → assert **no** submit; advance past 2000ms → assert submit.
  Mix a `debounce: false` field in the same form and assert it submits
  immediately while the debounced one is still pending.
- Unrelated-invalid-field case: field A is invalid (required + empty), edit
  valid field B → assert B's change **is** submitted (current code fails this).
- (If pursuing Fix 1A) alternating between fields with different numeric
  debounces — document the chosen coalescing behavior.

---

## Appendix: call sites / line refs (HEAD)

| Concern | File | Lines |
|---|---|---|
| `changeField` immediate-vs-debounce branch (Issue 1) | `packages/react/src/components/Form.tsx` | 340–364 |
| `Field.handleChange` immediate commit | `packages/react/src/components/Field.tsx` | 404–418 |
| Global errors guard (Issue 2) | `packages/react/src/components/Form.tsx` | 585–592 (per-field) → 596–599 (whole-form) |
| Form-level debounce default + setup | `packages/react/src/components/Form.tsx` | 150, 609–644 |
| `debouncedSubmit` exposed but unused in context | `packages/react/src/components/Form.tsx` | 706 |
| `InputConfig.debounce` type/doc | `packages/core/src/types/config.ts` | 68 |
| Existing autosave tests (no field-level numeric coverage) | `packages/react/src/__tests__/autosave-*.test.tsx` | — |

Verified identical logic in installed dist
`node_modules/@formality-ui/react/dist/index.js` (consumer `0.2.1`):
`changeField` at ~274–291, whole-form errors guard at ~596.
