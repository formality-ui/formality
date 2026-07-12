# P1.M1.T2.S1 — isDisabled Hygiene Verification Record

**Subtask**: Remove diagnostic probe files and skip failing `isDisabled` tests
with documentation (the hygiene half of bug-fix Issue 2, PRD §1.3.7 / build
integrity).

**Verification type**: Verify-and-confirm (the hygiene work was expected to be
already committed at `1863b44`).

---

## Outcome

**No drift — hygiene already complete (committed at `1863b44`).**

The repository HEAD is past the PRD's reference commit (`8e3fd4c`). At the
current HEAD, commit `1863b44 test(react): skip out-of-scope failing isDisabled
tests; remove diagnostic probes` already:

1. Removed both probe files (`_tmp_isdisabled_probe.test.tsx`,
   `_tmp_isdisabled_probe2.test.tsx`).
2. Changed the 5 failing `isDisabled` tests to `it.skip(...)` with multi-line
   `KNOWN LIMITATION` comments (Field.test.tsx lines 1132, 1172, 1226, 1308,
   1356).

No Task-4 (conditional fix) was required. No source/runtime files were touched.

---

## Probe-file check (repo-wide)

```text
$ find packages -name '*_tmp_*' -o -name '*probe*' | grep -v node_modules
(no output — no matches)

$ git ls-files packages/react/src/__tests__ | grep -i probe
(no output — probes not tracked at HEAD)

$ ls packages/react/src/__tests__/_tmp_isdisabled_probe*.test.tsx 2>&1
ls: cannot access '.../_tmp_isdisabled_probe*.test.tsx': No such file or directory
```

**Result:** ✓ No `_tmp_isdisabled_probe*.test.tsx`, no `*_tmp_*`, no `*probe*`
diagnostic scratch files exist anywhere under `packages/`.

---

## Skip check — the 5 isDisabled contract tests

```text
$ grep -nE "it\.skip\(" packages/react/src/__tests__/Field.test.tsx
1132:    it.skip("should reference isDisabled matcher from other field", () => {
1172:    it.skip("should handle circular dependencies without infinite loops", async () => {
1226:      it.skip("should disable result when both source fields are disabled", () => {
1308:      it.skip("should re-evaluate when source field disabled states change", async () => {
1356:      it.skip("should work with field state matchers in object when", () => {
```

| Test | Line | `it.skip` ✓ | Comment has 3 root-causes ✓ |
|---|---|---|---|
| should reference isDisabled matcher from other field | 1132 | ✓ | ✓ (full multi-line comment) |
| should handle circular dependencies without infinite loops | 1172 | ✓ | ✓ (full multi-line comment) |
| should disable result when both source fields are disabled | 1226 | ✓ | ✓ (full multi-line comment) |
| should re-evaluate when source field disabled states change | 1308 | ✓ | ✓ ("Same as above" → refs @1226 full comment) |
| should work with field state matchers in object when | 1356 | ✓ | ✓ ("Same as above" → refs @1226 full comment) |

**Root-cause point coverage** (verified by reading lines 1100–1360):
- (1) **isDisabled matcher is core-only / doesn't work in React adapter** —
  documented in the comments (the matcher requires two-pass evaluation with
  `allFieldsConfig` and reads `fieldState?.disabled`).
- (2) **config-level / JSX-prop `disabled` not propagated into `fieldStates`** —
  explicitly stated (e.g. @1226: "the React integration has a limitation where
  config-level disabled states are not included in the fieldStates used for
  condition evaluation"; @1308/@1356: "JSX prop disabled not propagated to
  fieldStates" / "config-level disabled not propagated to fieldStates").
- (3) **adding `disabled` to `fieldStates` creates circular re-render
  dependencies** — stated at @1132 ("creates circular watch dependencies that
  cause infinite re-renders") and @1172 (circular watch dependency explanation).

Root-cause comment content keyword density:
```text
$ sed -n '1100,1360p' packages/react/src/__tests__/Field.test.tsx | grep -ciE "KNOWN LIMITATION|circular|fieldStates|disabled"
78
$ sed -n '1100,1360p' packages/react/src/__tests__/Field.test.tsx | grep -c "KNOWN LIMITATION"
6
```

**Active passing tests confirmed NOT skipped:**
- @1271 `it("should not disable result when only one source field is disabled")` —
  active `it()` (passes today; valid negative-case guard). ✓
- @1392 `describe("multi-field isDisabled with mixed matchers")` — all 5 inner
  tests are active `it()` and passing. ✓

**Result:** ✓ All 5 contract tests are `it.skip(...)` with complete `KNOWN
LIMITATION` comments; no active passing test was wrongly skipped.

---

## Test-run results

### Field.test.tsx (isolated)

```text
$ npx vitest run packages/react/src/__tests__/Field.test.tsx
 ✓ |@formality-ui/react| src/__tests__/Field.test.tsx (75 tests | 5 skipped) 446ms
 Test Files  1 passed (1)
      Tests  70 passed | 5 skipped (75)
```

**Result:** ✓ **70 passed | 5 skipped (75), 0 failed** — matches the contract
exactly.

### Full suite

```text
$ npx vitest run
 Test Files  37 passed (37)
      Tests  989 passed | 5 skipped (994)
```

**Result:** ✓ **0 failed**; the only skips are the 5 intentional `it.skip`
tests in Field.test.tsx.

### Coverage gate (PRD §1.3.7 — ≥90% on all four metrics)

```text
$ pnpm test:coverage  (exit 0)
All files | 97.29 | 95.77 | 99.1 | 97.29 |
            ^ stmts ^ br   ^ fn  ^ lines
```

| Metric | Result | Gate (≥90%) |
|---|---|---|
| Statements | 97.29% | ✓ |
| Branches | 95.77% | ✓ |
| Functions | 99.1% | ✓ |
| Lines | 97.29% | ✓ |

**Result:** ✓ Coverage gate unaffected by the 5 skips (the `isDisabled`
evaluation paths live in `@formality-ui/core`'s `evaluate.ts`, which has its
own passing unit tests).

---

## Git status — clean (green state committed)

```text
$ git status --short
 M plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/tasks.json   (orchestrator-owned; not this subtask)
?? .../P1M1T2S1/   (this subtask's directory — contains this record)
?? .../P1M1T2S2/   (sibling subtask directory — not this subtask)
```

No uncommitted masks on any source/test file. The green state is committed
(`1863b44`); this subtask introduces no implementation-file changes.

### Scope-leak check (runtime / root-cause / sibling files untouched)

```text
$ git diff --exit-code \
    packages/react/src/components/Form.tsx \
    packages/react/src/hooks/useFieldDisabledState.ts \
    packages/core/src/conditions/evaluate.ts
exit 0   ✓ (READ-ONLY root-cause/runtime files untouched)

$ git diff --exit-code packages/react/src/__tests__/autosave-submit-immediate.test.tsx
exit 0   ✓ (P1.M1.T1.S2's file untouched)
```

**Result:** ✓ No runtime source edits; no feature-fix scope leak; no overlap
with the concurrent P1.M1.T1.S2 subtask.

---

## Summary against the contract

| Contract clause | Status |
|---|---|
| (a) No probe files (`_tmp_isdisabled_probe*.test.tsx`, `*_tmp_*`, `*probe*`) | ✓ confirmed absent |
| (b) 5 isDisabled tests are `it.skip(...)` with KNOWN LIMITATION comments | ✓ confirmed @1132/1172/1226/1308/1356 |
| (c) `npx vitest run` green (0 failed; only intentional skips) | ✓ 989 passed | 5 skipped, 0 failed |
| (d) Green state is COMMITTED (`git status` clean of source masks) | ✓ committed at `1863b44` |
| Coverage gate ≥90% unaffected by skips | ✓ 97.29 / 95.77 / 99.1 / 97.29 |
| No runtime/root-cause source modified | ✓ Form.tsx / useFieldDisabledState.ts / evaluate.ts untouched |
| No known-issues doc created (that's S2) | ✓ not created |
| No CHANGELOG/README edits (that's P1.M3.T1) | ✓ not edited |

**Downstream note for P1.M1.T2.S2:** The `KNOWN LIMITATION` comments at
Field.test.tsx:1132/1172/1226 (full multi-line) and 1308/1356 (shorthand
"Same as above" referencing @1226) are the source-of-truth for the project-level
known-issues document. The full root-cause points are most completely stated at
@1226 (config-level disabled not propagated into fieldStates) and @1132/@1172
(circular re-render dependency risk). S2 should reference these comments when
authoring the project-level tracking doc.
