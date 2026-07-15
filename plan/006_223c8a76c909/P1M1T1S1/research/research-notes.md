# Research Notes — P1.M1.T1.S1: Add field-level override fields to FieldConfig type

## Task scope (confirmed)

Pure **type-only** change to a single interface. Add six optional fields to
`FieldConfig` in `packages/core/src/types/config.ts`. No runtime logic, no
behavioral change. The precedence *helper* (`resolveFieldOverType`) and its
*wiring* are sibling tasks (P1.M1.T1.S2 / S3 and P1.M2/P1.M3) — OUT of scope here.

## Target file & exact placement

**File**: `packages/core/src/types/config.ts`

`FieldConfig` interface spans **lines 120–167** (verified via `grep -n`).
Current field order:
- … `recordKey?: string;`  → **line 140**
- `rules?: Record<string, unknown>;`  → **line 143**

**Insertion point**: between `recordKey` (line 140) and `rules` (line 143),
matching PRD §3.2 FieldConfig layout. There is exactly one blank line between
`recordKey` and `rules` currently.

## Shapes — copy from InputConfig but NOT generified

`InputConfig<TValue = unknown>` (lines 60–110) already has the four shapes we
mirror. KEY DIFFERENCE: FieldConfig is **NOT** generic over `TValue`, so
`parser`/`formatter` use `(value: unknown) => unknown` instead of
`(value: unknown) => TValue` / `(value: TValue) => unknown`. This is explicit
in PRD §6.4.3 and the task contract.

| Field | Final type on FieldConfig | InputConfig original (for reference) |
|---|---|---|
| `defaultValue?` | `unknown` | `defaultValue: TValue` |
| `debounce?` | `number \| false` | `debounce?: number \| false` (identical) |
| `parser?` | `string \| ((value: unknown) => unknown)` | `string \| ((value: unknown) => TValue)` |
| `formatter?` | `string \| ((value: unknown) => unknown)` | `string \| ((value: TValue) => unknown)` |
| `valueField?` | `string` | identical |
| `getSubmitField?` | `(fieldName: string) => string` | identical |

NOTE: on InputConfig, `defaultValue` is **required** (`defaultValue: TValue`).
On FieldConfig it is **optional** (`defaultValue?: unknown`). All six are
optional on FieldConfig. (PRD §3.2 / §6.4.5: `undefined` = "not specified".)

## Field ORDER (from task contract + PRD §3.2)

1. `defaultValue`
2. `debounce`
3. `parser`
4. `formatter`
5. `valueField`
6. `getSubmitField`

This matches both the PRD §3.2 commented code block and the contract item
description. (Note: InputConfig lists them `valueField` before
`getSubmitField`; FieldConfig mirrors that relative order too. The
`parser`/`formatter` pair and the `valueField`/`getSubmitField` pair keep their
family grouping.)

## React overlay — NO change required (confirmed)

`packages/react/src/overlays.ts`:
```typescript
export interface ReactFieldConfig<V extends FieldValues = FieldValues>
  extends Omit<FieldConfig, "rules"> {
  rules?: RegisterOptions<V>;
}
```
Because it `extends Omit<FieldConfig, "rules">`, the six new framework-agnostic
fields are **inherited automatically**. The task contract explicitly states:
"Since `ReactFieldConfig extends Omit<FieldConfig, 'rules'>`, these fields
propagate to the React overlay automatically (no structural change to
overlays.ts)." The JSDoc update to `ReactFieldConfig` is a **separate task**
(P1.M1.T2.S1) — do NOT touch overlays.ts here.

## JSDoc — exact text provided by contract (Mode A docs ride with the work)

The task contract gives the exact JSDoc for each field. Reproduce verbatim
(apostrophes escaped as needed). Each references its §6.4 sub-section. This
satisfies the "Mode A — JSDoc rides with the work" requirement; **do NOT**
create a separate docs subtask.

## Validation approach (codebase-verified)

1. **Type gate**: `pnpm typecheck` (root) → `tsc --build` over project refs
   `packages/core` + `packages/react`. Core tsconfig `include: ["src/**/*"]`,
   `exclude: ["src/**/*.test.ts", "src/**/__tests__/**"]` — so the edited
   `config.ts` IS type-checked. Because all six fields are **optional**, this
   passes trivially with no downstream breaks (additive only).

2. **Runtime tests**: `pnpm test` (vitest). `packages/core/src/__tests__/config.test.ts`
   constructs `FieldConfig` literals extensively (e.g. `{ type: "switch", label: "On" }`,
   `{ recordKey: "selectedClient" }`). All must stay green — optional fields
   cannot break these. Test baseline: 1085 passed | 5 skipped (41 files).

3. **Coverage gate**: 90/90/90/90 (`vitest.config.ts` thresholds). Type-only
   additions to an interface do not change coverage numbers; gate stays green.

4. **Lint/format**: `pnpm lint` (eslint), `pnpm format:check` (prettier). The
   file currently uses 2-space indent, JSDoc `/** ... */`, single-line when
   short. Match surrounding style.

5. **Type-level assertion (RECOMMENDED)**: the repo has a `.test-d.ts`
   convention (`packages/react/src/__typechecks__/*.test-d.ts`) consumed by
   `tsc --build`. There are currently NO `.test-d.ts` files in `packages/core`,
   but core's tsconfig would pick one up (`*.test-d.ts` is not in the
   `exclude`). A small assertion file locks in: (a) the six fields exist on
   `FieldConfig` with correct types, and (b) the §6.4.5 "meaningful override"
   semantics — `null`/`false`/`0`/`""` are all assignable to `defaultValue`
   (since it is `unknown`). This is the highest-value validation artifact for a
   type-only change and guards against accidental regression of the
   not-generic `(value: unknown) => unknown` shape.

## Anti-scope guards (do NOT do these)

- Do NOT add `resolveFieldOverType` (that's P1.M1.T1.S2).
- Do NOT export anything new from `packages/core/src/index.ts` (S3).
- Do NOT modify `resolveInitialValue` priority chain (P1.M2.T1.S1).
- Do NOT touch `overlays.ts` / `ReactFieldConfig` JSDoc (P1.M1.T2.S1).
- Do NOT wire the fields into `useField.tsx` / `Form.tsx` (P1.M3).

## Conventions to follow (from config.ts)

- 2-space indentation; no trailing semicolons omitted (fields end with `;`).
- Each field preceded by a `/** ... */` JSDoc comment.
- Type unions with `|` are spaced: `number | false`, `string | (...)`.
- Arrow function types: `(value: unknown) => unknown`, `(fieldName: string) => string`.
- The file header style and existing inline-section JSDoc on `InputConfig`
  (multi-line for `debounce`) show that multi-line JSDoc is acceptable when the
  doc is long. The contract JSDoc strings are moderately long — multi-line or
  single-line both acceptable; prefer matching the existing single-line `/** x */`
  style for the shorter ones and reserve multi-line only if needed.
