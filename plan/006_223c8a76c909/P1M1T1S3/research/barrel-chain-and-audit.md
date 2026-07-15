# Research Notes — P1.M1.T1.S3 (Export resolveFieldOverType from core index)

## TL;DR

This sub-task is a **2-line edit across 2 barrel files** (+ 1 optional line in
the PRD audit test). The single most important finding is below.

## CRITICAL FINDING: The export chain requires TWO barrel edits, not one

The item description says "Add `resolveFieldOverType` to the 'Configuration'
export block in `packages/core/src/index.ts`." That is **necessary but not
sufficient**. The root barrel does:

```typescript
// packages/core/src/index.ts (Configuration block, ~lines 120-136)
export {
  ...
  resolveInitialValue,
  resolveAllInitialValues,
  ...
} from "./config";   // ← "./config" resolves to packages/core/src/config/index.ts
```

`"./config"` resolves to `packages/core/src/config/index.ts`, which in turn does:

```typescript
// packages/core/src/config/index.ts (the `from "./defaults"` block, ~lines 13-19)
export {
  resolveInitialValue,
  resolveAllInitialValues,
  isEmptyValue,
  getInputDefaultValue,
  mergeRecordWithDefaults,
} from "./defaults";
```

`resolveFieldOverType` is defined in `config/defaults.ts` (S2's deliverable). For
`export { resolveFieldOverType } from "./config"` in the ROOT barrel to compile,
the symbol MUST first be re-exported by the CONFIG barrel. Otherwise:

```
src/index.ts:XX:YY - error TS2724: Module '"./config"' has no exported member 'resolveFieldOverType'. Did you mean 'resolveInitialValue'?
```

**Confirmed by S2's PRP contract**, which explicitly scoped BOTH barrels to S3:

> - file: packages/core/src/config/index.ts
>   why: "`export { resolveInitialValue, … } from \"./defaults\"` — adding resolveFieldOverType here is S3."
> - file: packages/core/src/index.ts
>   why: "Root barrel re-exports config helpers (~lines 118–135) from `\"./config\"`. S3 adds resolveFieldOverType here."

**So S3 MUST edit both `packages/core/src/config/index.ts` AND `packages/core/src/index.ts`.**
Editing only the root barrel (as a literal reading of the item description
suggests) breaks `pnpm typecheck`.

## Line-number reality check

Item description says the Configuration block is "~line 95-110" in
`packages/core/src/index.ts`. The ACTUAL block is ~lines 120-136 (the file has
grown with the Expression/Conditions/Validation/Transform blocks above it). The
block is unambiguous though — it's the one ending in `} from "./config";` and
containing `resolveInitialValue`. No risk of editing the wrong block.

## Placement convention

The existing export blocks are **semantically grouped, not strictly
alphabetical**:

```typescript
// config/index.ts `from "./defaults"` current order:
resolveInitialValue,      // resolve*
resolveAllInitialValues,  // resolve*
isEmptyValue,             // is*
getInputDefaultValue,     // get*
mergeRecordWithDefaults,  // merge*
```

Recommended placement of `resolveFieldOverType`: **immediately before
`resolveInitialValue`** in both barrels. Rationale:
- Keeps it in the `resolve*` group (matches the semantic-grouping convention).
- Alphabetically `resolveFieldOverType` (F) sorts before `resolveInitialValue`
  (I), so leading the `resolve*` group is alphabetically defensible too.
- Reflects that it is the foundational primitive that `resolveInitialValue`'s
  Priority-3 block will later call (P1.M2.T1.S1) — primitive-first ordering.
- Satisfies the item's "near `resolveInitialValue`" guidance.

(Any placement inside the `resolve*` group is acceptable; the exact position is
not enforced by any test.)

## The PRD-compliance audit test (prd-compliance.audit.test.ts)

`packages/core/src/__tests__/prd-compliance.audit.test.ts` is an executable
gate over PRD §1.3.2 ("What Belongs in @formality-ui/core" — the API-surface
table). It has a `REQUIRED_FUNCTIONS` array (declared ~line 60; the `// config/merge + defaults` group is at ~lines 88-92) and runs:

```typescript
it.each(REQUIRED_FUNCTIONS)("%s is exported from the core barrel as a function", (name) => {
  expect(typeof Core[name]).toBe("function");
});
```

Currently it lists `resolveInitialValue` and `resolveAllInitialValues` (under
"config/merge + defaults") but NOT `resolveFieldOverType`.

PRD §1.3.2's table (as updated by §6.4) now lists the `config/defaults` row as:
> `resolveInitialValue(...)`, `resolveFieldOverType(fieldVal, typeVal)` (§6.4)

So `resolveFieldOverType` **is** a §1.3.2 required export. Adding it to
`REQUIRED_FUNCTIONS` (in the "config/merge + defaults" group, near
`resolveInitialValue`) keeps the audit aligned with the PRD contract and
provides the regression-proof "second line of defense" for this new export.
This is a 1-line addition; low-risk, high-value. Recommended (treated as a
required task in the PRP because it completes the §1.3.2 contract this item
exists to satisfy).

The audit also imports named symbols at the top (~line 43: `resolveInitialValue`)
for use in later behavioral tests. No behavioral test is needed for
`resolveFieldOverType` here — the unit tests in `config.test.ts` (S2) already
cover semantics; the audit only needs to assert reachability + function-ness.

## S2's test import does NOT need to change

S2's PRP mandates importing `resolveFieldOverType` DIRECTLY from
`"../config/defaults"` (not the barrel) because, at S2 time, it wasn't in the
barrel yet. After S3 lands, that direct import remains 100% valid (direct
module imports never break when a barrel is added). **Do NOT churn S2's import
to `"../index"`.** Leaving it as-is is correct and avoids touching S2's files.

## Validation strategy

The single highest-signal validation is **`pnpm typecheck`** (=`tsc --build`):
- If ONLY the root barrel is edited (config barrel forgotten), `tsc` emits
  `TS2724: Module '"./config"' has no exported member 'resolveFieldOverType'`.
- If BOTH barrels are edited correctly, `tsc` is clean.
So `pnpm typecheck` passing == the export chain is wired end-to-end.

`pnpm test` additionally runs:
- `config.test.ts` — S2's direct-import unit tests (must remain green; they
  prove the function itself still works).
- `prd-compliance.audit.test.ts` — if `resolveFieldOverType` was added to
  `REQUIRED_FUNCTIONS`, this asserts it's reachable + a function on the barrel.
- The 90/90/90/90 coverage gate — unaffected (no new logic; re-exports are not
  measured as uncovered code, and the audit-test line is fully covered).

`pnpm lint` / `pnpm format:check` — trivial formatting on the edited export
lists. The existing blocks use 2-space indent, trailing comma, one symbol per
line — match that exactly and prettier/eslint are clean.

## Confidence

Very high. The change is mechanical, fully determined by the existing barrel
structure, and covered by a deterministic `tsc --build` gate that fails loudly
if the chain is incomplete. Main residual risk = editing only one barrel; the
PRP makes the two-barrel requirement impossible to miss.

Confidence for one-pass success: **9.5/10**.
