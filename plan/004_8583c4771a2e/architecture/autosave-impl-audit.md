# Auto-Save Implementation Audit — Form.tsx

Audit of `packages/react/src/components/Form.tsx` (879 lines) against PRD §11.1–§11.3.

## Summary

All four specified behaviors are implemented and match the PRD spec. No discrepancies found.

## 1. Scoped Validity Gate (§11.1 point 4) — ✅ MATCHES

Auto-save validates only the changed field + affected/dependent fields. Unrelated invalid fields do NOT block a valid edit.

**Implementation:** `executeAutoSave` — `packages/react/src/components/Form.tsx:549-648`.

- **Gate 1 — changed-field onChange error check** (lines 585-591):
  Iterates `changedFields`, checks `methods.getFieldState(fieldName).error`, returns if any has error.
- **Gate 2 — affected-field revalidation via `methods.trigger`** (lines 594-616):
  Calls `methods.trigger(fieldsToTrigger)`, checks `isValid`, returns if false.
- **Explicit "no whole-form validity check"** — deliberate comment block (lines 620-629).
  No call to `methods.formState.isValid`, no whole-form `methods.trigger()`.

## 2. executeAutoSave Function (§11.2) — ✅ MATCHES

| PRD requirement | Location | Match |
|---|---|---|
| `pendingChangedFields` set | declared `Form.tsx:215`; populated in `changeField:364`; copied+cleared in `executeAutoSave:557-560` | ✅ |
| `getAffectedFields()` function | `Form.tsx:338-356` — traverses `invertedSubscriptions` graph with a worklist | ✅ |
| `pendingAffectedFields` set | declared `Form.tsx:216`; populated in `changeField:367-369` | ✅ |
| Gate 1: changed-field onChange error | `Form.tsx:585-591` | ✅ |
| Gate 2: re-validate affected fields via `methods.trigger` | `Form.tsx:594-616` | ✅ |
| Explicit "no whole-form validity check" | comment block `Form.tsx:620-629` | ✅ |
| Execution-version abort for stale saves | `executionVersionRef` declared `Form.tsx:218`; incremented+captured `Form.tsx:551-552`; re-checked after every `await` at `Form.tsx:579-583`, `598-600`, `612-616` | ✅ |

## 3. Per-Field Debounce Coalescing (§11.3 Example 4) — ✅ MATCHES

**Function:** `getOrCreateDebounced(ms)` — `packages/react/src/components/Form.tsx:650-682`.

| PRD requirement | Location | Match |
|---|---|---|
| `getOrCreateDebounced(ms)` / per-interval memoized debounced fns | `Form.tsx:650-682`; cache `fieldDebouncersRef: Map<number, DebouncedFunction>` declared `Form.tsx:225` | ✅ |
| Fields sharing a debounce ms share one timer | cache keyed by `ms` (line 651-652) | ✅ |
| Faster timer submits whole pending batch | `executeAutoSave` copies BOTH `pendingChangedFields` + `pendingAffectedFields` (lines 557-560) | ✅ |
| Slower timer that fires with nothing pending is a no-op | `executeAutoSave` early-returns when `changedFields.size === 0` (line 566-568) | ✅ |
| No-debounce (`undefined`) falls back to Form-level `debounce` prop | `changeField` else-branch `Form.tsx:385-388` → `debouncedSubmitRef.current?.()` | ✅ |

## 4. changeField Branching (§11.2) — ✅ MATCHES

**Function:** `changeField` — `packages/react/src/components/Form.tsx:358-392`.

Three-way branch on `inputConfig.debounce` (lines 372-389):
- `false` → immediate `executeAutoSaveRef.current?.()` (line 376-378)
- `number` → `getOrCreateDebouncedRef.current?.(fieldDebounce)()` (line 382)
- `undefined` → `debouncedSubmitRef.current?.()` (line 385-388)
