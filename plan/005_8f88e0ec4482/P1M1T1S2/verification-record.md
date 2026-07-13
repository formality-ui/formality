# P1.M1.T1.S2 — Backwards-Compatibility & Full-Suite Verification

## Outcome: ✅ backwards-compatible, zero regressions

P1.M1.T1.S1's relocation of the three ordering functions
(`sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields`) from
`labels/resolve.ts` to `config/ordering.ts` is **provably transparent**:
every import path resolves to the same function identity, the sole consumer
(`UnusedFields.tsx`) is unaffected, the full test suite is green, the
typecheck project-references resolve end-to-end, both packages build, the
≥90% coverage gate holds, and lint is clean.

**S2 made ZERO source edits.** Task 6 (conditional chain fix) did **not**
fire — S1 produced a complete, correct re-export chain.

---

## Re-export chain confirmation

| Import path | Resolves via | Status |
|---|---|---|
| `@formality-ui/core` (root barrel) | `index.ts` → `labels/index.ts` → `labels/resolve.ts` → `config/ordering.ts` | ✅ resolves |
| `@formality-ui/core/labels` | `labels/index.ts` → `labels/resolve.ts` → `config/ordering.ts` | ✅ resolves |
| `@formality-ui/core/config` (NEW canonical) | `config/index.ts` → `config/ordering.ts` | ✅ resolves |

All three paths resolve to the **same function identity** (single definition site).

### Grep evidence (Level 1)

```text
# Definitions live ONLY in config/ordering.ts (no duplicate in resolve.ts)
$ grep -rnE "export function (sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields)" packages/core/src/
packages/core/src/config/ordering.ts:20:export function sortFieldsByOrder(
packages/core/src/config/ordering.ts:40:export function getUnusedFields(
packages/core/src/config/ordering.ts:57:export function getOrderedUnusedFields(
→ EXACTLY 3 matches, ALL in config/ordering.ts; ZERO in labels/resolve.ts ✅

# resolve.ts re-exports them (bodies replaced — no duplicate definition)
$ grep -n "from \"../config/ordering\"" packages/core/src/labels/resolve.ts
179:} from "../config/ordering";
→ exactly ONE match (lines 175-179 re-export block) ✅

# resolve.ts has NO leftover function bodies (duplicate-definition check)
$ grep -nE "export function (sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields)" packages/core/src/labels/resolve.ts
→ NONE (correct — bodies removed by S1) ✅

# config barrel exposes the new canonical path
$ grep -n "ordering" packages/core/src/config/index.ts
25:} from "./ordering";
→ export block present (lines 23-25) ✅

# Anchors unchanged — root barrel
$ grep -nE "sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields" packages/core/src/index.ts
142:  sortFieldsByOrder,
143:  getUnusedFields,
144:  getOrderedUnusedFields,
→ root "Labels & Ordering" block still re-exports from "./labels" ✅

# Anchors unchanged — labels barrel
$ grep -nE "sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields" packages/core/src/labels/index.ts
10:  sortFieldsByOrder,
11:  getUnusedFields,
12:  getOrderedUnusedFields,
→ labels/index.ts still re-exports from "./resolve" ✅
```

**Note on `FieldConfig`:** `labels/resolve.ts:5` still imports
`import type { FieldConfig }` and uses it at line 67 (`fieldConfig?: FieldConfig`).
This is NOT an unused import — eslint correctly flags nothing.

---

## Gate results

| Gate | Command | Result |
|---|---|---|
| Core build | `pnpm --filter @formality-ui/core build` | ✅ green (tsup ESM+CJS+DTS) |
| Core test | `pnpm --filter @formality-ui/core test` | ✅ **592 passed** (10 files) |
| React build | `pnpm --filter @formality-ui/react build` | ✅ green (tsup ESM+CJS+DTS) |
| React test | `pnpm --filter @formality-ui/react test` | ✅ **411 passed, 5 skipped** (28 files) |
| Typecheck | `pnpm typecheck` (`tsc --build`) | ✅ green (exit 0, no errors) |
| Full suite | `pnpm test` | ✅ **1003 passed, 5 skipped** (38 files) |
| Coverage | `pnpm test:coverage` (≥90% gate, PRD §1.3.7) | ✅ all four ≥90% (see below) |
| Lint | `pnpm lint` | ✅ **0 errors** (64 pre-existing `no-explicit-any` warnings, none in chain files) |

### Coverage metrics (the four numbers)

```text
All files  |  stmt 97.21 |  branch 94.57 |  func 99.11 |  line 97.21 |
```

All four metrics ≥ 90% — coverage gate **passed**. Critically:

- `config/ordering.ts`: **100 / 100 / 100 / 100** — the relocated functions are fully covered (same `labels.test.ts` lines now cover code in `ordering.ts` instead of `resolve.ts`; no body divergence).
- `labels/resolve.ts`: **100 / 100 / 100 / 100** — the re-export is exercised.
- No coverage drop → **no function body diverged during the move** (S1's relocation is byte-for-byte transparent).

### Build order verification

Core was built **before** react (`pnpm --filter @formality-ui/core build` →
then `pnpm --filter @formality-ui/react build`), so the react build resolved
against a fresh core `dist/`. No stale-dist false result.

---

## Critical guards

| Guard | Role | Result |
|---|---|---|
| `labels.test.ts` | Regression guard — imports the 3 fns via root barrel; 29 tests | ✅ **29 passed** (unchanged) |
| `framework-independence.test.ts` | Proves core has zero framework imports; 14 tests | ✅ **14 passed** (no React/vue/svelte leak in `config/ordering.ts`) |
| `UnusedFields.tsx` | Sole external consumer — imports `sortFieldsByOrder` from `@formality-ui/core` | ✅ react build + test green (100% coverage on `UnusedFields.tsx`) |

---

## Scope verification (Level 5)

```text
$ git diff --stat -- packages/   # unstaged working-tree changes from S2
(empty)

$ git diff --exit-code packages/core/src/__tests__/labels.test.ts \
    packages/react/src/components/UnusedFields.tsx \
    packages/core/src/index.ts \
    packages/core/src/labels/index.ts
exit 0   # all four anchors/guards untouched
```

- **S2 source edits: NONE.** The `git status` entries for
  `config/ordering.ts` (A), `config/index.ts` (M), and `labels/resolve.ts` (M)
  are **S1's staged work**, present before S2 began. S2 introduced no new
  changes to any source file.
- **Regression guards untouched:** `labels.test.ts`, `UnusedFields.tsx`,
  root `index.ts`, `labels/index.ts` — all confirmed unmodified.
- **No edits to:** function bodies/signatures/behavior, tests, react source,
  `merge.ts`, `defaults.ts`. Task 6 did not fire.

---

## Certification

This record certifies that **`config/ordering.ts` is the canonical location**
for `sortFieldsByOrder`, `getUnusedFields`, and `getOrderedUnusedFields`, and
that the relocation is **backwards-compatible with zero regressions**.

**Downstream consumer — P3.M1.T1.S1 (core spec audit):** may proceed treating
`config/ordering.ts` as canonical. All three import paths (root barrel,
`/labels`, `/config`) resolve to the same function identity; the public API
surface is unchanged.
