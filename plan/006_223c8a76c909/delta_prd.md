# Delta PRD — Field-Level Overrides for Type-Level Levers

## Scope of this Delta

This delta captures the changes between the v1.0 PRD (as implemented by the
previous session, plan/005) and the current PRD. The previous session shipped
the full v1.0 spec (P1/P2/P3 all Complete). The current PRD adds **two things**:

### Delta 1 — Field-level overrides for type-level levers (§6.4) — THE FEATURE

A new coherent capability: six behavioral levers that previously existed only on
`InputConfig` (per **type**) can now be overridden per **field instance** on
`FieldConfig`:

| Lever (on `InputConfig`)        | New field-level counterpart                      |
| ------------------------------- | ------------------------------------------------ |
| `defaultValue`                  | `fieldConfig.defaultValue` (new priority tier)   |
| `debounce`                      | `fieldConfig.debounce`                           |
| `parser` / `formatter`          | `fieldConfig.parser` / `.formatter`              |
| `getSubmitField` / `valueField` | `fieldConfig.getSubmitField` / `.valueField`     |

All six share ONE rule (§6.4.0): the field value wins over the type value when
**`!== undefined`** (so `null`/`false`/`0`/`""` are meaningful overrides, not
treated as "unset"). Implemented via a single core helper
`resolveFieldOverType(fieldVal, typeVal)` so the rule lives in one place.
`validator` is intentionally **excluded** — it *composes* (field runs, then
type), it does not override (§6.4).

The feature threads through 4 existing resolution sites:

1. `resolveInitialValue` (core) — new priority tier for `defaultValue`
2. `useField` parse/format (react) — `fieldConfig.parser ?? inputConfig.parser`
3. `Form.changeField` debounce (react) — `fieldConfig.debounce ?? inputConfig.debounce`
4. `transformValuesForSubmit` (react) — `fieldConfig.getSubmitField ?? inputConfig.getSubmitField` + `valueField`

### Delta 2 — Subscription silence contract (§1.1, §5.2.2) — ALREADY IMPLEMENTED

The current PRD adds spec language (§1.1 "Zero console noise", §5.2.2 "Silence
contract") codifying that subscription registration/cleanup/the inverted index
produce **zero console output**, and that the old
`[Formality Subscription]` `console.warn` (guarded only by `NODE_ENV`) was
removed entirely.

**This is already implemented in the codebase the previous session shipped.**
Evidence: `useSubscriptions.ts` and `Form.tsx` subscription logic contain no
`console.*` calls; `useSubscriptions.test.tsx` asserts "produces ZERO console
output on mount, rerender, and unmount"; `Form.coverage.test.tsx` asserts
"add/remove/double-remove produce ZERO console output";
`Field.subscriptionStability.test.tsx` asserts "ZERO Formality console output"
while typing into a watched field.

**→ No implementation work for Delta 2.** It is doc-only confirmation that the
spec now matches the (already shipped) behavior. It is listed here for awareness
only; no tasks are created for it.

### What is NOT in scope

- No new components, hooks, or modules (the previous session landed useField,
  ordering.ts, validate(), mergeConfigs(), forwardRef, all Appendix C types).
- No changes to the subscription system's runtime (Delta 2 is doc-only).
- No re-typing of existing overlay types.

---

## Proportional Sizing

This is a **medium feature addition**: one coherent capability (field-level
overrides), one new core helper, 6 new typed fields, and threading through 4
existing resolution sites. It is **not** a multi-phase rewrite. The PRD below is
1 phase, 2 milestones (core + react threading), with a Mode B docs-sync task.

---

## Backlog

### Phase P1 — Field-Level Overrides (§6.4)

Bring the field-level-override capability to full spec compliance. The work is
layered: **core first** (types + helper + initial-value tier), then **react
threading** (parse/format, debounce, submit transform). Build core before react
(react depends on core's types + `resolveFieldOverType`).

The previous session left the codebase green: 1003 tests, 97% coverage,
framework-independence test passing. All changes below must preserve that gate
(PRD §1.3.7 ≥90% across statements/branches/functions/lines) and must not add a
React/RHF dependency to core (§C.2).

#### Milestone P1.M1 — Core: types, helper, initial-value tier

##### Task P1.M1.T1 — Add the six field-level override fields to `FieldConfig`

Add `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, and
`getSubmitField` to the `FieldConfig` interface in
`packages/core/src/types/config.ts`. These are framework-agnostic and pass
through the React overlay (`ReactFieldConfig`) unchanged — note this in the
`ReactFieldConfig` overlay JSDoc (§3.2.1 says parser/formatter stay
`string | ((value: unknown) => unknown)`; per-field `TValue` inference is a
future enhancement, do NOT generify now).

- **Subtask P1.M1.T1.S1** — Add the six fields to `FieldConfig` with §6.4 JSDoc.
  Field types exactly per PRD §3.2 / Appendix A:
  `defaultValue?: unknown; debounce?: number | false; parser?: string | ((value: unknown) => unknown); formatter?: string | ((value: unknown) => unknown); valueField?: string; getSubmitField?: (fieldName: string) => string;`.
  Update the existing `recordKey` JSDoc to note "read-side wire mapping"
  symmetry with `getSubmitField`/`valueField` (submit-side). Update
  `ReactFieldConfig` overlay JSDoc (overlays.ts) to state the §6.4 fields pass
  through unchanged. Story points: 1. Deps: none.
  - **Docs (Mode A):** JSDoc on the six new `FieldConfig` fields (cross-ref
    §6.4.1–§6.4.4) and on `recordKey`; JSDoc note on `ReactFieldConfig`. These
    ride with this subtask — not standalone tasks.

##### Task P1.M1.T2 — Add `resolveFieldOverType` core helper

The single precedence rule (§6.4.0) for all six levers. Implement in
`packages/core/src/config/defaults.ts` (the module that already owns field/type
default resolution), export from `config/index.ts` and the root barrel. This also
satisfies the §1.3.2 table update (the `config/defaults` row now lists
`resolveFieldOverType(fieldVal, typeVal)`).

- **Subtask P1.M1.T2.S1** — Implement `resolveFieldOverType<T>(fieldVal, typeVal)`:
  `return fieldVal !== undefined ? fieldVal : typeVal;`. Pure function, zero deps.
  Export from `config/index.ts` and root `index.ts`. Add unit tests in
  `packages/core/src/__tests__/config.test.ts`: field wins when set (incl.
  `null`, `false`, `0`, `""` honored via `!== undefined`); type wins when field
  is `undefined`; both undefined → `undefined`. Story points: 0.5. Deps: none.
  - **Docs (Mode A):** JSDoc on `resolveFieldOverType` stating it is the single
    rule shared by defaultValue/debounce/parser/formatter/getSubmitField/
    valueField (§6.4.0); update the §1.3.2 `config/defaults` table row wording
    is PRD-only (no action). New public export.

##### Task P1.M1.T3 — Add field-level `defaultValue` tier to `resolveInitialValue`

`resolveInitialValue` (config/defaults.ts) currently has 3 tiers: (1)
`defaultValues` prop, (2) `record[recordKey]`, (3) `inputConfig.defaultValue`.
Insert a new tier between (2) and (3): `fieldConfig.defaultValue` (Priority 3),
honored when `!== undefined`. This makes the final chain (§13.1):
`defaultValues` → `record[recordKey]` → **`fieldConfig.defaultValue`** →
`inputConfig.defaultValue`.

- **Subtask P1.M1.T3.S1** — Insert the field-default tier into
  `resolveInitialValue`. Rationale to encode in a comment: a field default is a
  per-instance fallback; real data (`record`) and explicit per-call overrides
  (`defaultValues`) are authoritative and still win. `resolveAllInitialValues`
  needs **no** change (it delegates to `resolveInitialValue`). Update the
  function's JSDoc priority-order list (currently 3 tiers → 4 tiers).
  Story points: 0.5. Deps: P1.M1.T1.S1.
  - **Docs (Mode A):** Update `resolveInitialValue` JSDoc (priority list +
    example) to include the field-level tier.
- **Subtask P1.M1.T3.S2** — Core tests for the new tier in
  `config.test.ts` (or `defaults` test file): field default wins over type
  default when both set; `record`/`defaultValues` still win over field default;
  `null`/`false`/`0`/`""` field defaults honored via `!== undefined`; field
  default `undefined` falls through to type default. Story points: 0.5. Deps:
  P1.M1.T3.S1.

##### Task P1.M1.T4 — Verify core build/test/coverage

- **Subtask P1.M1.T4.S1** — `pnpm --filter @formality-ui/core build`,
  `pnpm --filter @formality-ui/core test`, `pnpm typecheck`. Confirm
  framework-independence test still passes (core must NOT gain a React/RHF dep).
  Confirm ≥90% coverage. Story points: 0.5. Deps: P1.M1.T3.S2, P1.M1.T2.S1.

#### Milestone P1.M2 — React: thread field-level overrides through resolution sites

Thread the field-over-type rule through the three react resolution sites that
read type-level levers: parse/format (`useField`), debounce (`Form.changeField`),
and submit mapping (`transformValuesForSubmit`). Each site resolves the
**effective** spec once (where both `fieldConfig` and `inputConfig` are in scope)
via `resolveFieldOverType`, then threads it into the existing call.

##### Task P1.M2.T1 — Field-level parser/formatter in `useField`

`packages/react/src/hooks/useField.tsx` currently calls `parse(newValue, inputConfig.parser, ...)` (line ~565) and `format(field.value, inputConfig.formatter, ...)` (line ~617). Resolve the effective spec and pass that instead.

- **Subtask P1.M2.T1.S1** — In `useField`, compute
  `effectiveParser = resolveFieldOverType(fieldConfig.parser, inputConfig.parser)`
  and `effectiveFormatter = resolveFieldOverType(fieldConfig.formatter, inputConfig.formatter)`
  once (memoized as needed), and use them at both the change-handler parse site
  and the Controller-render format site. Import `resolveFieldOverType` from
  `@formality-ui/core`. Story points: 1. Deps: P1.M1.T2.S1, P1.M1.T4.S1.
  - **Docs (Mode A):** Add an inline comment at each site citing §6.4.3
    (effective spec = field `??` type).
- **Subtask P1.M2.T1.S2** — React tests in `useField`/Field test suite: a field
  with `fieldConfig.parser`/`formatter` overrides the type's; field unset falls
  back to type; field `null`/`false`/`0`/`""` honored. Story points: 0.5. Deps:
  P1.M2.T1.S1.

##### Task P1.M2.T2 — Field-level debounce in `Form.changeField`

`packages/react/src/components/Form.tsx` `changeField(name, value, inputConfig?)`
(line ~368) currently reads `inputConfig?.debounce` (line ~386). PRD §11.2 shows
`changeField` resolving `fieldConfig` and `inputConfig` internally from
`config[name]` / `inputs[type]` and applying `fieldConfig.debounce ?? inputConfig.debounce`.

- **Subtask P1.M2.T2.S1** — In `changeField`, resolve `fieldConfig = config[name]`
  and `inputConfig = inputs[fieldConfig?.type ?? "textField"]` from the Form's
  in-scope `config`/`inputs` (these are already closures), then resolve
  `effectiveDebounce = resolveFieldOverType(fieldConfig?.debounce, inputConfig?.debounce)`
  and branch on it (`false` → immediate; `number` → per-field timer; `undefined`
  → Form-level). This keeps the existing per-ms debounced-fn memoization
  (`getOrCreateDebounced`) intact — only the resolved value changes. Decide
  whether to keep the `inputConfig` 3rd param (now redundant) or drop it and
  update `useField`'s call site (line ~573); prefer dropping it for clarity
  since `changeField` now resolves internally (matches PRD §11.2). Story points:
  1.5. Deps: P1.M1.T2.S1, P1.M1.T4.S1.
  - **Docs (Mode A):** Update the JSDoc/comment block above the debounce
    resolution (currently 3 lines, §6.3.3) to state the three-tier precedence:
    `fieldConfig.debounce` → `inputConfig.debounce` → Form-level `debounce` prop
    (default 1000). Also update `InputConfig.debounce` JSDoc in core types
    (config.ts ~66-80) with the same three-tier note (§6.3.3).
- **Subtask P1.M2.T2.S2** — React tests: a field with `fieldConfig.debounce`
  overrides its type's debounce cadence; field `debounce: false` submits
  immediately even when type debounces; field unset falls back to type, then
  Form-level. Extend the existing `autosave-field-debounce.test.tsx` suite.
  Story points: 0.5. Deps: P1.M2.T2.S1.

##### Task P1.M2.T3 — Field-level getSubmitField/valueField in `transformValuesForSubmit`

`packages/react/src/components/Form.tsx` `transformValuesForSubmit` (line ~941)
reads `inputConfig.getSubmitField` (line ~954) and `inputConfig.valueField`
(line ~957) directly. Resolve field-over-type for both.

- **Subtask P1.M2.T3.S1** — In `transformValuesForSubmit`, compute
  `getSubmitField = resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)`
  and `valueField = resolveFieldOverType(fieldConfig?.valueField, inputConfig?.valueField)`,
  pass those to `transformFieldName` / `extractValueField`. Story points: 0.5.
  Deps: P1.M1.T2.S1, P1.M1.T4.S1.
  - **Docs (Mode A):** Inline comment citing §6.4.4 (field `??` type; read/submit
    symmetry with `recordKey`).
- **Subtask P1.M2.T3.S2** — React tests: field-level `getSubmitField`/`valueField`
  override the type's at submit; field unset falls back to type. Story points:
  0.5. Deps: P1.M2.T3.S1.

##### Task P1.M2.T4 — Full verification

- **Subtask P1.M2.T4.S1** — Run the full CI gate locally: `pnpm lint`,
  `pnpm format:check`, `pnpm typecheck`, `pnpm typecheck:examples`,
  `pnpm test:coverage` (≥90% all metrics), `pnpm --filter @formality-ui/core
  --filter @formality-ui/react build`. All green. Story points: 0.5. Deps:
  P1.M2.T1.S2, P1.M2.T2.S2, P1.M2.T3.S2.

#### Milestone P1.M3 — Changeset-level documentation sync (Mode B)

Cross-cutting docs that only make sense once the whole feature is in place.

##### Task P1.M3.T1 — Sync changeset-level docs

- **Subtask P1.M3.T1.S1** — Update `README.md` and any overview/architecture docs
  to reflect the new field-level override capability: (a) FieldConfig now
  mirrors the six type-level levers per-instance (one-line blurb + cross-ref to
  the §6.4 rule); (b) note `resolveFieldOverType` as a new core export. Verify
  README examples still type-check (`pnpm typecheck:examples`). Do not
  re-document the per-field JSDoc (handled Mode A above). Story points: 0.5.
  Deps: P1.M2.T4.S1.
  - If the README does not currently enumerate `FieldConfig` fields, keep the
    update minimal (a "Field-level overrides" note) rather than inventing a new
    section — proportional to actual doc surface.

---

## Implementation Notes & Decisions

1. **One rule, one helper.** All six levers use `resolveFieldOverType`. Do NOT
   inline `fieldVal ?? typeVal` ad hoc — import the helper at each site so the
   `!== undefined` semantics (not `??` truthiness) are identical everywhere and
   auditable in one place (§6.4.0).

2. **`validator` is excluded.** Do NOT add a field-vs-type override for
   `validator` — it composes (field runs, then type), it does not override
   (§6.4, the override-vs-compose asymmetry table). `FieldConfig.validator`
   already exists and composes; leave it alone.

3. **`defaultValue` tier placement is deliberate.** The field default sits
   **below** `record`/`defaultValues` and **above** the type default (§13.1,
   §6.4.1). It is a new priority tier, not a bare `??` of the type default. On
   update, `record[recordKey]` wins naturally; the field default only fills in
   when the fetched record omits the key (§6.4.5). No create-vs-update mode
   gating.

4. **`changeField` resolves internally.** PRD §11.2 shows `changeField` reading
   `config[name]`/`inputs[type]` itself. The current signature passes
   `inputConfig` as a 3rd arg from `useField`; prefer dropping that arg and
   resolving both inside (cleaner, matches the PRD). Update the single call site
   in `useField.tsx`.

5. **Core stays framework-agnostic.** `FieldConfig`'s new fields are all plain
   JS types (`unknown`, `number | false`, `string | fn`, `string`, fn). No React
   or RHF import added to core. The framework-independence test must remain
   green.

6. **Silence contract (Delta 2) needs no work.** It is already implemented and
   tested (see evidence above). Do not create tasks for it; only reference it if
   a code change risks reintroducing a `console.*` in the subscription path.

---

## Definition of Done

- The six field-level override fields exist on `FieldConfig` (core types) and
  pass through `ReactFieldConfig` unchanged.
- `resolveFieldOverType` is exported from `@formality-ui/core` and used at all
  four resolution sites (initial value, parse, format, debounce, getSubmitField,
  valueField — note parse+format+debounce+submit cover the 6 levers across 4
  sites).
- `resolveInitialValue` honors `fieldConfig.defaultValue` at the correct tier.
- All four react sites honor field-over-type.
- Core has no new React/RHF dependency; framework-independence test green.
- ≥90% coverage across all metrics; full CI gate green.
- README + overview docs updated (Mode B).

**No T2.x / T3.x Appendix C work** — that was completed by the previous session.
This delta is §6.4 only.
