# Documentation Staleness Audit — Auto-Save Validity Claims

## Verdict

The five explicitly-listed doc locations are **clean** (no stale whole-form-validity gating claim).
**ONE stale item found:** `examples/06-auto-save.tsx` Example 4 (lines 322, 370, 382).

## Location-by-Location Findings

### Clean (no edit needed)

1. **README.md §"Auto-Save" (~502):** Neutral. `<Form ... autoSave debounce={2000}>` snippet. No validity-scope claim. ✅
2. **README.md capability bullet (~643):** "auto-save requirements with validation awareness." Accurate under NEW behavior. ✅
3. **packages/react/README.md §"Auto-Save" (~279):** Neutral. No validity-scope claim. ✅
4. **packages/react/README.md prop tables (~121, 137):** `autoSave | boolean | Enable auto-save` and `debounce | number | Debounce delay (ms)`. Neutral. ✅
5. **Form.tsx JSDoc (~57-71):** `autoSave?: boolean` ("Enable auto-save on field changes") and `debounce?: number | false` (documents per-field override). Accurate, scoped. ✅
6. **CHANGELOG.md (~27-28):** "Auto-save validation now targets only changed fields, not all fields." Correctly describes NEW behavior. ✅

### STALE (needs fix)

**examples/06-auto-save.tsx** → Example 4 "Auto-Save with Validation":
This file is **linked from README.md line 720** as a user-facing example. It is user-facing documentation.

| Line | Current Text | Problem |
|------|-------------|---------|
| 322 | `// Auto-save only triggers when form is valid` | States OLD whole-form gate as current behavior |
| 370 | `<p>Form only saves when all fields are valid</p>` | False under NEW behavior |
| 382 | `Form valid: {methods.formState.isValid ? "Yes" : "No"}` | Surfaces whole-form isValid as if it gates auto-save |

### Suggested Fix

- Line 322 comment → e.g. `// Auto-save validates only the changed field (and its dependents) before saving`
- Line 370 copy → e.g. `<p>Auto-save saves a change once the edited field (and its dependents) validate; an unrelated invalid field won't block it</p>`
- Line 382 → remove the whole-form isValid display, or reframe as a manual-submit gate indicator
