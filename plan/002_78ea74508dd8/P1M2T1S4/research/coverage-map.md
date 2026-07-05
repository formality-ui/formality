# P1.M2.T1.S4 — Coverage Map (line/branch-exact)

> Baseline captured by running `pnpm test:coverage` in the working tree with
> **S1 + S2 applied** (useFormState.test.tsx, Form.coverage.test.tsx present)
> and **S3 NOT yet applied**. Repo totals at that moment:
> **All files — 91.80% stmt / 89.94% branch / 98.14% func / 91.80% line**.
> (Branch was *just* under 90%; S3 lifts validate.ts/messages.ts, then S4 adds
> the ~92% margin and fixes the worst per-file %s.)
>
> Source of truth: `coverage/coverage-final.json` (istanbul format) parsed for
> each `branchMap`/`fnMap` entry whose hit count is `0`. Every uncovered branch
> is listed below with its **exact source line** + the **concrete test case**
> that covers it. Statement %s below 90% are driven primarily by these
> un-hit branch arms + (for merge.ts) one wholly-uncovered function.

## How to read this map

- `branch` entries come from v8's `branchMap` → each uncovered ARM (true/false
  side of a conditional) is one row. A single `if` often yields 2 rows.
- "(defensive)" marks `default: throw` / dead arms that are only reachable with
  type-forbidden or syntactically-impossible input. These are LOW priority —
  cover only if cheap; otherwise leave (they don't block the ≥90% target).
- After implementing, re-run `pnpm test:coverage` and check the per-file row.

---

## 1. `packages/core/src/expression/evaluate.ts`
Current: **86.36% stmt / 93.10% branch / 100% func**.
Extend: **`packages/core/src/__tests__/expression.test.ts`** (or
`expression.complex.test.ts` — the item LOGIC explicitly permits either; prefer
`expression.test.ts` under the existing `describe("evaluate")` for cohesion).
Existing imports already include `evaluate`, `evaluateDescriptor`.

| Arm | Source line | What it is | Covering test case |
|-----|-------------|-----------|--------------------|
| **E1** | L147 `: String(leftValue ?? "")` | `+` string-concat path, the **left-nullish** arm (`?? ""`). | `evaluate("missing + 'x'", {})` → `"x"` (leftValue undefined → `String(undefined ?? "")` = `""`). Use a string on the right so the concat branch is taken. |
| **E2** | L229 `if (!Number.isFinite(result))` (overflow on `+`) | numeric `+` that overflows to Infinity → warn + `undefined`. | `evaluate("1e308 + 1e308", {})` → `undefined`. (1e308+1e308 = Infinity.) |
| **E3** | L251 `case "!=":` | loose inequality operator arm. | `evaluate("1 != 2", {})` → `true`; `evaluate("1 != '1'", {})` → `false` (loose ==). Optionally also `==` if uncovered. |
| **E4** | L336 `case "Compound":` | jsep `Compound` node (comma / multiple statements) — evaluates last. | `evaluate("1, 2, 3", {})` → `3`. (jsep parses comma-list as Compound.) |
| E5 | L224 `default:` (arithmetic switch throw) | **(defensive)** unknown `-`/`*`/`/`/`%` operator. Unreachable — all 4 cases listed. | SKIP (defensive). |
| E6 | L267 `case "LogicalExpression":` | **(defensive)** — current jsep emits `&&`/`||`/`??` as `BinaryExpression` (per the code comment in the `BinaryExpression` case), so this dedicated `LogicalExpression` case is effectively dead for real strings. | SKIP unless a `jsep` AST of type `LogicalExpression` can be produced; not worth it. |
| E7 | L309 `default:` (unary switch throw) | **(defensive)** unknown unary op. | SKIP. |
| E8 | L346 `default:` (node-type throw) | **(defensive)** unknown AST node type. | SKIP. |

> Expected gain: E1–E4 lift evaluate.ts branch % from 93.1% → ~98% and stmt %
> 86.36% → ~95%+. The 4 defensive arms (E5–E8) are intentionally left; they do
> not affect the ≥90%/≥92% targets.

---

## 2. `packages/core/src/expression/infer.ts`
Current: **76.62% stmt / 75.86% branch / 100% func**.
Extend: **`packages/core/src/__tests__/expression.test.ts`** under the existing
`describe("inferFieldsFromExpression")` / `describe("inferFieldsFromDescriptor")`.

The whole **string-literal scanning loop** (L57–L82) is under-exercised. All
arms below are inside `inferFieldsFromExpression`. Cover with rich string inputs:

| Arm | Source line | What it is | Covering test case |
|-----|-------------|-----------|--------------------|
| **I1** | L82 `if (inString) continue;` | identifier appearing **inside** a string literal is skipped. | `inferFieldsFromExpression('"foo bar"')` → `[]` (the words `foo`/`bar` are inside the string). |
| **I2** | L68 `if (!inString && (char==='"' \|\| ...))` entering string + L74 `if (inString && char===stringChar)` exiting string | the **enter/exit** arms of the string-state machine (both quote types must fire). | `inferFieldsFromExpression("'a' + b")` → `["b"]` (single-quote enter/exit; `a` is inside the string). Also `'signed ? "x" : "y"'` for double quotes. |
| **I3** | L63 `if (char === "\\")` + L58 `if (escapeNext)` | **escape sequence** inside a string literal sets `escapeNext` then skips the next char. | `inferFieldsFromExpression('"a\\"b" + c')` → `["c"]`. The `\\"` exercises backslash-detection (L63) + escapeNext (L58). Use a double-backslash in the TS source so the actual string contains `\"`. |
| **I4** | L158 (end of `inferFieldsFromDescriptor`) | the **primitive** fall-through `return []` (number/boolean/null passed to inferFieldsFromDescriptor). | `inferFieldsFromDescriptor(42)` → `[]`; `inferFieldsFromDescriptor(null)` → `[]`; `inferFieldsFromDescriptor(true)` → `[]`. |

> Expected gain: I1–I4 lift infer.ts stmt 76.62%→~95%, branch 75.86%→~90%+.
> Note: array/object branches of inferFieldsFromDescriptor are ALREADY covered
> by the existing "extract fields from arrays/objects" tests — do not re-add.

---

## 3. `packages/core/src/transform/pipeline.ts`
Current: **85.06% stmt / 84.61% branch / 100% func**.
Extend: **`packages/core/src/__tests__/transform.test.ts`**.

The existing suite covers the happy paths + **inline** parser/formatter errors
but NOT the **named**-parser/formatter error+not-found arms, nor the
default-config `??`/non-number tails.

| Arm | Source line | What it is | Covering test case |
|-----|-------------|-----------|--------------------|
| **T1** | L77 `} catch (error) {` (named-parser try/catch) | a **named** parser that THROWS is caught → warn → return raw value. (Existing test only throws an *inline* parser.) | `parse("v", "boom", { boom: () => { throw new Error("x"); } })` → `"v"`. |
| **T2** | L95 (parse tail — `typeof parserSpec === "function"` arms / final `return value`) | the inline-function-type-check BOTH arms + final defensive return. The existing inline-parser test covers the function SUCCESS; add an assertion that a non-string-non-function spec (cast) returns the value unchanged. | `parse("v", 42 as any)` → `"v"` (final `return value` arm). |
| **T3** | L132 `if (!formatter)` (named formatter **not found**) | a named formatter missing from the config → warn → return value. | `format("v", "nope", {})` → `"v"`. |
| **T4** | L142 `} catch (error) {` (named-formatter try/catch) | a **named** formatter that THROWS is caught → warn → return value. (Existing only throws *inline* formatter.) | `format("v", "boom", { boom: () => { throw new Error("x"); } })` → `"v"`. |
| **T5** | L160 (format tail — function-type arms / final return) | mirror of T2 for format. | `format("v", 42 as any)` → `"v"`. |
| **T6** | L295 `string: (value) => String(value ?? "")` (createDefaultParsers) | the `?? ""` nullish arm of the default `string` parser. | `createDefaultParsers().string(null)` → `""`; `.string(undefined)` → `""`. (Existing test passes `42` → exercises the non-null arm only.) |
| **T7** | L313 `if (typeof value !== "number" \|\| isNaN(value))` (createDefaultFormatters.integer) | the **non-number / NaN** early-return-`""` arm of the default `integer` formatter. | `createDefaultFormatters().integer(NaN)` → `""`; `.integer("x")` → `""`. (Existing only tests `42.9` → `"43"`.) |
| **T8** | L318 `string: (value) => String(value ?? "")` (createDefaultFormatters) | the `?? ""` nullish arm of the default `string` formatter. | `createDefaultFormatters().string(null)` → `""`. |

> Expected gain: T1–T8 lift pipeline.ts stmt 85.06%→~98%, branch 84.61%→~96%.

---

## 4. `packages/core/src/config/merge.ts`
Current: **80.95% stmt / 96.66% branch / 85.71% func** — `createConfigContext`
is **entirely uncovered** (the one missing function).
Extend: **`packages/core/src/__tests__/config.test.ts`**.

| Region | Source line | What it is | Covering test case |
|--------|-------------|-----------|--------------------|
| **C1** | L227–258 `createConfigContext` (whole fn, 0% hit) | merges provider + form configs into the context object used during rendering (inputs via `mergeInputConfigs`, defaultFieldProps via `mergeStaticProps`, selectDefaultFieldProps fallback provider→form). | NEW `describe("createConfigContext")`: call with a `FormalityProviderConfig` (+ optional `FormConfig`) and assert the returned `{inputs, formatters, parsers, validators, errorMessages, defaultFieldProps, selectDefaultFieldProps}` shape. Cover: (a) form inputs merged, (b) form-level `defaultFieldProps` overriding provider's, (c) `formConfig.selectDefaultFieldProps` taking precedence over provider's, (d) provider's `selectDefaultFieldProps` used when form omits it, (e) missing optional `formatters`/`parsers`/`validators`/`errorMessages` → `{}` defaults. |
| **C2** | L91 `} else {` (mergeInputConfigs new-key arm) | object-form form inputs introducing a type NOT present in provider inputs. | `mergeInputConfigs(providerInputs, { custom: { component: "X", defaultValue: "" } })` → `result.custom` defined & === the override (not deepMerged). (Existing object-form test only overrides an EXISTING key → hits the `if (result[type])` TRUE arm; this hits the FALSE/new-key arm.) |

> Expected gain: C1 lifts merge.ts func 85.71%→100% and stmt 80.95%→~98%; C2
> lifts branch 96.66%→100%.

---

## 5. `packages/react/src/components/Field.tsx`
Current: **87.91% stmt / 75.80% branch / 100% func** — by far the worst
per-file branch %. Extend: **`packages/react/src/__tests__/Field.test.tsx`**
using the existing `render` + `FormalityProvider`/`Form`/`Field` harness and the
`TestInput`/`TestSwitch` components + `testInputs` already defined at the top of
the file. Imports already present: `render`, `screen`, `waitFor`, `userEvent`,
`vi`, `Field`, `Form`, `FormalityProvider`, types.

| Arm | Source line | What it is | Covering test case |
|-----|-------------|-----------|--------------------|
| **F1** | L173 `config[name] ?? {}` | field whose name is NOT in `config`. | Render `<Field name="orphan" />` inside a `<Form config={{}}>`; assert it still renders (uses fallback `{}`). |
| **F2** | L176 `typeProp ?? fieldConfig.type ?? "textField"` | (a) the **typeProp** arm — pass `type="switch"` prop; (b) the **default "textField"** arm — field config with no `type` and no prop. | Two tests: one `<Field name="x" type="switch" />` (renders TestSwitch), one config `{ x: {} }` with `<Field name="x" />` (defaults to textField). |
| **F3** | L181 `typeof formConfig.inputs === "function"` | `<Form inputs={...}>` passed as a **function** (transforms provider inputs). | `<Form inputs={(inputs) => ({ textField: { debounce: 500 } })}>` containing a Field; assert it renders. |
| **F4** | L189 loop `if (mergedInputs[key])` BOTH arms | form inputs that **override an existing** type AND **add a new** type. | `<Form inputs={{ textField: {placeholder:"x"}, custom: {component:TestInput, defaultValue:""} }}>`; render both a textField Field and a `type="custom"` Field. |
| **F5** | L198 `resolveInputConfig(type, mergedInputs) ?? {component:"input", defaultValue:""}` | a field whose resolved type is NOT in merged inputs → the input-fallback object. | `<Field name="x" type="totallyUnknown" />`; assert it renders an `<input>` fallback without crashing. |
| **F6** | L264 `if (conditionResult.hasSetCondition)` + L280/L282 `hasCondition && value !== undefined` | a field-level **set** condition (`conditions:[{when:"t", is:"on", set:"forced"}]`) — covers hasSetCondition true + the setValue effect both arms (value defined → setValue; value undefined → skip). | Toggle `t` to "on"; assert the field's value becomes "forced". Then a second condition variant with `selectSet` resolving to undefined to cover the skip arm. |
| **F7** | L267 `if (groupContext.state.hasSetCondition)` | a **FieldGroup** carrying a set condition that applies to child fields. | Wrap Field in `<FieldGroup>` whose conditions include a set; assert child value is set. (Requires a FieldGroup condition with set; see FieldGroup.test.tsx patterns.) |
| **F8** | L308 `if (groupContext.state.isDisabled) return true;` | a Field rendered inside a **disabled FieldGroup** (group disabled OR-ed with field). | Wrap Field in a disabled `<FieldGroup>` (or group with `disabled`); assert the Field input is `disabled`. |
| **F9** | L307 `conditionResult.disabled ?? false` + L322 `conditionResult.visible ?? true` | condition flagged hasDisabled/hasVisible but the action value is undefined → `??` default. | A condition like `{when:"t", is:"on"}` that matches but specifies NEITHER disabled nor visible (still sets hasCondition flags internally if the engine marks them) — OR directly assert the resolution; if hard to force, cover via a condition with `truthy` matcher and no action. Confirm via coverage which arm remains. |
| **F10** | L378 `if (result !== true && result !== undefined)` | the **type-level** validator (`inputConfig.validator`) FAILING path (existing validation tests only exercise the field-level `fieldConfig.validator`). | Define an input type `{ component:TestInput, defaultValue:"", validator:(v)=> v==="" ? "type-level required" : true }` in the provider inputs; render a Field of that type; submit/blur with empty value; assert the type-level error message renders. |
| **F11** | L482 `TemplateComponent ? (...) : (<Component/>)` BOTH arms | (a) a Field rendered THROUGH a template (`inputTemplates[type]` or `defaultInputTemplate`); (b) the **render-prop children** branch (`typeof children === "function"`). | (a) `<FormalityProvider inputs={testInputs} inputTemplates={{ textField: Tpl }} defaultInputTemplate={Tpl2}>` rendering a Field; assert the template wrapper (e.g. a label wrapper) appears. (b) `<Field name="x">{(api) => <div data-testid="rp">{api.fieldState...}</div>}</Field>`; assert `rp` test-id renders (exercises the `children({...})` branch). |

> Expected gain: F1–F11 lift Field.tsx branch 75.80%→~92%+ and stmt 87.91%→~95%.

---

## Summary of expected repo impact (S4 alone, on top of S1+S2+S3)

| File | Before (branch / func) | After target |
|------|------------------------|--------------|
| evaluate.ts | 93.10% / 100% | ~98% / 100% |
| infer.ts | 75.86% / 100% | ~90% / 100% |
| pipeline.ts | 84.61% / 100% | ~96% / 100% |
| merge.ts | 96.66% / 85.71% | 100% / 100% |
| Field.tsx | 75.80% / 100% | ~92% / 100% |

These five are the worst per-file offenders named in the item. Closing them
pushes repo-wide **statements/branches/lines from ~92% to a stable ~93–94%**,
comfortably above the 90% hard gate and the ~92% margin goal. No per-file in-scope
metric should remain below 90% after S4.
