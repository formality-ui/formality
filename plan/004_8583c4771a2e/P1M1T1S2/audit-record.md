# Auto-Save Test Coverage Audit — P1.M1.T1.S2

## Outcome: no drift, all scenarios covered + gate green

**Audit date:** 2026-07-10
**Method:** Independent re-confirmation — `grep -nE` walk of current `describe`/`it`
names + live `pnpm test:coverage` run from repo root. Line numbers below are the
CURRENT (live) numbers, re-read at audit time (the PRP/architecture-audit numbers
matched verbatim — no drift).

---

## Part A — Spec Scenario → Test Mapping

Every spec scenario in PRD §11.1–§11.3 maps to a named `it(...)` test in one of
the four auto-save test files. Per-file `it()` counts re-confirmed by grep:
**autosave-validation = 21, autosave-field-debounce = 10, autosave-async-timing = 4,
autosave-rapid-changes = 8 → 43 total.**

### §11.1 — Behavior (scoped validation gate)

| Spec scenario (PRD) | Test `it(...)` name | File | Line | Status |
|---|---|---|---|---|
| §11.1 pt1 — only changed + dependent fields validate (not all) | `should NOT validate ALL fields when ONE field changes with autoSave` | autosave-validation.test.tsx | 101 | ✅ |
| §11.1 pt1 — dependent validate, independent do NOT | `should validate dependent fields but NOT independent fields` | autosave-validation.test.tsx | 163 | ✅ |
| §11.1 pt2 — wait for async validators before submitting | `should wait for async validators to complete before submitting` | autosave-validation.test.tsx | 218 | ✅ |
| §11.1 pt4 — **scoped gate: unrelated invalid field does NOT block a valid edit** (THE key regression guard, positive) | `should auto-save a valid field even when an unrelated field is invalid` | autosave-validation.test.tsx | 425 | ✅ |
| §11.1 pt4 — **scoped gate: CHANGED field invalid DOES block** (THE key regression guard, negative complement) | `should still NOT auto-save when the CHANGED field itself is invalid` | autosave-validation.test.tsx | 502 | ✅ |
| §11.1 pt3 — validation failure blocks submission | `should NOT submit if validation fails` | autosave-validation.test.tsx | 382 | ✅ |

> **Issue 2 regression guard confirmed:** BOTH its (@425 positive + @502 negative)
> are present and green. Together they prove the validity gate is scoped to the
> changed + dependent fields, NOT whole-form. This is THE guard for PRD §11.1 pt4.

### §11.2 — Implementation (executeAutoSave + changeField, execution-version abort)

| Spec scenario (PRD) | Test `it(...)` name | File | Line | Status |
|---|---|---|---|---|
| §11.2 — version checkpoint aborts stale save inside `waitForFieldValidation` | `should abort at version checkpoint inside waitForFieldValidation` | autosave-async-timing.test.tsx | 312 | ✅ |
| §11.2 — version re-checked at all three await checkpoints in `executeAutoSave` | `should check version at all three checkpoints in executeAutoSave` | autosave-async-timing.test.tsx | 393 | ✅ |
| §11.2 — stale auto-save ops aborted on rapid change (abort path) | `should abort intermediate auto-save operations` | autosave-rapid-changes.test.tsx | 137 | ✅ |
| §11.2 — version checkpoint aborts stale saves (rapid-change verification) | `should verify version checkpoint aborts stale saves` | autosave-rapid-changes.test.tsx | 396 | ✅ |

> **Execution-version coverage spans two files** (async-timing for the
> checkpoint-inside-validation path; rapid-changes for the rapid-change abort path)
> — as expected per the PRP gotcha.

### §11.3 — Debounce Behavior (per-field debounce + coalescing + immediate)

| Spec scenario (PRD) | Test `it(...)` name | File | Line | Status |
|---|---|---|---|---|
| §11.3 — per-field numeric debounce honored (no early submit) | `should NOT submit before the field's numeric debounce elapses (regression for Issue 1)` | autosave-field-debounce.test.tsx | 73 | ✅ |
| §11.3 — submits after exactly the field's numeric debounce | `should submit after exactly the field's numeric debounce` | autosave-field-debounce.test.tsx | 121 | ✅ |
| §11.3 — numeric debounce honored via Field `inputConfig` prop | `should honor a numeric debounce passed via the Field inputConfig prop` | autosave-field-debounce.test.tsx | 170 | ✅ |
| §11.3 — debounce resets within a single field | `should debounce (reset on each keystroke) within a single field` | autosave-field-debounce.test.tsx | 215 | ✅ |
| §11.3 Ex4 — coalescing: shared-interval fields coalesce into one submit | `should coalesce fields that share the same numeric debounce into one submit` | autosave-field-debounce.test.tsx | 267 | ✅ |
| §11.3 Ex4 — coalescing: **faster timer submits the whole batch; slower timer no-ops** (exact Example-4 proof) | `should let the faster debounce submit a coalesced batch; the slower timer no-ops` | autosave-field-debounce.test.tsx | 319 | ✅ |
| §11.3 Ex4 — coalescing: lone slow field fires on its own cadence | `should fire a lone slow field on its own longer cadence` | autosave-field-debounce.test.tsx | 381 | ✅ |
| §11.3 — mixed `debounce: false` + numeric: immediate submits while numeric pending | `should submit a debounce:false field immediately while a numeric-debounced field is still pending` | autosave-field-debounce.test.tsx | 434 | ✅ |
| §11.3 — mixed `debounce: false` + numeric: pending numeric coalesces into immediate submit | `should coalesce a pending numeric-debounced field into an immediate submit` | autosave-field-debounce.test.tsx | 499 | ✅ |
| §11.3 — form-level fallback when field debounce unset | `should fall back to the Form-level debounce when the field debounce is unset` | autosave-field-debounce.test.tsx | 555 | ✅ |
| §11.3 — immediate submission (`debounce: false`) | `should call submitHandler immediately when inputConfig.debounce is false` | autosave-validation.test.tsx | 543 | ✅ |
| §11.3 — immediate vs normal debounce contrast | `should contrast with normal debounce behavior` | autosave-validation.test.tsx | 593 | ✅ |

> **Coalescing Example-4 coverage confirmed:** all three sub-behaviors mapped
> (shared-timer coalesce @267, faster-submits-batch/slower-no-ops @319,
> lone-slow-field @381) — the @319 `it` is the exact Example-4 proof.

**Part A result: every §11.1–§11.3 spec scenario is covered by a named, passing test. No gaps.**

---

## Part B — Coverage Gate

**Command:** `pnpm test:coverage` (run from repo root — coverage resolves against
the workspace root per `vitest.workspace.ts`)
**Exit code:** `0` ✅ (hard gate passed; thresholds enforced, not advisory)

**Test results:**
- Test files: **36 passed (36)** ✅
- Tests: **971 passed | 6 skipped (977)** ✅
- Autosave tests (4 files): **43/43 passed** (21 + 10 + 4 + 8) ✅

**Coverage metrics (all four ≥ 90%):**

| Metric | Result | Threshold | Status | Baseline (arch audit) | Delta |
|---|---|---|---|---|---|
| statements | **97.25%** | 90 | ✅ ≥90 | 97.25% | 0.00 (no regression) |
| branches | **95.7%** | 90 | ✅ ≥90 | 95.7% | 0.00 (no regression) |
| functions | **98.16%** | 90 | ✅ ≥90 | 98.16% | 0.00 (no regression) |
| lines | **97.25%** | 90 | ✅ ≥90 | 97.25% | 0.00 (no regression) |

> **No regression** vs the architecture-audit baseline. All four metrics match
> the baseline exactly.

---

## Gate Config (`vitest.config.ts`) — confirmed real + correctly scoped

The thresholds block enforces a **hard CI gate** (exit 1 if any metric < 90):

```ts
// Hard gate — CI fails (exit 1) if any of these drop below 90%. PRD §1.3.7.
thresholds: {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
},
```

The exclude list matches PRD §1.3.7 (examples / svelte / vue / dist) **plus** the
documented `scripts/**` deviation:

```ts
exclude: [
  ...coverageConfigDefaults.exclude,
  // PRD §1.3.7 — out of scope: demo apps and stubbed adapters.
  "examples/**",
  "packages/svelte/**",
  "packages/vue/**",
  "**/dist/**",
  // ... documented deviation:
  "scripts/**",
],
```

> **`scripts/**` deviation confirmed intentional + still documented in the config
> comments** (release automation — `scripts/release.mjs` is a one-off
> semantic-release driver with no unit tests; counting it would be noise). This
> is NOT a gap; do not remove it.

`vitest.workspace.ts` confirms coverage is collected repo-wide across both
projects:

```ts
export default defineWorkspace([
  "packages/core/vitest.config.ts",
  "packages/react/vitest.config.ts",
]);
```

---

## Files Modified

**None.** This was a read-only audit — no gap or regression was found.

```
$ git diff --exit-code packages/ vitest.config.ts vitest.workspace.ts
# exit 0 — clean (no changes)
```

The only new artifact is this audit record
(`plan/004_8583c4771a2e/P1M1T1S2/audit-record.md`).

---

## Conclusion

✅ **No drift.** All 43 auto-save tests pass; every §11.1–§11.3 spec scenario maps
to a named, passing test. The key regression guards are all confirmed present
and green:

- **Unrelated Invalid Field (Issue 2)** — scoped-gate guard, both its positive
  (@425) and negative (@502) assertions.
- **Coalescing** semantics — all three Example-4 sub-behaviors, including the
  exact proof @319 (faster timer submits batch; slower timer no-ops).
- **Version Checkpoint** abort — across both async-timing (@312, @393) and
  rapid-changes (@137, @396) files.
- **Immediate** submission (`debounce: false`) — @543 (+ contrast @593).
- Form-level **fallback** — @555.

The coverage gate is green at 97.25% / 95.7% / 98.16% / 97.25% — exactly matching
the architecture-audit baseline with no regression, and the 90% threshold is a
real, correctly-scoped hard gate.

**This audit record gates P1.M1.T2.S1 (doc sweep): docs may now be edited to
describe test-backed, coverage-passing reality.**
