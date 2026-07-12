# P1.M1.T2.S2 — Research Notes: Track isDisabled React-adapter limitation as known issue

## Task essence

Pure **Mode-A documentation** deliverable. Create `packages/react/KNOWN_ISSUES.md`
describing the `isDisabled` field-state condition matcher limitation in the React
adapter, and add a short "Known Issues" section to `packages/react/README.md`
linking to it. No source/runtime changes.

## Source of truth consumed from P1.M1.T2.S1

S1's deliverable (already committed at `1863b44`) is the 5 `it.skip(...)`
blocks in `packages/react/src/__tests__/Field.test.tsx` carrying `KNOWN
LIMITATION` comments. These are the authoritative, verified source for the
limitation description. Confirmed exact locations:

| Test | Line | Status |
|---|---|---|
| `should reference isDisabled matcher from other field` | 1132 | `it.skip` ✓ |
| `should handle circular dependencies without infinite loops` | 1172 | `it.skip` ✓ |
| `should disable result when both source fields are disabled` | 1226 | `it.skip` ✓ |
| `should re-evaluate when source field disabled states change` | 1308 | `it.skip` ✓ |
| `should work with field state matchers in object when` | 1356 | `it.skip` ✓ |
| `should not disable result when only one source field is disabled` | 1271 | `it` (ACTIVE, passes) — do NOT skip |
| `should disable result when value matcher matches and state field is disabled` | 1393 | `it` (ACTIVE, passes) — do NOT skip |

The KNOWN_ISSUES doc must reference these skip comments by file + line range
(~1132–1356) so devs can find the concrete test cases without grepping.

## Root cause (verified live from source)

1. **`packages/react/src/hooks/useFieldDisabledState.ts:126-145`** — the
   `fieldStates` `useMemo` builds `FieldStateInput` objects with
   `value`, `isTouched`, `isDirty`, `error`, `invalid`, `isValidating` — but
   **no `disabled`**. Inline comment verbatim:
   `// CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)`.
   Omitting `disabled` is **intentional** to break circular re-render deps
   (field A's disabled state can depend on field B's disabled state and vice
   versa → infinite re-render loop).

2. **`packages/core/src/conditions/evaluate.ts:84-87`** — core's
   `evaluateConditions` fully supports the `isDisabled` matcher:
   ```ts
   if (matcher.isDisabled !== undefined) {
     const isFieldDisabled = fieldState?.disabled ?? false;   // ← always undefined in React adapter
     if (matcher.isDisabled !== isFieldDisabled) return false;
   }
   ```
   So `fieldState?.disabled` is always `undefined` in the React adapter →
   `isFieldDisabled` is always `false` → the `isDisabled: true` matcher never
   matches. Core's own unit tests pass; only the React integration is broken.

## Workaround (from item contract + verified against skip comment @1132)

Instead of `{ when: 'source', isDisabled: true, disabled: true }`, use a
**value-based condition** that gates on a field's *value* (e.g.
`{ when: 'source', is: 'disable', disabled: true }` — gates on the string
value `"disable"`), or apply `disabled` explicitly via the `<Field disabled>`
JSX prop or `FieldConfig.disabled: true` in config. The skip-comment test
config at line 1132 demonstrates both patterns (`source` uses value-based
`is: "disable"` and works; `target` uses `isDisabled: true` and is the
broken case).

## Potential future fix (out of scope — for the doc only)

A **non-reactive disabled-state registry** that resolves disabled states
without creating React watch dependencies, breaking the circular
re-render cycle. This is explicitly out of scope for this bugfix
(see architecture/system_context.md §"Issue 2 — ⚠️ LIMITATION UNTRACKED").

## Files touched (deliverable)

1. **NEW** `packages/react/KNOWN_ISSUES.md` — the primary deliverable.
2. **MODIFY** `packages/react/README.md` — add a `## Known Issues` section
   linking to `KNOWN_ISSUES.md`. README has 13 existing `## ` sections;
   last section before `## License` is `## Testing & Coverage`. Insert
   `## Known Issues` between `## Testing & Coverage` and `## License`.

## Validation / formatting gate

- `.md` files are **NOT** in `.prettierignore` (only `PRD.md` and `CHANGELOG.md`
  are explicitly ignored for prettier). So prettier owns markdown formatting.
- Gate: `npx prettier --check packages/react/KNOWN_ISSUES.md packages/react/README.md`
  (or `pnpm format:check`).
- No TypeScript / vitest / coverage impact — `.md` files are not compiled or
  tested. (Confirm `npx vitest run` stays green, 989 passed | 5 skipped.)

## Conventions to follow

- README uses `## ` (h2) for top-level sections, h3 (`### `) for subsections.
- Tables use GitHub pipe style with padding (see README props tables).
- The root `README.md` Condition Reference (line 326) documents `isDisabled` as
  "Check if field is disabled (`true`) or enabled (`false`)" with **no caveat**.
  The KNOWN_ISSUES doc should cross-reference this so the limitation is
  discoverable from the conditions docs too. (Updating the root README is
  **out of scope** — only `packages/react/README.md` per the contract.)

## No external research needed

This is an internal architectural limitation. No third-party library docs,
patterns, or external references are required — the limitation, root cause,
and workaround are all defined by the codebase and the S1 skip comments.
External research (e.g. "how other form libraries handle cross-field disabled
state") would inform the future fix, which is explicitly out of scope.
