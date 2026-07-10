# System Context — Plan 004 Delta

## What This Delta Is

Plan `004` is a **verification + documentation-alignment** delta scoped
exclusively to PRD §12 (Auto-Save System, internally numbered §11.1–§11.3).

The delta PRD confirms that the two auto-save behavior changes specified in the
updated PRD are **already implemented and tested** in the current codebase:

1. **Scoped validity gate** (§11.1 point 4): Auto-save only validates the
   changed field + dependent/affected fields. An unrelated invalid field does
   NOT block a valid edit. Whole-form validity is still enforced on full
   manual submit.
2. **Per-field numeric debounce coalescing** (§11.3 Example 4): Fields sharing
   a debounce ms share one timer; faster timer submits the pending batch;
   slower timer no-ops; no-debounce falls back to Form-level `debounce` prop.

This plan does NOT re-implement these behaviors. It (1) audits the shipped
code/tests against the updated PRD to confirm zero drift with the coverage gate
green, and (2) sweeps user-facing docs to retire any stale whole-form-validity
framing.

## Research Findings Summary

### 1. Implementation Audit — ZERO DRIFT

All four specified behaviors are fully implemented in
`packages/react/src/components/Form.tsx` and match PRD §11.1–§11.3 exactly.

| PRD Requirement | Function | Location | Match |
|---|---|---|---|
| Scoped validity gate (§11.1 pt4) | `executeAutoSave` Gate 1 + Gate 2 | Form.tsx:549-648 (gates at 585-591, 594-616) | ✅ |
| No whole-form validity check | Explicit comment block | Form.tsx:620-629 | ✅ |
| `pendingChangedFields` set | declared + populated + consumed | Form.tsx:215, 364, 557-560 | ✅ |
| `getAffectedFields()` | transitive dep traversal | Form.tsx:338-356 | ✅ |
| Execution-version abort | `executionVersionRef` checkpoints | Form.tsx:218, 551-552, 579, 598, 612-616 | ✅ |
| `getOrCreateDebounced(ms)` | per-interval coalescing cache | Form.tsx:650-682 | ✅ |
| `changeField` 3-way branch | false→immediate, number→per-field, undefined→form-level | Form.tsx:372-389 | ✅ |

See `architecture/autosave-impl-audit.md` for the full line-by-line audit.

### 2. Test Coverage Audit — ZERO GAPS

All 43 tests pass across the 4 autosave test files. Every spec scenario is
present and passing:

- `autosave-validation.test.tsx` (21 tests): scoped validation, dependent
  fields, async-wait, "Unrelated Invalid Field (Issue 2)", validation errors,
  debounce:false immediate.
- `autosave-field-debounce.test.tsx` (10 tests): per-field numeric debounce,
  coalescing semantics (shared-interval, faster-submits-batch,
  slower-no-ops), mixed false+numeric, form-level fallback.
- `autosave-async-timing.test.tsx` (4 tests): execution-version abort
  checkpoints.
- `autosave-rapid-changes.test.tsx` (8 tests): rapid-change abort + version
  verification.

See `architecture/autosave-test-audit.md` for the full test-by-test mapping.

### 3. Coverage Gate — GREEN

```
Test Files  36 passed (36)
Tests       all passed
Coverage:   97.25% statements | 95.7% branches | 98.16% functions | 97.25% lines
```

All four metrics are above the 90% threshold (PRD §1.3.7). The vitest config at
`vitest.config.ts` correctly spreads `coverageConfigDefaults.exclude` and adds
the PRD-required excludes (`examples/**`, `packages/svelte/**`,
`packages/vue/**`, `**/dist/**`). The `scripts/**` exclude is a justified
deviation documented in the config comment.

### 4. Documentation Staleness Audit — ONE STALE ITEM

The five explicitly-audited locations are **clean** (no stale whole-form claim):
- `README.md` §"Auto-Save" (~502): neutral, no validity-scope claim
- `README.md` capability bullet (~643): "validation awareness" — accurate
- `packages/react/README.md` §"Auto-Save" (~279): neutral
- `packages/react/README.md` prop tables (~121, 137): neutral
- `Form.tsx` autoSave/debounce JSDoc (~57-71): accurate, scoped

**ONE stale item found:**
`examples/06-auto-save.tsx` → Example 4 "Auto-Save with Validation":
- Line 322: `// Auto-save only triggers when form is valid` (OLD behavior)
- Line 370: `<p>Form only saves when all fields are valid</p>` (false under NEW)
- Line 382: `Form valid: {methods.formState.isValid ? "Yes" : "No"}` (misleading)

These describe the OLD whole-form gate. Under the current runtime, editing
`notes` while an unrelated required `email` is empty would still save `notes`.

See `architecture/doc-staleness-audit.md` for the full location-by-location
audit with exact text quotes.

## Scope Boundaries

- **In scope:** (T1) read-only audit confirming zero drift + coverage green;
  (T2) fix the one stale example file + confirm READMEs are already aligned.
- **Out of scope:** any change to auto-save runtime logic, any non-§12 PRD
  section, the forwardRef work completed in session 003.

## Sizing

- Diff size: ~60 net added lines, single PRD section
- Implementation status: already shipped + tested
- Remaining work: verification + one doc fix
- Verdict: 1 phase, 1 milestone, 2 tasks (per delta PRD §5)
