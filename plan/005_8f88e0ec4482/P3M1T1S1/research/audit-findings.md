# Research Notes — P3.M1.T1.S1 Core PRD Compliance Audit

## 1. Baseline (verified 2026-07-13)

| Check | Result |
|-------|--------|
| `pnpm --filter @formality-ui/core exec vitest run` | ✅ **606 passed (10 test files)** |
| Framework-independence test | ✅ **14 tests** (matches item description) |
| `pnpm typecheck` (tsc --build) | ✅ Clean (per system_context.md) |
| `validate()` exported from validation/index.ts | ✅ line 4 |
| `mergeConfigs()` exported from config/index.ts | ✅ line 4 |
| `sortFieldsByOrder` in config/ordering.ts | ✅ (G1 relocated, P1.M1 complete) |
| All §1.3.2 required exports present in core/src/index.ts | ✅ verified by reading |

## 2. PRD §1.3.2 API surface vs implementation — FULLY COMPLIANT

Mapping (the heart of check (a) "all required functions exist and are exported"):

| Module (§1.3.2) | Required export | Implementation file:fn | Status |
|-----------------|-----------------|------------------------|--------|
| expression/evaluate | `evaluate(expr, context)` | expression/evaluate.ts: `evaluate` | ✅ |
| expression/infer | `inferFieldsFromDescriptor(descriptor)` | expression/infer.ts: `inferFieldsFromDescriptor` | ✅ |
| expression/context | `buildEvaluationContext(fields, record, props)` | expression/context.ts: `buildEvaluationContext` | ✅ |
| conditions/evaluate | `evaluateConditions(conditions, state)` | conditions/evaluate.ts: `evaluateConditions(input)` | ✅ obj-arg, G4 documented |
| validation/validate | `validate(value, rules, validators, formValues)` | validation/validate.ts: `validate` (P1.M2 added) | ✅ |
| validation/messages | `resolveErrorMessage(error, messages)` | validation/messages.ts: `resolveErrorMessage` | ✅ |
| transform/pipeline | `parse(value, parser)`, `format(value, formatter)` | transform/pipeline.ts: `parse`, `format` | ✅ |
| config/merge | `mergeConfigs(provider, form, field)` | config/merge.ts: `mergeConfigs` (P1.M2 added) | ✅ |
| config/defaults | `resolveInitialValue(record, config, inputConfig)` | config/defaults.ts: `resolveInitialValue` — superset | ✅ G5 documented |
| config/ordering | `sortFieldsByOrder(fields, config)` | config/ordering.ts: `sortFieldsByOrder` (P1.M1 relocated) | ✅ |
| labels/resolve | `resolveLabel(config, fieldName)` | labels/resolve.ts: `resolveLabel` — superset | ✅ G5 documented |
| types/* | All type definitions | types/*.ts | ✅ |

**Signature deviations (check b): G4 + G5 are DOCUMENTED in JSDoc** (P1.M3.T1.S1 complete):
- G4: `evaluateConditions(input: EvaluateConditionsInput)` — matches PRD's own example code; table text is stale. Documented in conditions/evaluate.ts.
- G5: `resolveInitialValue` + `resolveLabel` use richer superset signatures. Documented in config/defaults.ts + labels/resolve.ts.

## 3. Test coverage of item-description's 5 specific verifications

| Verification area | PRD ref | Tested? | Evidence |
|-------------------|---------|---------|----------|
| Expression path resolution (qualified vs unqualified, dual context) | §5.4.1 | ✅ YES | expression.test.ts L200/217/236; expression.complex.test.ts "Qualified Access (fields.*)" L308, "Unqualified Access (via Proxies)" L378 |
| Condition matching (OR disabled / AND visible / last-wins set) | §8.7.1-7.7.3 | ✅ YES | conditions.test.ts "should use OR logic for disabled" L48, "AND logic for visible" L79, "last matching setValue" L107 |
| Validation rules layer (named/factory/array/error messages) | §10.9.1-9.6 | ✅ YES | validation.test.ts: `validate`, `runValidator`, `composeValidators`, `resolveErrorMessage` (55 tests) |
| Transform pipeline (parse/format/submit) | §11.10.1-10.6 | ✅ YES | transform.test.ts parse/format/extractValueField/transformFieldName |
| **Parser/formatter inverse contract** | **§11.10.7** | ❌ **NO — THE GAP** | grep for inverse/round-trip/parse(format across all core tests = NONE |
| Initial value resolution (priority + recordKey) | §14.13.1-13.6 | ✅ YES | config.test.ts "resolveInitialValue" L393+ (defaultValues first L394, recordKey L406, fallback L430/437) |

## 4. THE GAP (TDD work for this audit)

**Parser/formatter inverse contract (PRD §11.10.7)** — explicitly required:
> "Parsers and formatters MUST be inverses of each other... Test all parser/formatter pairs with real data to ensure no precision loss."

**Current state:** NO test in `packages/core/src/__tests__/` verifies `parse(format(value)) === value`
for matching-precision pairs (createFloatParser + createFloatFormatter(2/3/4)), nor documents the
precision-mismatch case (the PRD's "Invalid" example).

**Expected behavior (verified by reading transform/pipeline.ts):**
- `createFloatParser()` (fallback 0) + `createFloatFormatter(2)`: `parse(format(42.69))` → 42.69 ✓ round-trips
- Default formatters (float2/float3/float4) pair with the default float parser
- This is a VERIFICATION test — the functions already work; the test proves compliance (TDD: write test → passes → gap closed). NOT a behavioral bug.

**G9 context (gap_analysis):** `precision` field on InputConfig is DEFERRED (named-formatter approach is equivalent). The inverse-contract test must use MATCHING precision pairs and document mismatch as consumer responsibility.

## 5. Scope boundaries (NOT gaps — by design)

- **Validation 4-layer composition (§10.9.1 "RHF rules → field → type → form"):** core provides ONLY the RULES-layer building blocks (`validate`, `runValidator`, `composeValidators`). The 4-layer wiring lives in the React adapter's `Field` Controller `rules.validate` (validated.ts JSDoc explicitly states this). Auditing the layer composition is **P3.M1.T1.S2 (react audit)**, out of scope here. Core's job: the rules-layer primitives are correct & tested. ✅
- **§4 Context System, §9 Subscription System:** mostly React (providers, hooks, inverted index). Core contributes: expression context building (`buildFormContext`/`buildFieldContext`/`buildEvaluationContext`). Already audited via expression tests.
- **§6 Component Specs, §12-§13 FieldGroup, §20 forwardRef:** React package — P3.M1.T1.S2.

## 6. §19 edge cases relevant to core (check c)

| §19 case | Core handling | Tested? |
|----------|---------------|---------|
| 18.4 Empty/Null/Undefined (type-based empties) | `getInputDefaultValue` (switch→false, autocomplete→null, decimal→""), `isEmptyValue` | config.test.ts — verify in audit |
| 18.5 Formatter display vs submit value | `extractValueField` + `transformFieldName` (submit pipeline, NOT display) | transform.test.ts ✅ |
| 18.7 Record vs Form Values | expression dual context: `record.*` vs unqualified→`fields.*.value` | expression tests ✅ |
| 18.8 ValueField on Submit Only | `resolveInitialValue` does NOT use valueField (correct — valueField is submit-only via `extractValueField`) | verify in audit (no valueField in defaults.ts) ✅ by design |

## 7. Conventions for deliverables

- **Test file naming:** `packages/core/src/__tests__/*.test.ts` (flat, no subdirs). Existing "Coverage backfill" pattern in transform.test.ts uses numbered `// T1:`, `// T2:` comments citing PRD sections.
- **Test imports:** `import { ... } from "../index"` (barrel) — see transform.test.ts:10, conditions.test.ts:4.
- **Test framework:** vitest (`describe`/`it`/`expect`, `vi.spyOn(console, "warn")` for warn-gated branches).
- **No existing AUDIT/compliance doc** in repo → create new `packages/core/PRD_AUDIT.md`.
- **Root validation commands:** `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test:coverage`. Core-only: `pnpm --filter @formality-ui/core exec vitest run`.

## 8. Parallel-work boundary

P2.M2.T1.S1 (running concurrently) edits `packages/react/src/overlays.ts` (JSDoc prose). It does NOT touch the core package. No conflict. This audit is core-only.
