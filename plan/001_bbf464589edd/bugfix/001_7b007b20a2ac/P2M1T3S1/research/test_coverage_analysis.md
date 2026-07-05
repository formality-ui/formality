# Test Coverage Analysis for JSX Disabled Prop Priority

## Existing Test Coverage

### useFieldDisabledState.test.tsx

Tests the hook in isolation with `renderHook`:

- JSX prop over config (lines 47-60)
- JSX prop false over config true (lines 62-74)
- JSX prop when all other sources undefined (lines 76-86)
- Full priority chain (lines 271-329)

**Limitation**: Tests hook behavior directly, not full Field component integration

### Field.test.tsx

Tests the Field component:

- disabled prop over condition result (lines 429-450)
- disabled prop to force disable (lines 452-467)

**Limitation**: Tests only 1-2 sources at a time, never all sources active simultaneously

## Test Coverage Gap

**Missing**: Integration-level test with ALL sources active and conflicting

### Specific Gap Scenarios

1. **JSX disabled={true} wins against ALL other sources disabled={false}**
   - JSX: `disabled={true}`
   - Config: `disabled: false`
   - Conditions: evaluate to `disabled: false`
   - Expected: field is disabled (JSX wins)

2. **JSX disabled={false} wins against ALL other sources disabled={true}**
   - JSX: `disabled={false}`
   - Config: `disabled: true`
   - Conditions: evaluate to `disabled: true`
   - Expected: field is enabled (JSX wins)

3. **Dynamic prop change while all sources active**
   - Start with JSX `disabled={true}`, all others `disabled={false}`
   - Change JSX to `disabled={false}`
   - Expected: field becomes enabled immediately

4. **Full priority chain verification in Field component**
   - Verify DOM reflects correct disabled state
   - Verify input element has correct `disabled` attribute
   - Verify user cannot interact when disabled

## Why This Gap Matters

1. **Integration Testing**: Hook tests don't catch integration bugs between hook and Field component
2. **DOM Verification**: Hook tests don't verify actual DOM state
3. **User Experience**: Only Field tests verify actual user-facing behavior
4. **Edge Cases**: Conflicting sources from all layers is a real-world scenario

## Test Approach

Use `@testing-library/react` patterns:

- Render Field with conflicting disabled sources
- Verify DOM state with `toBeDisabled()` / `not.toBeDisabled()`
- Test dynamic prop changes with `rerender()`
- Test user interaction with `userEvent`
