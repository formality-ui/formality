# Known Issues — @formality-ui/react

> React-adapter-specific limitations. For general Formality behavior, see the
> root [`README.md`](../../README.md) and PRD.

## isDisabled field-state condition matcher not functional in React adapter

The `isDisabled` field-state condition matcher (documented in the root
[Condition Reference](../../README.md#condition-reference)) does not evaluate
correctly in the React adapter. Core fully implements it; the React adapter
does not propagate the `disabled` state into the `fieldStates` map that
condition evaluation reads. This is a documented architectural trade-off, not a
bug to chase — see [Workaround](#workaround) for what to use instead.

### Symptom

A condition that gates on another field's _disabled state_ — using
`{ when: 'source', isDisabled: true, disabled: true }` — silently does nothing.
The `disabled` outcome never fires, because `isDisabled` can never resolve to
`true` (the source field's `disabled` is never present in `fieldStates`).

```ts
// ❌ Does NOT work in the React adapter today:
const config: FormFieldsConfig = {
  trigger: { type: "textField" },
  source: {
    type: "textField",
    // source becomes disabled when trigger's VALUE is 'disable':
    conditions: [{ when: "trigger", is: "disable", disabled: true }],
  },
  target: {
    type: "textField",
    // intent: disable target when source is disabled — but this never matches,
    // because source's `disabled` is not propagated into fieldStates:
    conditions: [{ when: "source", isDisabled: true, disabled: true }],
  },
};
```

The same applies to `{ when: 'source', isDisabled: false, ... }` (the `false`
branch). The matcher evaluates against an always-`undefined` value, so any
`isDisabled` condition is effectively dead.

### Root cause

The React adapter builds the `fieldStates` map used by `evaluateConditions`
**without** a `disabled` property — on purpose. In
[`packages/react/src/hooks/useFieldDisabledState.ts`](./src/hooks/useFieldDisabledState.ts)
(~lines 126–145), the `fieldStates` `useMemo` omits the `disabled` key under an
explicit guard:

```ts
// Build field states WITHOUT disabled property
// CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};
  // ...
  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property - this breaks the circular dependency
    };
  });
  return states;
}, [watchFields, fieldValues, methods]);
```

Adding `disabled` here would create a circular React watch/re-render
dependency: field A's disabled state depends on field B's disabled state (via
an `isDisabled` condition), and vice versa — each re-render re-computes
disabled states, which trigger more re-renders, which never converge.

Meanwhile, core **fully supports** `isDisabled`. In
[`packages/core/src/conditions/evaluate.ts`](../core/src/conditions/evaluate.ts)
(~lines 84–87) the matcher reads `fieldState?.disabled`:

```ts
// Check isDisabled matcher
if (matcher.isDisabled !== undefined) {
  const isFieldDisabled = fieldState?.disabled ?? false;
  if (matcher.isDisabled !== isFieldDisabled) {
    return false;
  }
}
```

In the React adapter, `fieldState.disabled` is therefore **always `undefined`**
(falling back to `false`), so the matcher can never match `true`. Core's own
unit tests pass because they supply `fieldState.disabled` directly; only the
React adapter fails to populate it.

**In short:** core implements `isDisabled`; the React adapter intentionally
does not propagate `disabled` into `fieldStates` to avoid a circular
re-render loop. The gap is React-adapter propagation, _not_ a missing core
feature.

### Workaround

Use one of the two alternatives below instead of the `isDisabled` matcher.

**Workaround 1 — value-based condition.** Gate on a field's _value_ (a sentinel
you control) rather than on its disabled state. This only works when there is a
field value to gate on — i.e. when the disabling is itself driven by a value
(such as a trigger field).

```ts
// ✅ Workaround 1 — value-based condition (gate on a field's VALUE):
const config: FormFieldsConfig = {
  trigger: { type: "textField" },
  source: {
    type: "textField",
    // source becomes disabled when trigger's VALUE is 'disable':
    conditions: [{ when: "trigger", is: "disable", disabled: true }],
  },
  target: {
    type: "textField",
    // gate target on the SAME trigger value that disables source,
    // instead of on source's disabled state:
    conditions: [{ when: "trigger", is: "disable", disabled: true }],
  },
};
```

**Workaround 2 — explicit disabled prop / config.** Set `disabled` directly on
the target field via the JSX prop or `FieldConfig.disabled`, rather than
through a cross-field condition matcher. Use this when there is no field value
to gate on (e.g. a field that is always disabled, or disabled by app state
outside Formality).

```tsx
// ✅ Workaround 2 — explicit disabled prop (no cross-field matcher):
<Field name="target" disabled />;

// or, in config:
const config: FormFieldsConfig = {
  target: { type: "textField", disabled: true },
};
```

### Potential future fix

A proper fix would introduce a **non-reactive disabled-state registry**: a
mechanism that resolves disabled states without creating circular React
watch/re-render dependencies. For example, a synchronous, memoized registry
that `evaluateConditions` can read for `disabled` without each field subscribing
to every other field's disabled state and re-rendering on every change.

This is **explicitly out of scope** for the current bugfix. The limitation is
documented here precisely so that it is tracked and discoverable; the registry
design is future feature work.

### Reference

- **Skipped test cases** in
  [`packages/react/src/__tests__/Field.test.tsx`](./src/__tests__/Field.test.tsx)
  — the five `it.skip(...)` blocks under
  `describe("Conditions disabled priority …")`, at approximately:
  - line 1132 — `should reference isDisabled matcher from other field`
  - line 1172 — `should handle circular dependencies without infinite loops`
  - line 1226 — `should disable result when both source fields are disabled`
  - line 1308 — `should re-evaluate when source field disabled states change`
  - line 1356 — `should work with field state matchers in object when`

  Each skip comment documents the symptom, the circular-dependency root cause,
  and why it cannot be trivially fixed. These are the authoritative test
  evidence of the limitation. (The active, _passing_ tests in the same region —
  e.g. AND-logic and single-source cases — are unaffected and must not be
  confused with the skipped cases.)

- **Root-cause source** —
  [`packages/react/src/hooks/useFieldDisabledState.ts`](./src/hooks/useFieldDisabledState.ts)
  (~lines 126–145, the `fieldStates` `useMemo` and its `CRITICAL: Do NOT add
disabled to fieldStates` comment) and
  [`packages/core/src/conditions/evaluate.ts`](../core/src/conditions/evaluate.ts)
  (~lines 84–87, the `isDisabled` matcher reading `fieldState?.disabled`).

- **Root README Condition Reference** —
  [`README.md`](../../README.md#condition-reference) (~line 326) documents
  `isDisabled` as _"Check if field is disabled (`true`) or enabled (`false`)"_
  with no caveat. This `KNOWN_ISSUES.md` is that caveat for React-adapter
  consumers.
