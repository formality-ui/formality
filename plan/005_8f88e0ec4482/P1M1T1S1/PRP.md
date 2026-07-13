name: "P1.M1.T1.S1 — Create config/ordering.ts and move ordering functions"
description: |

---

## Goal

**Feature Goal**: Close PRD §1.3.1/§1.3.2 structural gap G1 by relocating the
three ordering functions (`sortFieldsByOrder`, `getUnusedFields`,
`getOrderedUnusedFields`) from `packages/core/src/labels/resolve.ts` to a new
canonical module `packages/core/src/config/ordering.ts`, while preserving
**100% backwards compatibility** via re-exports (no public-API change, no
behavior change).

**Deliverable**:
1. A new file `packages/core/src/config/ordering.ts` containing the three ordering function implementations (moved verbatim from `labels/resolve.ts`).
2. `packages/core/src/config/index.ts` barrel updated to re-export the three functions from `./ordering`.
3. `packages/core/src/labels/resolve.ts` updated: the three function bodies replaced with re-exports from `../config/ordering` (backwards-compat for any code importing from `labels/`).
4. JSDoc on the moved functions updated to cite `config/ordering.ts` as the canonical location (Mode A).
5. The root `index.ts` re-export chain continues to resolve unchanged
   (index.ts → labels/index.ts → labels/resolve.ts re-export → config/ordering.ts).

**Success Definition**:
1. `packages/core/src/config/ordering.ts` exists and exports `sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields` with identical signatures to today.
2. `config/index.ts` re-exports all three.
3. `labels/resolve.ts` no longer defines them — it re-exports them from `../config/ordering` (so `labels/index.ts` and the root barrel still work).
4. `pnpm typecheck`, `pnpm test` (incl. `labels.test.ts`), `pnpm test:coverage` (≥90%), `pnpm lint` all green.
5. The sole consumer (`UnusedFields.tsx`) still imports `sortFieldsByOrder` from `@formality-ui/core` (root barrel) and is unaffected.
6. No behavior change — this is a pure module relocation.

## User Persona

**Target User**: Formality maintainers and future framework-adapter authors
(Vue/Svelte). This is an internal architecture-compliance change, not an
end-user feature.

**Use Case**: A maintainer reading PRD §1.3.2 expects `config/ordering.ts` to
exist and export `sortFieldsByOrder`. Today that module is missing (the
functions live in `labels/resolve.ts`), which is a structural spec violation.

**Pain Points Addressed**: Module-path/PRD drift. The functions work fine, but
their location contradicts the PRD's mandated package structure (§1.3.1 tree +
§1.3.2 "What Belongs in core" table).

## Why

- **Business value**: v1.0 spec compliance (gap G1 in the gap analysis). The
  codebase is ~95% PRD-complete; this closes a structural deviation before the
  v1.0 release (P3).
- **Integration**: Pure refactor — no runtime, no public API, no behavior
  change. Sibling task P1.M1.T1.S2 verifies backwards-compat + full test
  suite. Downstream P3.M1.T1.S1 audits core against the PRD and expects
  `config/ordering.ts` to exist by then.
- **Scope boundary**: Move ONLY these three ordering functions. Do NOT move
  the label functions (`humanizeLabel`, `resolveLabel`, etc.) — those stay in
  `labels/resolve.ts`. Do NOT touch `merge.ts`, `defaults.ts`, or any react
  code. Do NOT change function signatures or behavior.

## What

### The three functions to move (VERIFIED signatures — use these, not the gap_analysis prose)

> ⚠️ The gap_analysis.md describes `getUnusedFields` as taking a
> `config: Record<string, unknown>`. That is **wrong**. The actual current
> signature (verified at `labels/resolve.ts:198-204`) is
> `getUnusedFields(allFields: string[], declaredFields: Set<string>)`. The
> move must preserve the REAL signatures verbatim.

```typescript
// From packages/core/src/labels/resolve.ts (lines 180-220) — move VERBATIM:

export function sortFieldsByOrder(
  fieldNames: string[],
  fieldConfigs: Record<string, FieldConfig>,
): string[] {
  return [...fieldNames].sort((a, b) => {
    const orderA = fieldConfigs[a]?.order ?? Infinity;
    const orderB = fieldConfigs[b]?.order ?? Infinity;
    return orderA - orderB;
  });
}

export function getUnusedFields(
  allFields: string[],
  declaredFields: Set<string>,
): string[] {
  return allFields.filter((name) => !declaredFields.has(name));
}

export function getOrderedUnusedFields(
  allFields: string[],
  declaredFields: Set<string>,
  fieldConfigs: Record<string, FieldConfig>,
): string[] {
  const unused = getUnusedFields(allFields, declaredFields);
  return sortFieldsByOrder(unused, fieldConfigs);
}
```

They depend only on `import type { FieldConfig } from "../types"` (the `order`
property lives at `types/config.ts:136-137`). No framework imports, no other
core-module imports — they are pure functions.

### The re-export chain after the move

```
packages/core/src/index.ts (root barrel, UNCHANGED)
  └─ exports the 3 fns from "./labels"                          (lines 142-144, unchanged)
       └─ packages/core/src/labels/index.ts (UNCHANGED)
            └─ re-exports from "./resolve"                      (lines 10-12, unchanged)
                 └─ packages/core/src/labels/resolve.ts (MODIFIED)
                      └─ `export { ... } from "../config/ordering"`  (NEW re-export, replaces fn bodies)
                           └─ packages/core/src/config/ordering.ts (NEW — canonical home)
```

Plus a NEW direct path: `config/index.ts` → `./ordering` (so the PRD's
`config/ordering` module is reachable via the config barrel too).

### Success Criteria

- [ ] `packages/core/src/config/ordering.ts` exists, exports the 3 fns with the verified signatures above.
- [ ] `packages/core/src/config/index.ts` re-exports the 3 fns from `./ordering`.
- [ ] `packages/core/src/labels/resolve.ts` re-exports the 3 fns from `../config/ordering` (bodies removed).
- [ ] `packages/core/src/labels/index.ts` UNCHANGED (still re-exports from `./resolve`).
- [ ] `packages/core/src/index.ts` UNCHANGED (still re-exports from `./labels`).
- [ ] JSDoc on the moved fns cites `config/ordering.ts` as canonical (Mode A).
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm test:coverage` (≥90%), `pnpm lint` all green.
- [ ] `labels.test.ts` (which imports the 3 fns from the root barrel) still passes.
- [ ] `UnusedFields.tsx` unaffected (still imports `sortFieldsByOrder` from `@formality-ui/core`).

## All Needed Context

### Context Completeness Check

_Pass._ This is a mechanical module relocation. All source line numbers,
signatures, barrel files, the re-export chain, and the sole consumer were
verified against live source during PRP research. No prior codebase knowledge
is needed beyond "move these three functions to this new file, re-export from
the old location."

### Documentation & References

```yaml
# MUST READ
- url: PRD §1.3.1 (heading:h4.0) — Package Structure tree
  why: Mandates `config/ordering.ts` as a core module. This is the structural requirement being satisfied.
  critical: "The tree shows `config/ordering.ts # Field ordering utilities` under packages/core/src/config/."

- url: PRD §1.3.2 (heading:h3.2) — "What Belongs in @formality-ui/core" table
  why: Lists `config/ordering` → `sortFieldsByOrder(fields, config)` as a mandated core module/export.
  critical: Confirms ordering belongs in config/, NOT labels/. The labels/resolve.ts location is the deviation.

- url: PRD §15 / §14.1.2 (heading:h3.64, heading:h4.56) — Field Ordering + Config-based Order
  why: Defines the `FieldConfig.order` semantics the moved functions implement (undefined → Infinity → last; lower = earlier).
  critical: "undefined orders go last" — implemented via `?? Infinity` in sortFieldsByOrder. Preserve exactly.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  why: Gap G1 is the authoritative statement of this task. ⚠️ NOTE: its prose signature for getUnusedFields is WRONG.
  section: "GAP Registry → G1: config/ordering.ts structural deviation"
  critical: "Resolution: Create packages/core/src/config/ordering.ts, move the three ordering functions, update config/index.ts barrel, keep labels/index.ts re-export for backwards compat."

- file: packages/core/src/labels/resolve.ts
  section: "lines 180-220 (the three functions to move) + line 1 import (`import type { FieldConfig } from '../types'`)"
  why: THE source of the function bodies. Copy verbatim into the new file.
  pattern: "export function sortFieldsByOrder(...) { return [...fieldNames].sort((a,b) => (fieldConfigs[a]?.order ?? Infinity) - (fieldConfigs[b]?.order ?? Infinity)); }"
  gotcha: "getUnusedFields takes a Set<string> for declaredFields, NOT Record<string,unknown> as the gap_analysis prose claims. Preserve the real signature."

- file: packages/core/src/config/index.ts
  why: THE barrel to update — add an `export { ... } from "./ordering"` block.
  pattern: existing blocks re-export from "./merge" and "./defaults" — mirror that style.
  gotcha: "Add a SEPARATE export block for ordering (don't merge into merge/defaults blocks). Keep the existing blocks intact."

- file: packages/core/src/labels/index.ts
  why: CONFIRM it re-exports the 3 fns from "./resolve" (lines 10-12) and stays UNCHANGED. The re-export must keep resolving after resolve.ts switches to re-exporting from ../config/ordering.
  pattern: "export { ..., sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from './resolve';"
  gotcha: "Do NOT change labels/index.ts. It still points at ./resolve; resolve.ts now forwards to ../config/ordering. The chain resolves transparently."

- file: packages/core/src/index.ts
  section: "lines 142-144 (the 'Labels & Ordering' re-export block from './labels')"
  why: CONFIRM it stays UNCHANGED. The root barrel must keep exporting the 3 fns (public API preserved).
  gotcha: "Do NOT repoint the root barrel at './config' for these fns — that would be an unnecessary change. Leave it importing from './labels'; the chain still resolves."

- file: packages/core/src/__tests__/labels.test.ts
  section: "imports at lines 9-11 (the 3 fns from the root barrel); tests at 169-235"
  why: THE regression guard. These tests import via `@formality-ui/core` (root barrel) and must pass UNCHANGED after the move.
  pattern: "import { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from '../index' (or the package root)."
  gotcha: "If these tests break, the re-export chain is broken. Do NOT edit the tests — fix the chain."

- file: packages/react/src/components/UnusedFields.tsx
  section: "line 5 (`import { sortFieldsByOrder } from '@formality-ui/core'`); line 59 usage"
  why: THE sole external consumer. Must be unaffected (it imports from the root barrel, which still exports the fn).
  gotcha: "Do NOT edit UnusedFields.tsx. It imports from the root barrel, which is unchanged. Verify it still typechecks/tests green."

- file: packages/core/src/types/config.ts
  section: "lines 136-137 (`order?: number` on FieldConfig)"
  why: The type property the moved functions read. Confirms the only type dependency is FieldConfig.
  gotcha: "ordering.ts imports `FieldConfig` from '../types' (same relative path resolve.ts used). Verify the types barrel exports FieldConfig."
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
  config/
    merge.ts          # unchanged
    defaults.ts       # unchanged
    index.ts          # ← ADD ordering re-export block
    (ordering.ts)     # ← DOES NOT EXIST YET (the gap)
  labels/
    resolve.ts        # ← REMOVE the 3 fn bodies, ADD re-export from ../config/ordering
    index.ts          # unchanged (re-exports from ./resolve)
  index.ts            # unchanged (re-exports from ./labels)
  types/config.ts     # FieldConfig.order (lines 136-137) — unchanged
  __tests__/
    labels.test.ts    # regression guard (imports via root barrel) — unchanged
packages/react/src/components/
  UnusedFields.tsx    # sole consumer (imports via root barrel) — unchanged
```

### Desired Codebase tree with files to be added

```bash
packages/core/src/config/
  ordering.ts         # NEW — canonical home for the 3 ordering fns (moved verbatim)
  index.ts            # MODIFIED — add `export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "./ordering"`
  merge.ts            # unchanged
  defaults.ts         # unchanged
packages/core/src/labels/
  resolve.ts          # MODIFIED — 3 fn bodies removed; replaced with `export { ... } from "../config/ordering"`
  index.ts            # unchanged
packages/core/src/index.ts  # unchanged (root barrel)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Preserve the REAL signatures verbatim. The gap_analysis.md prose
// claims getUnusedFields takes `config: Record<string, unknown>` — that is WRONG.
// The actual signature is `getUnusedFields(allFields: string[], declaredFields: Set<string>)`.
// Copy the bodies from labels/resolve.ts:180-220 verbatim; do NOT "fix" them to match the prose.

// CRITICAL: This is a PURE RELOCATION. Do NOT change any function body logic,
// signature, or behavior. The sort comparator (`?? Infinity`, `orderA - orderB`),
// the filter (`!declaredFields.has(name)`), and the composition in
// getOrderedUnusedFields must be byte-for-byte identical.

// CRITICAL: Backwards compatibility is mandatory. Three import paths must keep working:
//   1. `import { sortFieldsByOrder } from "@formality-ui/core"`  (root barrel — UnusedFields.tsx, labels.test.ts)
//   2. `import { ... } from "@formality-ui/core/labels"`         (labels subpath — if any consumer uses it)
//   3. `import { ... } from "@formality-ui/core/config"`         (NEW canonical path — added by this task)
// All three must resolve to the SAME function identity.

// GOTCHA: The re-export chain is labels/resolve.ts → ../config/ordering.ts.
// resolve.ts currently has `import type { FieldConfig } from "../types"` at line 1.
// After the move, resolve.ts may no longer NEED that import IF no other code in
// resolve.ts uses FieldConfig. CHECK: does resolve.ts still reference FieldConfig
// after removing the 3 functions? If not, remove the now-unused import (eslint/TS
// will flag it). The NEW ordering.ts needs `import type { FieldConfig } from "../types"`.

// GOTCHA: ordering.ts sits at packages/core/src/config/ordering.ts, so its relative
// import for FieldConfig is "../types" (up from config/ to src/, then into types/).
// CONFIRM the types barrel (src/types/index.ts) exports FieldConfig — it does today.

// GOTCHA: labels.test.ts is the regression guard. It imports the 3 fns from the
// root barrel. If it fails after the move, the re-export chain is broken somewhere
// (most likely a typo in the re-export path). Do NOT edit the test; fix the chain.

// GOTCHA: The root index.ts must stay importing these from "./labels" (NOT repointed
// to "./config"). Repointing would be an unnecessary change and risks breaking the
// "Labels & Ordering" grouping comment. The chain labels → resolve → config/ordering
// resolves transparently.

// GOTCHA: This is a core-only change. The react package is a CONSUMER (via the root
// barrel) and must not be edited. Verify UnusedFields.tsx still typechecks after the
// move (it will — the root barrel is unchanged).
```

## Implementation Blueprint

### Data models and structure

No data models change. `FieldConfig.order` (types/config.ts:136-137) is
unchanged. The functions are pure and stateless.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check — confirm line numbers/signatures)
  - READ packages/core/src/labels/resolve.ts lines 1 (import) and 180-220 (the 3 functions). Record exact current line numbers.
  - CONFIRM the real signatures: sortFieldsByOrder(fieldNames: string[], fieldConfigs: Record<string, FieldConfig>): string[];
    getUnusedFields(allFields: string[], declaredFields: Set<string>): string[];
    getOrderedUnusedFields(allFields: string[], declaredFields: Set<string>, fieldConfigs: Record<string, FieldConfig>): string[].
  - READ packages/core/src/config/index.ts — confirm it has export blocks for "./merge" and "./defaults" (mirror that style).
  - READ packages/core/src/labels/index.ts lines 10-12 — confirm it re-exports the 3 fns from "./resolve".
  - READ packages/core/src/index.ts lines 142-144 — confirm the root barrel re-exports the 3 fns from "./labels".
  - GREP: `grep -rn "FieldConfig" packages/core/src/labels/resolve.ts` — determine if FieldConfig is used by OTHER code in resolve.ts (affects whether the top import stays).
  - WHY: Confirm the move target, the barrel style, and the re-export chain before editing.

Task 2: CREATE packages/core/src/config/ordering.ts (the canonical new home)
  - CREATE the file with a module header comment matching core conventions (e.g. "// @formality-ui/core - Config Ordering // Pure functions for field ordering // ZERO framework dependencies").
  - ADD `import type { FieldConfig } from "../types";`
  - COPY the 3 function bodies VERBATIM from labels/resolve.ts:180-220 (including their JSDoc blocks).
  - UPDATE the JSDoc on each function (Mode A): add a line noting `config/ordering.ts` is the canonical location (e.g. in the module or function doc). Keep the existing @param/@returns.
  - DO NOT change any logic, signature, or the sort/filter/composition behavior.
  - PLACEMENT: packages/core/src/config/ordering.ts.

Task 3: MODIFY packages/core/src/labels/resolve.ts — replace bodies with re-exports
  - REMOVE the 3 function implementations (and their JSDoc) from resolve.ts.
  - ADD a re-export block at an appropriate spot (top after imports, or bottom): `export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "../config/ordering";`
  - IF the `import type { FieldConfig } from "../types"` at line 1 is no longer used by any remaining code in resolve.ts → REMOVE it (eslint/TS no-unused-vars). IF still used → KEEP it.
  - PRESERVE: all label functions (humanizeLabel, resolveLabel, resolveFormTitle, isAutoGeneratedLabel, createLabelWithUnit, parseLabelWithUnit) UNCHANGED.

Task 4: MODIFY packages/core/src/config/index.ts — add the ordering barrel block
  - ADD a new export block: `export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "./ordering";`
  - PLACE: after the existing "./defaults" block (or alongside — mirror existing style).
  - PRESERVE: the existing "./merge" and "./defaults" export blocks unchanged.

Task 5: CONFIRM labels/index.ts and root index.ts are UNCHANGED
  - labels/index.ts: still `export { ..., sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "./resolve";` — NO EDIT (resolve.ts now re-exports them, so this still resolves).
  - root index.ts: still re-exports the 3 fns from "./labels" — NO EDIT.
  - WHY: These are the backwards-compat anchors. Touching them risks breaking the public API grouping unnecessarily.

Task 6: VALIDATE — typecheck, tests, coverage, lint
  - RUN: `pnpm typecheck` (root tsc --build — core + react). The react package consumes via the root barrel; it must still typecheck.
  - RUN: `pnpm --filter @formality-ui/core test -- labels` (the labels.test.ts regression guard — must pass UNCHANGED).
  - RUN: `pnpm test` (full suite — no regressions).
  - RUN: `pnpm test:coverage` (≥90% gate).
  - RUN: `pnpm lint` (0 errors — especially no-unused-vars in resolve.ts).
  - RUN: `pnpm --filter @formality-ui/core build` (tsup — confirm the new module compiles into dist).
  - EXPECT: all green. If labels.test.ts fails, the re-export chain is broken — re-check Task 3's re-export path.

Task 7: SCOPE-LEAK CHECK
  - RUN: `git diff --stat` → expect changes ONLY to: config/ordering.ts (new), config/index.ts, labels/resolve.ts.
  - RUN: `git diff --exit-code packages/core/src/labels/index.ts packages/core/src/index.ts packages/react/src/components/UnusedFields.tsx packages/core/src/__tests__/labels.test.ts` → expect exit 0 (all untouched).
  - EXPECT: minimal diff. No incidental edits.
```

### Implementation Patterns & Key Details

```typescript
// packages/core/src/config/ordering.ts — the new canonical module:

// @formality-ui/core - Config Ordering
// Pure functions for field ordering (config-driven rendering).
// ZERO framework dependencies.
//
// (Mode A) This is the canonical location for ordering utilities per PRD §1.3.1/§1.3.2.
// `labels/resolve.ts` re-exports these for backwards compatibility.

import type { FieldConfig } from "../types";

/**
 * Sort field names by their `order` config property (ascending).
 * Fields without an `order` (undefined) sort last (treated as Infinity).
 *
 * Canonical location: `config/ordering.ts` (PRD §1.3.1/§1.3.2).
 *
 * @param fieldNames - Array of field names
 * @param fieldConfigs - Map of field configs
 * @returns Sorted array of field names
 */
export function sortFieldsByOrder(
  fieldNames: string[],
  fieldConfigs: Record<string, FieldConfig>,
): string[] {
  return [...fieldNames].sort((a, b) => {
    const orderA = fieldConfigs[a]?.order ?? Infinity;
    const orderB = fieldConfigs[b]?.order ?? Infinity;
    return orderA - orderB;
  });
}

// ... getUnusedFields and getOrderedUnusedFields, copied verbatim, JSDoc updated ...

// --- packages/core/src/labels/resolve.ts — the re-export (replaces the bodies) ---
// At top (after imports) or bottom of resolve.ts:
//   // Ordering functions live in config/ordering.ts (PRD §1.3.1). Re-exported here
//   // for backwards compatibility with code importing from labels/.
//   export { sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields } from "../config/ordering";

// --- packages/core/src/config/index.ts — the new barrel block ---
//   export {
//     sortFieldsByOrder,
//     getUnusedFields,
//     getOrderedUnusedFields,
//   } from "./ordering";

// PATTERN: mirror the existing config/index.ts export-block style (one named export per line or grouped).
// GOTCHA: the re-export in resolve.ts uses path "../config/ordering" (up from labels/ into config/).
// CRITICAL: copy function bodies BYTE-FOR-BYTE — no logic changes, this is a pure move.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
MODULE STRUCTURE:
  - NEW: packages/core/src/config/ordering.ts (canonical home).
  - MODIFIED: packages/core/src/config/index.ts (add ordering re-export block).
  - MODIFIED: packages/core/src/labels/resolve.ts (bodies → re-export from ../config/ordering).
  - UNCHANGED: packages/core/src/labels/index.ts, packages/core/src/index.ts (backwards-compat anchors).
PUBLIC API: none changed. The root barrel still exports the same 3 fns. Importers
  using "@formality-ui/core", "@formality-ui/core/labels", or (new) "@formality-ui/core/config"
  all resolve to the same function identity.
CONSUMERS:
  - packages/react/src/components/UnusedFields.tsx (imports sortFieldsByOrder from root barrel) — UNAFFECTED.
  - packages/core/src/__tests__/labels.test.ts (imports the 3 fns from root barrel) — UNAFFECTED, must pass.
DOCS: Mode A JSDoc only (cite config/ordering.ts as canonical in the moved functions' docs). No README change.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating ordering.ts + editing resolve.ts + config/index.ts
pnpm --filter @formality-ui/core exec tsc --noEmit
pnpm format            # prettier — format the new file consistently
pnpm lint              # eslint — watch for no-unused-vars in resolve.ts (the old FieldConfig import)

# Confirm the diff is minimal and correctly scoped
git diff --stat
# Expected: config/ordering.ts (new), config/index.ts (modified), labels/resolve.ts (modified) ONLY.
```

### Level 2: Unit Tests (the regression guard)

```bash
# labels.test.ts is THE regression guard — it imports the 3 fns via the root barrel
pnpm --filter @formality-ui/core test -- labels
# Expected: green, UNCHANGED. If it fails, the re-export chain is broken.

# Full core suite
pnpm --filter @formality-ui/core test

# Full repo suite (catches any react-side regression via UnusedFields.tsx)
pnpm test
# Expected: all green. No test edits should be needed.
```

### Level 3: Coverage Gate (PRD §1.3.7 — ≥90%)

```bash
pnpm test:coverage
# Expected: green. The move changes WHERE the code lives, not WHAT it does, so the
# existing labels.test.ts still covers the same lines (now in ordering.ts). Coverage
# should be effectively unchanged. If it drops, a function body diverged during the move.
```

### Level 4: Build & Cross-Package Typecheck (the chain resolves end-to-end)

```bash
# Root typecheck — core + react via project refs. Confirms the re-export chain
# resolves for the react consumer (UnusedFields.tsx imports via the root barrel).
pnpm typecheck

# Build core (tsup emits dist/) — confirms the new module compiles and is bundled
pnpm --filter @formality-ui/core build

# Build react — confirms the consumer still resolves the import
pnpm --filter @formality-ui/react build
# Expected: all green.
```

### Level 5: Scope & Backwards-Compat Verification (domain-specific)

```bash
# Confirm the three import paths all resolve to the same identity:
# 1. Root barrel (Used by UnusedFields.tsx + labels.test.ts)
node -e "const c = require('./packages/core/dist/index.js'); console.log(typeof c.sortFieldsByOrder);" 2>/dev/null \
  || echo "(skip runtime check if dist not built; rely on typecheck + tests)"

# Confirm the new canonical path is reachable via the config barrel:
grep -n "ordering" packages/core/src/config/index.ts
# Expected: the new export block referencing "./ordering".

# Confirm resolve.ts now re-exports (no longer defines) the functions:
grep -nE "export function (sortFieldsByOrder|getUnusedFields|getOrderedUnusedFields)" packages/core/src/labels/resolve.ts
# Expected: NO matches (definitions removed).
grep -n "from \"../config/ordering\"" packages/core/src/labels/resolve.ts
# Expected: exactly ONE match (the re-export).

# Confirm the untouched anchors:
git diff --exit-code packages/core/src/labels/index.ts packages/core/src/index.ts packages/react/src/components/UnusedFields.tsx packages/core/src/__tests__/labels.test.ts
# Expected: exit 0 (all four untouched).
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` green (root tsc --build — core + react).
- [ ] `pnpm --filter @formality-ui/core build` green (tsup — new module compiles).
- [ ] `pnpm --filter @formality-ui/react build` green (consumer resolves import).
- [ ] `pnpm test` green (full suite, no regressions).
- [ ] `pnpm test:coverage` green (≥90% gate).
- [ ] `pnpm lint` clean (0 errors — resolve.ts has no unused import).
- [ ] `git diff --stat` shows ONLY config/ordering.ts (new), config/index.ts, labels/resolve.ts.

### Feature Validation

- [ ] `packages/core/src/config/ordering.ts` exists, exports the 3 fns with verified signatures.
- [ ] `config/index.ts` re-exports the 3 fns from `./ordering`.
- [ ] `labels/resolve.ts` re-exports the 3 fns from `../config/ordering` (bodies removed).
- [ ] Function bodies copied VERBATIM (no logic/signature/behavior change).
- [ ] JSDoc on moved fns cites `config/ordering.ts` as canonical (Mode A).
- [ ] `labels.test.ts` passes UNCHANGED.
- [ ] `UnusedFields.tsx` unaffected.

### Code Quality Validation

- [ ] Backwards compat: all 3 import paths (root barrel, /labels, /config) resolve.
- [ ] `labels/index.ts` and root `index.ts` UNCHANGED.
- [ ] No incidental edits to merge.ts, defaults.ts, react code, or tests.
- [ ] New file follows core module conventions (header comment, `import type` style).
- [ ] No unused imports left in resolve.ts.

### Documentation & Deployment

- [ ] Mode A JSDoc updated on the moved functions (canonical location noted).
- [ ] No README change (internal module path; no user-facing/API surface change).
- [ ] No new env vars or config.

---

## Anti-Patterns to Avoid

- ❌ Don't change any function signature, body logic, or behavior — this is a pure VERBATIM move.
- ❌ Don't trust the gap_analysis prose signature for `getUnusedFields` (`config: Record<string,unknown>` is WRONG). Use the real signature (`declaredFields: Set<string>`), verified at resolve.ts:198.
- ❌ Don't repoint the root `index.ts` or `labels/index.ts` at `./config` — leave them pointing at `./labels`/`./resolve`. The chain resolves transparently and the public grouping stays intact.
- ❌ Don't edit `labels.test.ts` or `UnusedFields.tsx` — they're the regression guards / consumers; if they break, the re-export chain is wrong (fix the chain, not the test).
- ❌ Don't leave an unused `import type { FieldConfig }` in resolve.ts if no remaining code uses it (eslint will fail). Check and remove if unused.
- ❌ Don't move the label functions (humanizeLabel, resolveLabel, etc.) — only the 3 ordering functions move. Labels stay in labels/.
- ❌ Don't touch merge.ts, defaults.ts, or any react file.
- ❌ Don't add a new test file — labels.test.ts already covers the moved functions and is the regression guard. P1.M1.T1.S2 handles the explicit backwards-compat verification.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a mechanical, well-bounded module relocation. All source
line numbers, signatures, barrel files, the re-export chain, and the sole
consumer were verified against live source during PRP research. The only
non-trivial risks are: (a) the gap_analysis prose signature for
`getUnusedFields` is wrong — but this PRP flags it explicitly and tells the
agent to copy verbatim from resolve.ts; (b) a possible unused-import lint
error in resolve.ts after removing the functions — mitigated by Task 1's
grep check and Task 3's conditional removal. The 1-point deduction accounts
for line-number drift by execution time (Task 1 re-confirms before editing).
