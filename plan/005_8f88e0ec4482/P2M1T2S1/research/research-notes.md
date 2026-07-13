# Research Notes — P2.M1.T2.S1: Remove orphaned useFieldDisabledState hook

> A simple, well-scoped deletion of **confirmed dead code**. This file records
> the verification trail that PROVES removal is safe, the exact dangling
> references found (and how to handle each), and the validation commands.

---

## §1. The dead-code proof (THREE independent confirmations)

The hook `useFieldDisabledState` (in `packages/react/src/hooks/useFieldDisabledState.ts`,
197 lines) is **orphaned** — implemented and tested but never wired into the
production graph. Three independent checks confirm this:

### 1a. NOT exported from the public barrel
`packages/react/src/index.ts` exports exactly these hooks (lines 72–81):
`useFormState`, `useConditions`, `usePropsEvaluation`, `useInferredInputs`,
`useSubscriptions`, `useField`. **`useFieldDisabledState` is absent.** It was
never part of the public API surface.

### 1b. NOT imported by Field.tsx (or any component)
`grep -n "useFieldDisabledState" packages/react/src/components/Field.tsx` →
**no matches.** `Field.tsx` only references `disabled` via the destructured
`disabledProp` prop (lines 126, 147). The inline disabled resolution lives
elsewhere now (see 1c).

### 1c. NOT used by the NEW extracted useField.tsx (THE critical check)
After the P2.M1.T1.S2 extraction, disabled state is resolved **inline inside
`packages/react/src/hooks/useField.tsx`** (lines 388–420), NOT via
`useFieldDisabledState`:

```typescript
// useField.tsx — the CURRENT, live disabled-resolution logic (PRD §5.3.4)
const isDisabled = useMemo(() => {
  if (disabledProp !== undefined) return disabledProp;            // JSX prop (highest)
  if (fieldConfig.disabled !== undefined) return fieldConfig.disabled; // field config
  if (conditionResult.hasDisabledCondition)                       // useConditions result
    return conditionResult.disabled ?? false;
  if (groupContext.state.isDisabled) return true;                 // group state
  // ... prop-layer disabled (two-pass selectProps/defaultFieldProps)
  return false;                                                    // default: enabled
}, [/* ... */]);
```

This **delegates disabled resolution to `useConditions`** (`conditionResult`) +
`groupContext`, exactly as the contract states. `useFieldDisabledState` is a
superseded precursor to this inline logic. **Removing it cannot break anything.**

### 1d. Prior independent confirmations (historical artifacts)
- `.pi-subagents/artifacts/outputs/c8b69c3e/context.md`: "useFieldDisabledState
  | ❌ NO (exported) | grep confirmed NOT in barrel, NOT consumed by any
  component (Field.tsx does not import it), only referenced by its own
  definition + test file. Effectively dead/standalone code today."
- `.pi-subagents/artifacts/outputs/4eba93b2/react-gap-report.md` §"useFieldDisabledState
  — ⚠️ orphaned": "Implemented + tested but no production consumer."

---

## §2. The two files to delete

| File | Size | Tests |
| --- | --- | --- |
| `packages/react/src/hooks/useFieldDisabledState.ts` | 197 lines, 6021 bytes | n/a |
| `packages/react/src/__tests__/useFieldDisabledState.test.tsx` | 374 lines, 10945 bytes | **16 `it` cases across 9 `describe` blocks** |

Removing the test file removes **16 passing tests** from the suite. This is
EXPECTED and correct — the tests assert behavior of code that nothing calls.
Zero test **failures** should result (no other file imports the hook).

---

## §3. Dangling references — full inventory & disposition

Repo-wide grep (`grep -rn "useFieldDisabledState" .` minus node_modules/dist)
found references ONLY in these locations. Each is categorized:

| Reference | Type | Disposition |
| --- | --- | --- |
| `packages/react/src/__tests__/useFormState.test.tsx:45` | **comment** ("Reuses the closure pattern from useFieldDisabledState.test.tsx.") | ⚠️ **UPDATE** — sole live-code dangling reference; rewrite to not cite the deleted file (see §4) |
| `packages/react/src/hooks/useFieldDisabledState.ts` (self) | source | DELETE |
| `packages/react/src/__tests__/useFieldDisabledState.test.tsx` (self) | test | DELETE |
| `CHANGELOG.md:111` | historical release note | **DO NOT TOUCH** — changelogs are append-only history; the deletion gets its OWN entry via semantic-release |
| `coverage/coverage-final.json` | generated artifact | IGNORE — regenerated on next `pnpm test:coverage` |
| `plan/001_*/`, `plan/002_*/`, `plan/004_*/`, `.pi-subagents/artifacts/**` | historical plan/research docs | IGNORE — not source code; immutable historical record |
| `gap_analysis.md G7` (cited by contract) | conceptual | NOTE: `plan/005_8f88e0ec4482/gap_analysis.md` does NOT exist on disk; the G7 gap is documented in the agent artifacts in §1d instead. The orphan status is real regardless. |

**Conclusion:** the ONLY non-deletion edit needed in live source is the one
comment at `useFormState.test.tsx:45`.

---

## §4. The stale comment at useFormState.test.tsx:45

Current text (context L43–47):
```typescript
// Create wrapper with record and config for testing the hook inside <Form>.
// Reuses the closure pattern from useFieldDisabledState.test.tsx.
const createWrapper = (
```

After deleting `useFieldDisabledState.test.tsx`, line 45 cites a non-existent
file. Recommended rewrite (drop the dangling citation; the wrapper pattern is
self-evident in this file now):
```typescript
// Create wrapper with record and config for testing the hook inside <Form>.
const createWrapper = (
```
This is a **1-line comment deletion**, not a behavioral change. It keeps the
codebase free of dangling file references. (It does NOT violate the contract's
"DOCS: none" clause — that clause concerns doc files, and this is a code
comment cleanup that is part of a clean removal.)

---

## §5. Validation commands (verified against root + react package.json)

| Gate | Command | What it proves |
| --- | --- | --- |
| Full test suite | `pnpm test` (= `vitest run`) | No test fails; count drops by 16 (the deleted file's tests) |
| React-only test | `pnpm --filter @formality-ui/react test` | React package green in isolation |
| Type check | `pnpm typecheck` (= `tsc --build`) | No dangling import/type errors |
| Coverage gate | `pnpm test:coverage` (= `vitest run --coverage`) | All metrics ≥ 90% (PRD §1.3.7) |
| Lint | `pnpm lint` (= `eslint .`) | No unused-import / dead-code errors |
| Build | `pnpm build` (= `pnpm -r build`, tsup) | Both packages still emit |
| Import-free proof | `grep -rn "useFieldDisabledState" packages/react/src/` | **Zero matches** after deletion |

### Coverage impact (analysis)
`useFieldDisabledState.ts` was ~97.8% statement / 93.1% branch covered (per
`.pi-subagents/artifacts/.../coverage_gaps.md`). Removing both the code and its
tests reduces total source lines by ~197 but also removes the few uncovered
branches. Net effect on the repo-wide 90% gate is **neutral-to-slightly-positive**
(the file is small relative to the thousands of lines / 1018+ tests in scope).
The gate should remain comfortably green. If it ever dipped, it would indicate
an unrelated regression, not this deletion.

---

## §6. Baseline & dependency context

- **Verified suite baseline** (from sibling S3 PRP): **1018 passed | 5 skipped**
  at the pre-extraction state, PLUS any isolated `useField` tests S3 adds.
  This task runs AFTER S3 completes (stated dependency).
- After THIS task: count = (post-S3 baseline) **− 16** passed, 5 skipped.
  **Zero failures.**
- **The dependency is already satisfied in the current working tree**: the
  mid-flight S2 extraction (uncommitted) already shows `useField.tsx` resolving
  disabled inline (§1c), NOT via `useFieldDisabledState`. So removal is safe
  regardless of S3's final state.

---

## §7. Risk assessment

**Risk: ~0.** This is a deletion of triple-confirmed dead code with a one-line
comment cleanup. The only way it could fail is if some file imported the hook
that my grep missed — but the grep was exhaustive (all `.ts/.tsx/.md/.json`,
minus node_modules/dist/plan). The functional surface is nil (never exported,
never imported). Gates are standard repo commands.
