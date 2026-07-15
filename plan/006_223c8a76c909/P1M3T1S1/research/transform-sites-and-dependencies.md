# Research — P1.M3.T1.S1: Wire effective parser/formatter via `resolveFieldOverType` in `useField`

Verified findings from reading the actual codebase (all line numbers from
current `packages/react/src/hooks/useField.tsx` unless noted).

## 1. Input dependencies (both COMPLETE in code)

### `resolveFieldOverType` (P1.M1.T1.S2 — COMPLETE)
- Lives in `packages/core/src/config/defaults.ts` (top of file).
- Signature: `export function resolveFieldOverType<T>(fieldVal: T | undefined, typeVal: T | undefined): T | undefined`
  → returns `fieldVal !== undefined ? fieldVal : typeVal`.
- **Exported from `@formality-ui/core`**: confirmed at
  `packages/core/src/index.ts:127` and `packages/core/src/config/index.ts:15`.
  ⇒ importable by name from `@formality-ui/core` in the React package.
- Uses `!== undefined` (NOT `??`) → `null` / `false` / `0` / `""` are
  meaningful overrides (§6.4.0 / §6.4.5).

### `FieldConfig.parser` / `.formatter` (P1.M1.T1.S1 — COMPLETE)
- `packages/core/src/types/config.ts` → `FieldConfig` interface:
  - `parser?: string | ((value: unknown) => unknown);` (inline JSDoc ref §6.4.3)
  - `formatter?: string | ((value: unknown) => unknown);` (inline JSDoc ref §6.4.3)
- `config` in `FormContext` (`packages/react/src/context/FormContext.ts:28`) is
  typed `FormFieldsConfig` = `Record<string, FieldConfig>`, so
  `config[name] ?? {}` (useField.tsx line ~388) is a `FieldConfig` and
  `fieldConfig.parser` / `fieldConfig.formatter` are valid type-level accesses.

## 2. The two transform sites in useField.tsx (EXACT current text)

### Site (a) — `handleChange` (parse), useCallback
```typescript
  const handleChange = useCallback(
    (onChange: (value: unknown) => void) => (newValue: unknown) => {
      // Parse value
      const parsedValue = parse(
        newValue,
        inputConfig.parser,        // ← L565: replace with effectiveParser
        providerConfig.parsers,
      );
      onChange(parsedValue);
      changeField(name, parsedValue, inputConfig);
    },
    [
      inputConfig.parser,          // ← L576: replace with effectiveParser
      providerConfig.parsers,
      changeField,
      name,
      inputConfig,
    ],
  );
```
- `parse` is imported from `@formality-ui/core`.
- `parse(value, parserSpec?, namedParsers?)` — `parserSpec` is the effective spec;
  `namedParsers` (the registry) stays `providerConfig.parsers` UNCHANGED.

### Site (b) — Controller render callback (format), inline (NOT memoized)
```typescript
        // Format value for display   (inside <Controller render={...}>)
        const formattedValue = format(
          field.value,
          inputConfig.formatter,    // ← L617: replace with effectiveFormatter
          providerConfig.formatters,
        );
```
- `format(value, formatterSpec?, namedFormatters?)`.
- This callback is inline JSX — there is NO separate `useCallback`/`useMemo`
  dep array to update for the formatter; the `effectiveFormatter` `useMemo`
  (deps `[fieldConfig.formatter, inputConfig.formatter]`) IS the memo, and the
  inline callback just closes over its value.

## 3. Scope boundary — `changeField` does NOT parse/format

`changeField` is defined in `packages/react/src/components/Form.tsx:368`:
```typescript
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    // Auto-save trigger — resolves inputConfig?.debounce ONLY.
    // (false → immediate; number → per-field timer; undefined → Form-level)
    ...
  },
  [autoSave, getAffectedFields],
);
```
- It consumes `inputConfig?.debounce` for auto-save cadence. **Debounce wiring
  via `resolveFieldOverType` is P1.M3.T2.S1's scope** (separate task).
- The `changeField(name, parsedValue, inputConfig)` call in `handleChange` is
  therefore UNCHANGED by this task. Do NOT thread an effective debounce here.

## 4. Current import block (useField.tsx top)

```typescript
import {
  resolveInputConfig,
  mergeFieldProps,
  resolveLabel,
  parse,
  format,
  runValidator,
  resolveErrorMessage,
} from "@formality-ui/core";
```
→ add `resolveFieldOverType,` (single addition).

## 5. Placement of the two new `useMemo`s

`fieldConfig` (line ~388) and `inputConfig` (useMemo ending ~L420) are both in
scope by the time the `// === CHANGE HANDLER ===` section begins (L557). Place
the two effective-transform `useMemo`s immediately ABOVE `// === CHANGE HANDLER`
(both are plain top-level hooks, no conditional — hooks-rules safe).

## 6. Test landscape

- `packages/react/src/__tests__/useField.test.tsx` (267 lines): tests the
  `UseFieldReturn` contract + watcher ownership via `renderHook` against a REAL
  `<FormalityProvider><Form>` wrapper. Has NO parse/format value-transformation
  tests today.
- `packages/react/src/__tests__/Field.test.tsx` has a `describe("value
  transformation")` block (L~319) with two existing tests:
  - `"should apply parser on change"` (L321) — type-level inline parser via
    `inputs.textField.parser`, asserts committed form value via
    `methods.watch("name")`.
  - `"should apply formatter for display"` (L353) — type-level inline formatter
    via `inputs.textField.formatter`, asserts rendered display value via
    `screen.getByTestId("name")`.
  - These use `TestInput` (renders an `<input>` with `data-testid={name}`,
    `forwardRef`, `onChange`), `userEvent.setup().type(...)`, and the Form
    render-prop `{({ methods }) => ...}`. **Reuse this harness for the new
    field-level-override variants.**
- `packages/core/src/transform/pipeline.ts`: `parse`/`format` definitions —
  when `parserSpec`/`formatterSpec` is `undefined`, they return the value
  as-is (so no-op when neither field nor type sets a spec — existing behavior).

## 7. Parallel-execution safety

- P1.M2.T1.S1 (in flight) edits `packages/core/src/config/defaults.ts` +
  `packages/core/src/__tests__/config.test.ts` (core). **Zero file overlap**
  with this task (useField.tsx + Field.test.tsx + types/config.ts JSDoc).
- This task's only core edit is the two-line JSDoc update on
  `InputConfig.parser`/`.formatter` in `packages/core/src/types/config.ts` —
  disjoint from defaults.ts/config.test.ts.
- No barrel/export changes (S3 already exported `resolveFieldOverType`).

## 8. Validation commands (root package.json)
- `pnpm test` (vitest run) — full suite + 90/90/90/90 coverage gate.
- `pnpm typecheck` (tsc --build across core + react).
- `pnpm lint` (eslint .), `pnpm format:check` (prettier --check .),
  `pnpm format` (prettier --write .).
- Targeted: `pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "value transformation"`.
