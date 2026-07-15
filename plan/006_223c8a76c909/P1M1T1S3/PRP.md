# PRP — P1.M1.T1.S3: Export `resolveFieldOverType` from core index

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: The final wiring step of P1.M1.T1. Makes the
`resolveFieldOverType` helper (defined in P1.M1.T1.S2) importable from the
public surface `@formality-ui/core`. This is a pure re-export / barrel change —
**no new logic, no behavior change**. After this lands, the React adapter
(P1.M3.T1/T2/T3.S1) and `resolveInitialValue` (P1.M2.T1.S1) can import the
helper the idiomatic way: `import { resolveFieldOverType } from
"@formality-ui/core"`.

---

## Goal

**Feature Goal**: Make `resolveFieldOverType` reachable from the package's
public entry point so that `import { resolveFieldOverType } from
"@formality-ui/core"` resolves. PRD §1.3.2's `config/defaults` row lists
`resolveFieldOverType(fieldVal, typeVal)` (§6.4) as a required core export; this
sub-task closes that gap.

**Deliverable**: Two one-line additions to the core package's export barrels —
`packages/core/src/config/index.ts` and `packages/core/src/index.ts` — plus a
one-line addition to the §1.3.2 audit list in
`packages/core/src/__tests__/prd-compliance.audit.test.ts`. The function itself
is already defined and unit-tested by P1.M1.T1.S2 (its PRP is the contract);
S3 touches **only** re-export wiring and the audit.

**Success Definition**:
1. `resolveFieldOverType` is a member of both:
   - the `from "./defaults"` block in `packages/core/src/config/index.ts`, and
   - the Configuration `from "./config"` block in `packages/core/src/index.ts`.
2. `import { resolveFieldOverType } from "@formality-ui/core"` type-checks and
   resolves at runtime to the function defined in `config/defaults.ts`.
3. `pnpm typecheck` (=`tsc --build`) is clean — *the single highest-signal
   gate*: it fails with `TS2724 "Module '"./config"' has no exported member
   'resolveFieldOverType'"` if either barrel is missed.
4. `prd-compliance.audit.test.ts` asserts `resolveFieldOverType` is exported as
   a function (added to `REQUIRED_FUNCTIONS`).
5. `pnpm test` / `pnpm lint` / `pnpm format:check` all pass; the 90/90/90/90
   coverage gate stays green.

---

## Why

PRD §6.4.0 mandates a **single core helper** (`resolveFieldOverType`) shared by
all six field-vs-type resolution sites across every adapter. For the React
adapter (P1.M3) and the `resolveInitialValue` priority chain (P1.M2.T1.S1) to
consume it the idiomatic, framework-agnostic way — `from "@formality-ui/core"`
— the helper must be on the public barrel. S2 deliberately scoped the barrel
edits OUT (it only owned the definition + direct-import unit test); S3 is that
deferred barrel work.

- **Business value**: completes the public API surface promised by PRD §1.3.2.
  Without this, downstream consumers (and the React adapter itself) would be
  forced into the private deep path `@formality-ui/core/config/defaults`,
  defeating the purpose of a framework-agnostic, single-audit-point helper.
- **Scope boundary**: this sub-task is **re-export wiring only**. Do NOT modify
  the function definition, its JSDoc, or its unit tests (all owned by S2). Do
  NOT wire it into `resolveInitialValue` or any adapter (P1.M2 / P1.M3). Do NOT
  add new fields to `FieldConfig` (P1.M1.T1.S1).

---

## What

Add `resolveFieldOverType` to the core package's export chain so it is publicly
importable. Concretely:

1. **`packages/core/src/config/index.ts`** — add `resolveFieldOverType` to the
   existing `export { … } from "./defaults";` block (the one that currently lists
   `resolveInitialValue, resolveAllInitialValues, isEmptyValue,
   getInputDefaultValue, mergeRecordWithDefaults`).
2. **`packages/core/src/index.ts`** — add `resolveFieldOverType` to the
   `// Configuration` block's `export { … } from "./config";` (the one that
   currently lists `resolveInitialValue, resolveAllInitialValues, isEmptyValue,
   getInputDefaultValue, mergeRecordWithDefaults` near its end).
3. **`packages/core/src/__tests__/prd-compliance.audit.test.ts`** — add
   `"resolveFieldOverType"` to the `REQUIRED_FUNCTIONS` array (in the
   `// config/merge + defaults` group), so the §1.3.2 audit covers this new
   required export.

> **CRITICAL — two barrels, not one.** The root barrel (`src/index.ts`) does
> `export { … } from "./config"`, which resolves to `config/index.ts`. A symbol
> can only be re-exported through `./config` if `config/index.ts` already
> exports it. Editing **only** `src/index.ts` (as a literal reading of the item
> title might suggest) breaks `pnpm typecheck` with
> `TS2724: Module '"./config"' has no exported member 'resolveFieldOverType'`.
> See *Known Gotchas* and *Research notes* (`research/barrel-chain-and-audit.md`).

### Success Criteria

- [ ] `resolveFieldOverType` appears in BOTH barrel export blocks (config +
      root).
- [ ] `pnpm typecheck` passes with zero errors (this *is* the proof the chain is
      complete).
- [ ] `resolveFieldOverType` is listed in `REQUIRED_FUNCTIONS` in
      `prd-compliance.audit.test.ts` and the audit test passes.
- [ ] `pnpm test` / `pnpm lint` / `pnpm format:check` pass; coverage gate
      90/90/90/90 green.
- [ ] No source file other than the two barrels + the audit test is touched.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> three files, quotes the exact current content of the two export blocks to
> edit (so the implementer can locate them without searching), specifies the
> exact insertion point in each, gives the exact audit-test array to extend,
> and names the exact validation command (`pnpm typecheck`) that proves the
> chain is complete. There is no ambiguity left to resolve.

### Documentation & References

```yaml
# PRD — authoritative §1.3.2 API surface (lists resolveFieldOverType as required) + §6.4.0 (the helper).
- docfile: PRD.md
  section: §1.3.2 "What Belongs in @formality-ui/core" (API-surface table, config/defaults row)
  why: "The config/defaults row lists `resolveInitialValue(...), resolveFieldOverType(fieldVal, typeVal)` — confirming resolveFieldOverType is a REQUIRED §1.3.2 public export, not optional."
  critical: "This is WHY the audit test (prd-compliance.audit.test.ts) must list it: the audit's stated job is to make §1.3.2 executable."
- docfile: PRD.md
  section: §6.4.0 "The precedence rule (single rule for all six)"
  why: "Defines the helper and states 'Every adapter MUST call this helper' — which requires it to be importable from the public surface."

# The two barrels being edited.
- file: packages/core/src/config/index.ts
  why: "The config-module barrel. Has a `export { … } from "./defaults"` block — add resolveFieldOverType there. MUST be edited or the root barrel's re-export won't compile."
  pattern: "Named-export list, 2-space indent, trailing comma, one symbol per line, semantically grouped (resolve* / is* / get* / merge*)."
  gotcha: "`./config` in src/index.ts resolves to THIS file. Skipping it = TS2724 build failure."
- file: packages/core/src/index.ts
  why: "The package's public entry point (the `main`/`module`/`types` target). Has a `// Configuration` block doing `export { … } from "./config"` — add resolveFieldOverType there."
  pattern: "Same named-export style. The Configuration block currently ends ~line 136 with `} from \"./config\";`."
  gotcha: "Item description says the block is '~line 95-110'; the ACTUAL block is ~lines 120-136 (the file has grown). Locate by content (`resolveInitialValue` + `from \"./config\"`), not by line number."

# The audit test to extend.
- file: packages/core/src/__tests__/prd-compliance.audit.test.ts
  why: "Executable gate over §1.3.2. Has a REQUIRED_FUNCTIONS array run through `it.each` asserting `typeof Core[name] === 'function'`. Add resolveFieldOverType to the `// config/merge + defaults` group."
  pattern: "Array of string literal names typed as `Array<keyof typeof Core>`. Each entry → one `it` asserting the barrel export is a function."
  gotcha: "Do NOT add a behavioral test here — the helper's semantics are already unit-tested in config.test.ts (S2). The audit only asserts reachability + function-ness (its stated 'second line of defense' role)."

# The definition file — READ-ONLY here (owned by S2, treated as a contract).
- file: packages/core/src/config/defaults.ts
  why: "Defines `export function resolveFieldOverType<T>(...)` at the top (S2's deliverable). Confirm it exists with `rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts` before wiring the barrels. Do NOT edit this file."
  gotcha: "If S2 has NOT yet landed, `rg` will find nothing and the barrel edit will fail `tsc` with 'has no exported member'. That is expected if running before S2 merges — S3 must land after S2."

# S2's contract (what produces the function this task re-exports).
- docfile: plan/006_223c8a76c909/P1M1T1S2/PRP.md
  why: "Defines the exact function signature, JSDoc, and the S2/S3 scope boundary (S2 = definition + test; S3 = BOTH barrels). S3 consumes S2's output verbatim."

# Validation tooling.
- file: vitest.config.ts
  why: "Root config holding the 90/90/90/90 coverage gate (PRD §1.3.7). Re-exports add no uncovered code, so the gate is unaffected — but it still runs under `pnpm test`."
- file: package.json
  section: scripts (test, typecheck, lint, format:check)
  why: "Exact commands for the validation loop."
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/config/defaults.ts          # S2's deliverable: defines resolveFieldOverType (READ-ONLY for S3)
packages/core/src/config/index.ts             # ← EDIT TARGET 1: add to `from "./defaults"` block
packages/core/src/index.ts                    # ← EDIT TARGET 2: add to Configuration `from "./config"` block
packages/core/src/__tests__/
  config.test.ts                              # S2's direct-import unit tests (UNCHANGED — leave its `from "../config/defaults"` import as-is)
  prd-compliance.audit.test.ts                # ← EDIT TARGET 3: add "resolveFieldOverType" to REQUIRED_FUNCTIONS
vitest.config.ts                              # 90/90/90/90 coverage gate (runs under `pnpm test`)
package.json                                  # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be changed

```bash
packages/core/src/config/index.ts             # MODIFY — +1 line in the `from "./defaults"` export block
packages/core/src/index.ts                    # MODIFY — +1 line in the Configuration `from "./config"` export block
packages/core/src/__tests__/prd-compliance.audit.test.ts  # MODIFY — +1 entry in REQUIRED_FUNCTIONS
# (No new files. No other files touched.)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (the #1 way this task gets done wrong): the export chain is TWO
// barrels deep. src/index.ts does `export { resolveFieldOverType } from "./config"`,
// and "./config" is packages/core/src/config/index.ts — which must ALSO export
// it (from "./defaults"). Edit only the root barrel → `pnpm typecheck` fails:
//   error TS2724: Module '"./config"' has no exported member 'resolveFieldOverType'.
//   Did you mean 'resolveInitialValue'?
// FIX: always edit BOTH config/index.ts AND src/index.ts. `pnpm typecheck`
// passing is the proof both are in sync.

// CRITICAL (line numbers): the item description says the Configuration block is
// "~line 95-110" in src/index.ts. The REAL block is ~lines 120-136 (the file
// grew with Expression/Conditions/Validation/Transform blocks above it). Do NOT
// trust the line range — locate the block by its content:
//   the `export { … }` block that ENDS with `} from "./config";` and CONTAINS
//   `resolveInitialValue`. There is exactly one such block.

// ORDERING (semantic, not strictly alphabetical): existing export blocks group
// by prefix (resolve* / is* / get* / merge*). Place resolveFieldOverType inside
// the resolve* group. Recommended exact spot: immediately BEFORE
// resolveInitialValue (alphabetical within resolve*: All < Field < Initial;
// and it reads primitive-first). Any spot inside the resolve* group passes all
// gates — the precise position is not test-enforced.

// SCOPE: do NOT touch packages/core/src/config/defaults.ts (S2 owns it). Do NOT
// touch config.test.ts (S2 owns it; its `from "../config/defaults"` direct
// import stays valid after S3 — direct module imports never break when a barrel
// is added, so do NOT churn it to `from "../index"`). Do NOT wire the helper
// into resolveInitialValue or any adapter (P1.M2 / P1.M3).

// COVERAGE: re-exports are not measured as uncovered statements, and the new
// audit-test line is fully executed (it runs under it.each). The 90/90/90/90
// gate (vitest.config.ts) is therefore unaffected — but it still runs under
// `pnpm test`, so confirm it stays green.

// VERBATIM MODULE SYNTAX: `verbatimModuleSyntax: true` is set in tsconfig.json.
// `export { name } from "./mod";` (re-export) is fully compliant — no `type`
// keyword needed because resolveFieldOverType is a value (a function), not a
// type. (Only `export type { X }` requires the `type` keyword; not applicable here.)
```

---

## Implementation Blueprint

### Data models and structure

None. No types, no interfaces, no runtime logic. Pure re-export wiring.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm S2's function exists before wiring exports
  - RUN: `rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts`
  - EXPECT: one match (the definition S2 added at the top of defaults.ts).
  - IF EMPTY: S2 has not landed yet — STOP. S3 depends on S2; the barrel edits
    will fail `tsc` ('has no exported member') until the definition exists.
    Coordinate sequencing; do not proceed.

Task 1: MODIFY packages/core/src/config/index.ts — add to the `from "./defaults"` block
  - LOCATE: the `export { … } from "./defaults";` block. Its CURRENT exact content:
        export {
          resolveInitialValue,
          resolveAllInitialValues,
          isEmptyValue,
          getInputDefaultValue,
          mergeRecordWithDefaults,
        } from "./defaults";
  - INSERT: `resolveFieldOverType,` on its own line, immediately BEFORE
            `resolveInitialValue,` (keeps it in the resolve* group; primitive-first;
            alphabetically sound: F < I).
  - RESULT (exact):
        export {
          resolveFieldOverType,
          resolveInitialValue,
          resolveAllInitialValues,
          isEmptyValue,
          getInputDefaultValue,
          mergeRecordWithDefaults,
        } from "./defaults";
  - DO NOT: reorder the other symbols, touch the `from "./merge"` or
            `from "./ordering"` blocks, or change the trailing comma / indent style.
  - WHY THIS FILE: "./config" in src/index.ts resolves HERE. Without this edit,
            the root-barrel re-export in Task 2 fails `tsc` (TS2724).

Task 2: MODIFY packages/core/src/index.ts — add to the Configuration `from "./config"` block
  - LOCATE: the `// Configuration` section's `export { … } from "./config";` block
    (the ONLY block ending in `} from "./config";`; contains `resolveInitialValue`).
    Its CURRENT tail (last ~8 lines of the block):
        ...
        createConfigContext,
        resolveInitialValue,
        resolveAllInitialValues,
        isEmptyValue,
        getInputDefaultValue,
        mergeRecordWithDefaults,
      } from "./config";
  - INSERT: `resolveFieldOverType,` on its own line, immediately BEFORE
            `resolveInitialValue,` (mirror Task 1's placement for consistency).
  - RESULT (the edited tail):
        ...
        createConfigContext,
        resolveFieldOverType,
        resolveInitialValue,
        resolveAllInitialValues,
        isEmptyValue,
        getInputDefaultValue,
        mergeRecordWithDefaults,
      } from "./config";
  - DO NOT: touch the Types / Expression / Conditions / Validation / Transform /
            Labels blocks above and below. Do NOT add a separate `export {
            resolveFieldOverType } from "./config/defaults"` line — it must live
            in the existing `from "./config"` block to match convention.
  - NOTE: the item description's "~line 95-110" is stale; the block is ~120-136.
          Locate by content, not line number.

Task 3: MODIFY packages/core/src/__tests__/prd-compliance.audit.test.ts — add to REQUIRED_FUNCTIONS
  - LOCATE: the `REQUIRED_FUNCTIONS` array inside the
    `describe("PRD §1.3.2 API surface (check a — exports exist & are functions)")`
    block. Find the `// config/merge + defaults` comment group, currently:
        // config/merge + defaults
        "mergeConfigs",
        "resolveInputConfig",
        "resolveInitialValue",
        "resolveAllInitialValues",
  - INSERT: `"resolveFieldOverType",` on its own line, immediately BEFORE
            `"resolveInitialValue",` (mirrors the barrel placement; groups with
            the resolve* exports).
  - RESULT:
        // config/merge + defaults
        "mergeConfigs",
        "resolveInputConfig",
        "resolveFieldOverType",
        "resolveInitialValue",
        "resolveAllInitialValues",
  - WHY: the audit's stated purpose is to make PRD §1.3.2's API-surface table
        executable. §1.3.2 now lists resolveFieldOverType under config/defaults,
        so the audit MUST cover it — otherwise this required export has no
        regression-proof guard.
  - DO NOT: add a behavioral `describe`/`it` for resolveFieldOverType here. Its
            semantics are already unit-tested in config.test.ts (S2). The audit
            only asserts reachability + function-ness via the existing
            `it.each(REQUIRED_FUNCTIONS)(… typeof Core[name] === "function" …)`.
  - NOTE: the top-of-file named imports (~line 43, `resolveInitialValue`) are
          for the behavioral tests further down; no behavioral test is added, so
          do NOT add resolveFieldOverType to that named-import list.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: every export block in this repo is a flat named-export list:
//   export {
//     nameA,
//     nameB,
//   } from "./mod";
// 2-space indent, trailing comma, one symbol per line, no grouping comments
// inside the block (comments live above the block, e.g. `// Configuration`).
// Match this exactly — prettier (format:check) will flag any deviation.

// PATTERN (audit test): REQUIRED_FUNCTIONS is typed
//   const REQUIRED_FUNCTIONS: Array<keyof typeof Core> = [ ... ];
// Adding a string literal that is a real export of `../index` satisfies the
// type (it's a keyof the Core namespace). If the root barrel DIDN'T export it,
// `tsc` would error on the array literal itself — another reason `pnpm typecheck`
// is the definitive gate.

// GOTCHA: `verbatimModuleSyntax: true` in the root tsconfig. Re-exporting a
// value with `export { resolveFieldOverType } from "./config"` is fully
// compliant (no `type` keyword). Only re-exporting a TYPE would need
// `export type { … }`. resolveFieldOverType is a function (value), so plain
// `export { … }` is correct.
```

### Integration Points

```yaml
DATABASE:
  - none (pure re-export; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - PUBLIC API SURFACE EXPANSION: after S3, `resolveFieldOverType` is part of
    the published `@formality-ui/core` surface. This is the intended outcome
    (PRD §1.3.2). No package.json `exports` map change is needed — the existing
    entry already points at src/index.ts (and dist/index.* at publish time).

DOWNSTREAM (NOT this task — listed for awareness, all become possible after S3):
  - P1.M2.T1.S1 → resolveInitialValue's Priority-3 block can call
    resolveFieldOverType (imported from the barrel).
  - P1.M3.T1.S1 → useField parser/formatter resolution imports from the barrel.
  - P1.M3.T2.S1 → changeField debounce resolution imports from the barrel.
  - P1.M3.T3.S1 → transformValuesForSubmit getSubmitField/valueField imports from the barrel.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. THE definitive gate — proves the two-barrel chain is complete.
# If config/index.ts was missed, this fails with:
#   src/index.ts:XX:YY - error TS2724: Module '"./config"' has no exported member
#   'resolveFieldOverType'. Did you mean 'resolveInitialValue'?
pnpm typecheck      # = tsc --build (references packages/core + packages/react)

# Lint + format-check the three touched files.
pnpm lint
pnpm format:check

# If prettier flags indentation/commas in the edited export lists, run:
#   pnpm prettier --write \
#     packages/core/src/config/index.ts \
#     packages/core/src/index.ts \
#     packages/core/src/__tests__/prd-compliance.audit.test.ts

# Expected: ZERO errors. typecheck clean = both barrels in sync + audit array
# type-checks against the real Core exports.
```

### Level 2: Unit Tests (Component Validation)

```bash
# The §1.3.2 audit gate — confirms resolveFieldOverType is on the barrel as a function.
pnpm vitest run packages/core/src/__tests__/prd-compliance.audit.test.ts

# S2's direct-import unit tests — must still pass UNCHANGED (proves the function
# itself still works; S3 did not touch its definition or test).
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "resolveFieldOverType"

# Full suite (enforces the 90% coverage gate across core + react).
pnpm test

# Expected:
#   - prd-compliance audit: "resolveFieldOverType is exported from the core
#     barrel as a function" PASSES (the new it.each case).
#   - config.test.ts resolveFieldOverType block: all S2 cases still pass
#     (field-wins, type-fallback, both-undefined, §6.4.5 falsy cases).
#   - No test-count regression; 90/90/90/90 coverage gate still green
#     (re-exports add no uncovered code; the new audit line is fully covered).
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the packages (core + react). Confirms the public surface compiles for
# downstream consumers and the build output includes resolveFieldOverType.
pnpm -r build

# Public-surface reachability proof (the task's core deliverable). After build,
# the compiled barrel must expose the symbol. Quick check against source via tsc:
cat > /tmp/s3_smoke.ts <<'EOF'
import { resolveFieldOverType } from "./packages/core/src/index";
const x: number | false | undefined = resolveFieldOverType(false, 500);
console.log(typeof resolveFieldOverType, x); // 'function' false
EOF
pnpm typecheck 2>/dev/null || true   # the /tmp file is outside the project refs;
                                     # rely on `pnpm -r build` + the vitest audit
                                     # if this ad-hoc file isn't picked up.
rm -f /tmp/s3_smoke.ts

# Expected: build succeeds; resolveFieldOverType is importable from
# "@formality-ui/core" (the audit test + tsc --build already prove this
# authoritatively — the smoke file is optional).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Confirm the helper is STILL framework-independent at the package level
# (PRD §1.3.2 / the sample.test.ts gate). S3 adds no imports to defaults.ts, so
# this is satisfied by construction — but the gate still runs under `pnpm test`:
pnpm vitest run packages/core/src/__tests__/sample.test.ts
pnpm vitest run packages/core/src/__tests__/framework-independence.test.ts

# Confirm no accidental double-export or typo by listing the symbol once:
rg -n 'resolveFieldOverType' packages/core/src/index.ts packages/core/src/config/index.ts
# Expected: exactly ONE occurrence in each file (inside the respective export block).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors (THE proof the chain is complete).
- [ ] `pnpm test` passes (baseline + the new audit `it.each` case; no regressions).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] `resolveFieldOverType` is a member of the `from "./defaults"` block in
      `packages/core/src/config/index.ts`.
- [ ] `resolveFieldOverType` is a member of the Configuration `from "./config"`
      block in `packages/core/src/index.ts`.
- [ ] `resolveFieldOverType` appears exactly ONCE in each of those two files.
- [ ] `"resolveFieldOverType"` is in `REQUIRED_FUNCTIONS` in
      `prd-compliance.audit.test.ts` (config/merge + defaults group).
- [ ] `import { resolveFieldOverType } from "@formality-ui/core"` resolves
      (proven by `pnpm typecheck` + the audit test).

### Code Quality Validation

- [ ] Edited export lists follow the existing flat named-export style (2-space
      indent, trailing comma, one symbol per line).
- [ ] Placement groups `resolveFieldOverType` with the `resolve*` exports.
- [ ] No anti-patterns (separate ad-hoc `export { … } from "./config/defaults"`
      line; editing only one barrel; churning S2's test import).
- [ ] No files outside the three named targets were touched.

### Documentation & Deployment

- [ ] No JSDoc/User-doc change required (the helper's JSDoc lives on its
      definition in defaults.ts, owned by S2; re-exports carry no doc surface).
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT edit only `src/index.ts`.** The root barrel re-exports through
  `./config` (= `config/index.ts`), so the config barrel MUST also export the
  symbol or `pnpm typecheck` fails with `TS2724`. Always edit BOTH barrels.
- ❌ **Do NOT trust the "~line 95-110" range from the item description.** The
  Configuration block is actually ~lines 120-136 in `src/index.ts`. Locate it by
  content (`resolveInitialValue` + `} from "./config";`).
- ❌ **Do NOT touch `packages/core/src/config/defaults.ts`.** S2 owns the
  definition + JSDoc. S3 is re-export wiring only.
- ❌ **Do NOT touch `packages/core/src/__tests__/config.test.ts`.** S2 owns its
  tests; its direct `from "../config/defaults"` import stays valid after S3.
  Do NOT "helpfully" switch it to `from "../index"` — that's needless churn.
- ❌ **Do NOT add a behavioral test for resolveFieldOverType in the audit file.**
  Its semantics are already covered in `config.test.ts` (S2). The audit only
  asserts reachability + function-ness via `REQUIRED_FUNCTIONS`.
- ❌ **Do NOT add a separate `export { resolveFieldOverType } from
  "./config/defaults"` line** in `src/index.ts`. It must live in the existing
  `from "./config"` block to match the established convention (one block per
  module).
- ❌ **Do NOT wire the helper into `resolveInitialValue` or any adapter here.**
  That is P1.M2.T1.S1 / P1.M3.* — explicitly out of scope.
- ❌ **Do NOT run S3 before S2 lands.** If `rg 'export function
  resolveFieldOverType' packages/core/src/config/defaults.ts` returns nothing,
  the definition doesn't exist yet and the barrel edits will fail `tsc`. Stop
  and sequence after S2.
