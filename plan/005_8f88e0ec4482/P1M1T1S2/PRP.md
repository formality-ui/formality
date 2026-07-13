name: "P1.M1.T1.S2 — Verify backwards compatibility and full test suite after ordering relocation"
description: |

---

## Goal

**Feature Goal**: Confirm that P1.M1.T1.S1's relocation of the three ordering
functions (`sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields`)
from `labels/resolve.ts` to `config/ordering.ts` is **backwards-compatible**
and introduces **zero regressions**: every import path still resolves, the
sole consumer (`UnusedFields.tsx`) is unaffected, the full test suite is
green, the typecheck project-references resolve, and both packages build.

**Deliverable**: A **verification record** (markdown) capturing:
(a) confirmation that all three import paths (`@formality-ui/core` root barrel,
`@formality-ui/core/labels`, `@formality-ui/core/config`) resolve to the moved
functions; (b) green results for `pnpm typecheck`, core build+test, react
build+test, full suite, coverage gate, and lint; (c) the test counts observed
(core framework-independence = 14 tests, labels.test.ts = the regression
guard, full suite ≈ 1003+). Fix the re-export chain ONLY if an import breaks
(no behavioral change).

**Success Definition**:
1. `pnpm --filter @formality-ui/core build` then `pnpm --filter @formality-ui/core test` green — especially `labels.test.ts` (the regression guard that imports the 3 fns via the root barrel) and `framework-independence.test.ts` (14 tests — proves no React import leaked into core).
2. `pnpm --filter @formality-ui/react build && pnpm --filter @formality-ui/react test` green — `UnusedFields.tsx` (the sole consumer, importing `sortFieldsByOrder` from `@formality-ui/core`) unaffected.
3. `pnpm typecheck` green — root `tsc --build` project references (core + react) resolve the re-export chain end-to-end.
4. `pnpm test` green (full suite, ≈1003+ tests); `pnpm test:coverage` green (≥90% gate, PRD §1.3.7); `pnpm lint` clean.
5. If any import breaks, the fix is confined to the re-export chain (`config/index.ts` / `labels/resolve.ts` / `labels/index.ts` / root `index.ts`) — NO behavioral change, NO test edits, NO react edits.

## User Persona

**Target User**: The Formality maintainer releasing v1.0 (P3). This is an
internal verification gate, not an end-user feature.

**Use Case**: After S1 relocates the ordering functions, run this verification
to prove the refactor is truly transparent before the next architecture-audit
task (P3.M1.T1.S1) treats `config/ordering.ts` as the canonical location.

**Pain Points Addressed**: A botched relocation (broken re-export, duplicate
definition, dropped barrel entry) would silently break consumers or the
build. This subtask is the safety net that catches it before merge.

## Why

- **Business value**: A relocation refactor is only safe if it's provably
  transparent. This verification is the cheap insurance that S1 didn't
  introduce a broken import, a duplicate symbol, or a dropped export.
- **Integration**: S1 ships the relocation (new `config/ordering.ts`,
  `labels/resolve.ts` re-exports, `config/index.ts` barrel update). S2 (this)
  is the **verification gate** that confirms S1's work is complete and
  transparent. Downstream P3.M1.T1.S1 (core spec audit) assumes
  `config/ordering.ts` exists and is canonical by then — S2 is what certifies
  that assumption.
- **Scope boundary**: READ-ONLY verification by default. Touch ONLY the
  re-export chain if an import genuinely breaks. Do NOT change function
  bodies/signatures/behavior (S1's contract), do NOT edit tests, do NOT touch
  react source, do NOT touch merge.ts/defaults.ts.

## What

### The re-export chain S1 produces (the contract S2 verifies)

After S1, this chain must resolve end-to-end:

```
packages/core/src/index.ts (root barrel — UNCHANGED by S1)
  └─ "Labels & Ordering" block (~line 133) exports the 3 fns from "./labels"
       └─ packages/core/src/labels/index.ts (UNCHANGED)
            └─ re-exports the 3 fns from "./resolve" (~lines 10-12)
                 └─ packages/core/src/labels/resolve.ts (MODIFIED by S1)
                      └─ `export { ... } from "../config/ordering"` (~line 179)
                           └─ packages/core/src/config/ordering.ts (NEW — canonical home, 3 fn definitions)
```

Plus a NEW direct path S1 adds:
```
packages/core/src/config/index.ts (MODIFIED by S1)
  └─ `export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "./ordering"`
```

### The three import paths that MUST all resolve (backwards compat)

1. **Root barrel** — `import { sortFieldsByOrder } from "@formality-ui/core"`
   (used by `UnusedFields.tsx:5` and `labels.test.ts`).
2. **Labels subpath** — `import { ... } from "@formality-ui/core/labels"`
   (any consumer using the labels subpath; resolved via `labels/index.ts`).
3. **Config subpath** — `import { ... } from "@formality-ui/core/config"`
   (NEW canonical path; resolved via `config/index.ts`).

All three must resolve to the SAME function identity.

### The critical guards

- **`labels.test.ts`** (the regression guard): imports the 3 fns via the root
  barrel; must pass UNCHANGED. If it fails, the re-export chain is broken.
- **`framework-independence.test.ts`** (14 tests): proves core has zero
  framework imports. The new `config/ordering.ts` must not introduce any.
- **`UnusedFields.tsx`**: sole external consumer; imports `sortFieldsByOrder`
  from `@formality-ui/core`. The react build + test must stay green.

### Success Criteria

- [ ] `pnpm --filter @formality-ui/core build` green; `pnpm --filter @formality-ui/core test` green (labels + framework-independence pass).
- [ ] `pnpm --filter @formality-ui/react build` green; `pnpm --filter @formality-ui/react test` green (UnusedFields unaffected).
- [ ] `pnpm typecheck` green (root tsc --build — project refs resolve the chain).
- [ ] `pnpm test` green (full suite, ≈1003+ tests); `pnpm test:coverage` green (≥90%); `pnpm lint` clean.
- [ ] All three import paths resolve to the same function identity (verified via grep + typecheck + tests).
- [ ] No behavioral change, no test edits, no react source edits (unless an import broke, in which case only the re-export chain is fixed).

## All Needed Context

### Context Completeness Check

_Pass._ This is a verification subtask. The S1 PRP fully specifies the
relocation + re-export chain, and live-source research during PRP authorship
confirmed the current state (see "Known Gotchas" — S1 is partially in-flight:
`config/ordering.ts` already exists with the 3 definitions, `labels/resolve.ts`
already has the re-export at line 179, but `config/index.ts` barrel update may
not be complete). The implementing agent re-confirms the chain at execution
time and runs the gates.

### Documentation & References

```yaml
# MUST READ
- url: PRD §1.3.7 (heading:h4.6) — Testing Strategy (the ≥90% coverage gate)
  why: S2 must confirm the coverage gate stays green after the relocation.
  critical: "the build fails if any metric drops below 90%." Run `pnpm test:coverage`.

- url: PRD §1.3.1/§1.3.2 (heading:h4.0/h3.2) — Package Structure + "What Belongs in core"
  why: The structural requirement S1 satisfies (config/ordering.ts canonical). S2 confirms it's reachable via the config barrel.
  critical: §1.3.2 table lists `config/ordering → sortFieldsByOrder(fields, config)` as mandated.

- docfile: plan/005_8f88e0ec4482/P1M1T1S1/PRP.md
  why: THE CONTRACT. S1's PRP defines exactly what relocation + re-export chain S2 must verify. Treat it as the source of truth for the expected end state.
  section: "What → The re-export chain after the move" + "Success Criteria" + "Validation Loop"
  critical: "index.ts (UNCHANGED) → labels/index.ts (UNCHANGED) → labels/resolve.ts (re-export from ../config/ordering) → config/ordering.ts (NEW). Plus config/index.ts adds the ordering block."

- file: packages/core/src/config/ordering.ts
  why: CONFIRM it exists (S1's deliverable) and exports the 3 fns. Re-locate via grep (lines drift).
  pattern: "export function sortFieldsByOrder(...) / getUnusedFields(...) / getOrderedUnusedFields(...)"
  gotcha: "Live research found this file ALREADY EXISTS with the 3 definitions. If it's MISSING at execution time, S1 hasn't run — STOP and flag."

- file: packages/core/src/labels/resolve.ts
  section: "the re-export block (~line 179: `from \"../config/ordering\"`) + confirm NO `export function sortFieldsByOrder...` remains (bodies removed)"
  why: CONFIRM S1 replaced the bodies with a re-export. A DUPLICATE definition (bodies still present AND re-exported) is a compile error.
  pattern: "export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from \"../config/ordering\";"
  gotcha: "Live research found the re-export ALREADY present at line 179. VERIFY the function DEFINITIONS (old lines 180-220) are REMOVED — if both exist, tsc fails with a duplicate identifier. If the old FieldConfig import is now unused, confirm it was removed (eslint no-unused-vars)."

- file: packages/core/src/config/index.ts
  why: CONFIRM S1 added the ordering re-export block. Live research found it does NOT yet have one (only merge + defaults blocks present) — so this is the most likely incomplete step.
  pattern: "export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from \"./ordering\";"
  gotcha: "If this block is MISSING, the `@formality-ui/core/config` subpath won't resolve the ordering fns. That's the gap S2 catches and (per contract) fixes by adding the block."

- file: packages/core/src/labels/index.ts
  section: "lines 10-12 (re-export the 3 fns from './resolve')"
  why: CONFIRM UNCHANGED (backwards-compat anchor). It must still point at './resolve', which now forwards to ../config/ordering.
  gotcha: "Do NOT edit labels/index.ts. If it's missing the 3 fns, that's a regression — but S1's contract says it stays unchanged."

- file: packages/core/src/index.ts
  section: "'Labels & Ordering' block (~line 133); the 3 fns at ~142-144 re-exported from './labels'"
  why: CONFIRM UNCHANGED (root barrel — public API). The 3 fns must still be exported from the root.
  gotcha: "Do NOT edit the root index.ts. If the 3 fns are missing here, the public API broke — flag it (don't silently repoint)."

- file: packages/react/src/components/UnusedFields.tsx
  section: "line 5 (`import { sortFieldsByOrder } from '@formality-ui/core'`); line 59 usage"
  why: THE sole external consumer. CONFIRM it's UNCHANGED and still resolves via the root barrel.
  pattern: "import { sortFieldsByOrder } from \"@formality-ui/core\";"
  gotcha: "Do NOT edit UnusedFields.tsx. If the react build/test fails on it, the root barrel re-export chain is broken — fix the chain, not the consumer."

- file: packages/core/src/__tests__/labels.test.ts
  section: "imports the 3 fns (via root barrel or ../index); 29 it/test declarations"
  why: THE regression guard. Must pass UNCHANGED. Live research confirmed 29 tests.
  gotcha: "If labels.test.ts fails, the re-export chain is broken. Do NOT edit the test — fix the chain."

- file: packages/core/src/__tests__/framework-independence.test.ts
  section: "14 it/test declarations — asserts core has zero framework imports"
  why: Proves the new config/ordering.ts didn't leak a React/vue/svelte import. Live research confirmed 14 tests.
  gotcha: "If this fails, ordering.ts (or resolve.ts) accidentally imported a framework module. That's a real regression — flag it."
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
  config/
    ordering.ts        # S1's NEW canonical home — VERIFY exists + exports 3 fns
    index.ts           # S1's barrel update — VERIFY ordering re-export block present
    merge.ts           # unchanged
    defaults.ts        # unchanged
  labels/
    resolve.ts         # S1's body→re-export swap — VERIFY bodies gone, re-export from ../config/ordering present
    index.ts           # UNCHANGED anchor — verify still re-exports from ./resolve
  index.ts             # UNCHANGED anchor — verify still re-exports from ./labels (root barrel)
  __tests__/
    labels.test.ts               # regression guard (29 tests) — must pass unchanged
    framework-independence.test.ts  # 14 tests — must pass (no framework import leaked)
packages/react/src/components/
  UnusedFields.tsx     # sole consumer (imports via root barrel) — must build+test green
```

### Desired Codebase tree with files to be added

```bash
# NO new files. S2 is verification-only. The ONLY edit (conditional) is to the
# re-export chain if an import breaks:
#   - packages/core/src/config/index.ts  (add ordering block if missing)
#   - packages/core/src/labels/resolve.ts (fix re-export path if wrong)
# Everything else is read-only verification + a verification record.
plan/005_8f88e0ec4482/P1M1T1S2/
  verification-record.md   # NEW — the deliverable (green-gate evidence + chain confirmation)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: S1 is likely IN-FLIGHT when S2 runs (parallel execution). Live research
// at PRP authorship found:
//   - config/ordering.ts ALREADY EXISTS with the 3 fn definitions ✓
//   - labels/resolve.ts ALREADY has the re-export at line 179 ✓
//   - config/index.ts does NOT yet have the ordering re-export block ✗ (likely incomplete)
// So S2's first job is to confirm S1 FINISHED: all 4 pieces present (new file,
// resolve.ts re-export + bodies removed, config/index.ts barrel block, anchors unchanged).
// If S1 is incomplete, run the gates anyway — tsc/vitest will surface the break — then
// fix ONLY the missing re-export chain piece.

// CRITICAL: A DUPLICATE DEFINITION is the #1 failure mode. If labels/resolve.ts still
// has `export function sortFieldsByOrder` (the old body) AND the `export { ... } from
// "../config/ordering"` re-export, tsc fails with "Duplicate identifier". S1 must have
// REMOVED the bodies. Verify: grep for `export function (sortFieldsByOrder|getUnusedFields|
// getOrderedUnusedFields)` in resolve.ts → expect ZERO matches.

// CRITICAL: The re-export chain is the whole point. Three paths must resolve:
//   1. "@formality-ui/core" (root) → index.ts → labels/index.ts → resolve.ts → config/ordering.ts
//   2. "@formality-ui/core/labels" → labels/index.ts → resolve.ts → config/ordering.ts
//   3. "@formality-ui/core/config" → config/index.ts → ordering.ts
// If config/index.ts lacks the ordering block, path 3 breaks (the NEW canonical path).
// The root + labels paths keep working via the resolve.ts re-export regardless.

// GOTCHA: The root index.ts "Labels & Ordering" block (~line 133) must stay pointing at
// "./labels" — NOT repointed to "./config". S1's contract says unchanged. If someone
// repointed it, the public grouping comment drifts. Flag it.

// GOTCHA: `pnpm typecheck` is `tsc --build` with project references (core + react). It
// resolves the re-export chain across packages — this is the strongest single check that
// UnusedFields.tsx (react) still resolves the moved fn via the root barrel. Run it.

// GOTCHA: The order of operations matters for the build verification:
//   1. `pnpm --filter @formality-ui/core build` FIRST (emits core dist/)
//   2. THEN `pnpm --filter @formality-ui/react build` (resolves against the freshly built core)
//   If react build is run against a STALE core dist/, it may falsely pass or fail. Always
//   build core first. (The react package depends on @formality-ui/core via workspace link.)

// GOTCHA: labels.test.ts is the regression guard — it imports the 3 fns via the root barrel
// (or ../index). If it fails, DO NOT edit the test; the chain is broken upstream. Fix the chain.

// GOTCHA: framework-independence.test.ts (14 tests) scans core source for framework imports.
// The new config/ordering.ts must have ZERO framework imports (it only imports
// `FieldConfig` from ../types). If this test fails, ordering.ts leaked an import.

// GOTCHA: This is a VERIFICATION subtask. The default outcome is "all green, chain resolves,
// no edits needed." Edits are the EXCEPTION — only if a re-export is genuinely missing/wrong,
// and only to the chain files (config/index.ts, labels/resolve.ts). Never to function bodies,
// tests, react source, merge.ts, or defaults.ts.

// GOTCHA: Coverage (≥90% gate) should be UNCHANGED by the relocation — the same labels.test.ts
// lines now cover code in ordering.ts instead of resolve.ts. If coverage drops, a function
// body diverged during the move (S1 bug) — flag it, don't silently re-add coverage.
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is a verification subtask. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CONFIRM S1's relocation is complete (read-only state check)
  - GREP definitions: `grep -rnE "export function (sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields)" packages/core/src/`
    → expect EXACTLY 3 matches, ALL in config/ordering.ts; ZERO in labels/resolve.ts.
  - GREP re-export in resolve.ts: `grep -n "from \"../config/ordering\"" packages/core/src/labels/resolve.ts`
    → expect exactly ONE match.
  - GREP config barrel: `grep -n "ordering" packages/core/src/config/index.ts`
    → expect an export block from "./ordering". (If missing → Task 6 fix.)
  - GREP anchors unchanged: confirm root index.ts (~142-144) + labels/index.ts (10-12) still re-export the 3 fns.
  - WHY: Detect whether S1 finished before running gates. If incomplete, the gates will fail predictably.

Task 2: CORE build + test
  - RUN: `pnpm --filter @formality-ui/core build` (tsup — confirms ordering.ts compiles into dist).
  - RUN: `pnpm --filter @formality-ui/core test` (full core suite).
  - CONFIRM specifically: `labels.test.ts` passes (regression guard); `framework-independence.test.ts` passes (14 tests, no framework leak).
  - RECORD: core test count + pass/fail.
  - IF labels.test.ts fails → the re-export chain is broken; proceed to Task 6.

Task 3: REACT build + test (consumer verification)
  - RUN: `pnpm --filter @formality-ui/react build` (AFTER core build — resolves against fresh core dist).
  - RUN: `pnpm --filter @formality-ui/react test` (full react suite).
  - CONFIRM: UnusedFields.tsx still resolves `sortFieldsByOrder` from "@formality-ui/core"; no test regression.
  - RECORD: react test count + pass/fail.
  - IF react build fails on UnusedFields.tsx → root barrel chain broken; proceed to Task 6.

Task 4: ROOT typecheck (project references)
  - RUN: `pnpm typecheck` (root `tsc --build` — core + react project refs).
  - CONFIRM: the re-export chain resolves end-to-end across packages; no "Cannot find module" / "has no exported member" errors.
  - IF typecheck fails → chain broken; proceed to Task 6.

Task 5: FULL suite + coverage gate + lint
  - RUN: `pnpm test` (full repo suite — confirm ≈1003+ tests, no regressions).
  - RUN: `pnpm test:coverage` (≥90% gate per PRD §1.3.7; record all four metrics).
  - RUN: `pnpm lint` (0 errors — especially no unused-import in resolve.ts after S1 removed the fns).
  - RECORD: full-suite test count, coverage numbers, lint result.
  - EXPECT: all green. If coverage dropped, a fn body diverged during the move — flag it.

Task 6 (CONDITIONAL — only if an import broke): FIX the re-export chain
  - IF config/index.ts lacks the ordering block → ADD: `export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "./ordering";`
  - IF resolve.ts has BOTH the old bodies AND the re-export (duplicate) → REMOVE the old function definitions (S1 should have done this).
  - IF resolve.ts has an unused `import type { FieldConfig }` after the bodies were removed → REMOVE it (eslint no-unused-vars).
  - DO NOT: change function bodies/signatures/behavior; edit tests; edit react source; touch merge.ts/defaults.ts; repoint root index.ts or labels/index.ts.
  - RE-RUN Tasks 2-5 after the fix.
  - (Expected outcome: Task 6 does NOT fire — S1 should have produced a complete chain.)

Task 7: WRITE the verification record (the deliverable)
  - CREATE plan/005_8f88e0ec4482/P1M1T1S2/verification-record.md.
  - INCLUDE:
      (a) Chain confirmation: the 3 import paths + grep evidence that each resolves.
      (b) Gate results: core build/test, react build/test, typecheck, full suite (count), coverage (4 metrics), lint — each PASS/FAIL.
      (c) Specific test results: labels.test.ts (regression guard), framework-independence.test.ts (14 tests), UnusedFields.tsx consumer.
      (d) Outcome: "backwards-compatible, zero regressions" OR "GAP: <what broke>, fixed by <chain edit>".
  - THE RECORD certifies P3.M1.T1.S1 can treat config/ordering.ts as canonical.
```

### Implementation Patterns & Key Details

```typescript
// Verification-record layout (Task 7) — the deliverable:

// # P1.M1.T1.S2 — Backwards-Compatibility & Full-Suite Verification
//
// ## Outcome: backwards-compatible, zero regressions   (or: GAP FOUND + fix applied)
//
// ## Re-export chain confirmation
//
// | Import path | Resolves via | Status |
// |---|---|---|
// | `@formality-ui/core` (root) | index.ts → labels → resolve → config/ordering | ✅ |
// | `@formality-ui/core/labels` | labels/index.ts → resolve → config/ordering | ✅ |
// | `@formality-ui/core/config` | config/index.ts → ordering | ✅ |
//
// Grep evidence:
//   definitions: 3 matches in config/ordering.ts, 0 in labels/resolve.ts ✅
//   resolve.ts re-export: `from "../config/ordering"` (1 match) ✅
//   config/index.ts barrel: ordering block present ✅
//
// ## Gate results
//
// | Gate | Command | Result |
// |---|---|---|
// | Core build | `pnpm --filter @formality-ui/core build` | ✅ green |
// | Core test | `pnpm --filter @formality-ui/core test` | ✅ <N> passed |
// | React build | `pnpm --filter @formality-ui/react build` | ✅ green |
// | React test | `pnpm --filter @formality-ui/react test` | ✅ <N> passed |
// | Typecheck | `pnpm typecheck` (tsc --build) | ✅ green |
// | Full suite | `pnpm test` | ✅ ~<N> passed |
// | Coverage | `pnpm test:coverage` | ✅ stmt/branch/func/line all ≥90% |
// | Lint | `pnpm lint` | ✅ 0 errors |
//
// ## Critical guards
//   - labels.test.ts (regression guard, 29 tests): ✅ passed unchanged
//   - framework-independence.test.ts (14 tests): ✅ passed (no framework leak in ordering.ts)
//   - UnusedFields.tsx (sole consumer): ✅ react build+test green

// PATTERN: record EXACT test counts + the four coverage percentages — "green" alone isn't evidence.
// GOTCHA:  build core BEFORE react so the react build resolves against fresh core dist/.
// CRITICAL: if a gate fails, fix ONLY the re-export chain (Task 6) — never function bodies/tests/react.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
MODULE STRUCTURE:
  - VERIFY: config/ordering.ts exists + exports 3 fns; config/index.ts barrel; labels/resolve.ts re-export; anchors unchanged.
SOURCE (READ-ONLY unless a chain piece is missing):
  - config/index.ts — conditional edit (add ordering block if missing).
  - labels/resolve.ts — conditional edit (remove duplicate bodies / unused import ONLY if S1 left them).
  - NEVER: function bodies, tests, react source, merge.ts, defaults.ts, root/labels index.ts.
CONSUMERS:
  - packages/react/src/components/UnusedFields.tsx — verify unaffected (react build+test green).
  - packages/core/src/__tests__/labels.test.ts — verify passes unchanged (regression guard).
OUTPUTS (the deliverable):
  - plan/005_8f88e0ec4482/P1M1T1S2/verification-record.md — green-gate evidence + chain confirmation.
DOWNSTREAM CONSUMERS:
  - P3.M1.T1.S1 (core spec audit): assumes config/ordering.ts is canonical — this record certifies it.
DOCS: none — no user-facing/API surface change. Verification-only.
PARALLEL-SAFE:
  - S1 edits the relocation files; S2 verifies them. If S2 finds S1 incomplete, S2 fixes ONLY the missing
    chain piece (config/index.ts barrel block is the most likely gap per live research). No conflict: both
    touch the same chain files, but S2 only adds what S1 missed.
```

## Validation Loop

> This IS a validation subtask — the "validation loop" is the work itself.
> Run each gate, record the result. Levels 2-3 only re-run if Task 6 fired.

### Level 1: Chain Confirmation (always — the core check)

```bash
# Definitions live ONLY in config/ordering.ts (not duplicated in resolve.ts)
grep -rnE "export function (sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields)" packages/core/src/
# Expected: EXACTLY 3 matches, all in packages/core/src/config/ordering.ts. ZERO in labels/resolve.ts.

# resolve.ts re-exports them (bodies replaced)
grep -n "from \"../config/ordering\"" packages/core/src/labels/resolve.ts
# Expected: exactly ONE match.

# config barrel exposes the new canonical path
grep -n "ordering" packages/core/src/config/index.ts
# Expected: an export block from "./ordering". (If missing → Task 6.)

# Anchors unchanged
grep -nE "sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields" packages/core/src/index.ts packages/core/src/labels/index.ts
# Expected: the 3 fns re-exported in both (root ~142-144; labels 10-12).
```

### Level 2: Core Build + Test (regression guard)

```bash
pnpm --filter @formality-ui/core build     # tsup — ordering.ts compiles into dist
pnpm --filter @formality-ui/core test      # full core suite
# Expected: green. Specifically confirm:
#   - labels.test.ts passes (regression guard importing via root barrel)
#   - framework-independence.test.ts passes (14 tests — no framework import in ordering.ts)
```

### Level 3: React Build + Test (consumer verification)

```bash
# BUILD CORE FIRST (so react resolves against fresh dist)
pnpm --filter @formality-ui/core build
pnpm --filter @formality-ui/react build    # UnusedFields.tsx resolves sortFieldsByOrder
pnpm --filter @formality-ui/react test     # full react suite
# Expected: green. UnusedFields.tsx unaffected.
```

### Level 4: Root Typecheck + Full Suite + Coverage + Lint

```bash
pnpm typecheck         # root tsc --build — project refs resolve the chain end-to-end
pnpm test              # full repo suite (≈1003+ tests)
pnpm test:coverage     # ≥90% gate (record all four metrics)
pnpm lint              # 0 errors (watch for unused import in resolve.ts)
# Expected: all green. Record exact test count + four coverage percentages.
```

### Level 5: Scope Verification

```bash
# If Task 6 did NOT fire, confirm NO source edits at all:
git diff --stat
# Expected: empty (or only plan/ artifacts) — S2 is verification-only when S1 succeeded.

# If Task 6 DID fire, confirm edits are confined to the chain:
git diff --stat
# Expected: at most config/index.ts and/or labels/resolve.ts. NEVER function bodies, tests, react source.

# Confirm the regression guards + consumer are untouched:
git diff --exit-code packages/core/src/__tests__/labels.test.ts packages/react/src/components/UnusedFields.tsx packages/core/src/index.ts packages/core/src/labels/index.ts
# Expected: exit 0 (all four untouched).
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/core build` + `test` green (labels + framework-independence pass).
- [ ] `pnpm --filter @formality-ui/react build` + `test` green (UnusedFields unaffected).
- [ ] `pnpm typecheck` green (root tsc --build — chain resolves end-to-end).
- [ ] `pnpm test` green (full suite, ≈1003+ tests).
- [ ] `pnpm test:coverage` green (≥90%; four metrics recorded).
- [ ] `pnpm lint` clean (0 errors; no unused import in resolve.ts).

### Feature Validation

- [ ] All 3 import paths (root barrel, /labels, /config) resolve to the same function identity.
- [ ] Definitions exist ONLY in config/ordering.ts (no duplicate in resolve.ts).
- [ ] labels.test.ts (regression guard, 29 tests) passes UNCHANGED.
- [ ] framework-independence.test.ts (14 tests) passes (no framework leak).
- [ ] UnusedFields.tsx unaffected (react build+test green).
- [ ] No behavioral change (the move is transparent).

### Code Quality Validation

- [ ] If Task 6 fired: edits confined to the re-export chain (config/index.ts / labels/resolve.ts) ONLY.
- [ ] No edits to function bodies, signatures, tests, react source, merge.ts, defaults.ts.
- [ ] Root index.ts + labels/index.ts anchors UNCHANGED.
- [ ] No incidental edits.

### Documentation & Deployment

- [ ] Verification record written to `plan/005_8f88e0ec4482/P1M1T1S2/verification-record.md`.
- [ ] No README/doc changes (internal module path; no user-facing surface change).
- [ ] No new env vars or config.

---

## Anti-Patterns to Avoid

- ❌ Don't edit function bodies, signatures, or behavior — S2 is verification-only; the move is S1's contract.
- ❌ Don't edit tests (labels.test.ts, framework-independence.test.ts) — they're the regression guards. If they fail, fix the chain upstream.
- ❌ Don't edit react source (UnusedFields.tsx) — it's the consumer; if it breaks, the root barrel chain is broken.
- ❌ Don't edit merge.ts, defaults.ts, or any non-chain core file.
- ❌ Don't repoint the root index.ts or labels/index.ts at "./config" — they stay pointing at "./labels"/"./resolve" (S1's contract; the chain resolves transparently).
- ❌ Don't run the react build before the core build — react resolves against core's dist; a stale dist gives a false result. Always build core first.
- ❌ Don't record just "green" — record EXACT test counts + the four coverage percentages. Numbers are the evidence.
- ❌ Don't silently re-add coverage if it drops — a drop means a function body diverged during the move (S1 bug); flag it.
- ❌ Don't assume S1 finished — live research found the config/index.ts barrel block may be missing. Confirm the chain first (Task 1), then run gates.
- ❌ Don't skip the duplicate-definition check — if resolve.ts has both old bodies AND the re-export, tsc fails with "Duplicate identifier". Catch it in Task 1.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a verification subtask for a well-bounded, mechanical
relocation. The S1 PRP fully specifies the expected end state, and live-source
research during PRP authorship confirmed the current in-flight state
(config/ordering.ts + resolve.ts re-export already present; config/index.ts
barrel block the likely incomplete piece). The implementing agent's task is
mechanical: confirm the chain, run the six gates (core build/test, react
build/test, typecheck, full suite + coverage + lint), record the numbers.
The expected outcome is "all green, chain resolves, no edits needed" — with
the single most likely conditional fix being adding the missing ordering
block to config/index.ts (Task 6). The 1-point deduction accounts for the
possibility that S1 is still mid-flight when S2 runs (parallel execution),
which could surface as a duplicate-definition or missing-barrel error — both
explicitly handled by Task 1's checks and Task 6's narrow chain-only fix.
