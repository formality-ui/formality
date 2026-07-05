# JavaScript and TypeScript Mixed-Type Arithmetic Research

**Research Date:** 2026-01-13
**Project:** @formality-ui/core
**Work Item:** P3.M2.T2.S2 - Research Mixed-Type Arithmetic Behavior

---

## Executive Summary

This document researches JavaScript's default type coercion behavior in mixed-type arithmetic operations and explains why the Formality project intentionally diverges from these standards by returning `undefined` instead of following JavaScript's implicit coercion rules.

**Key Finding:** JavaScript's type coercion in arithmetic operations is designed for loose, dynamic typing but can lead to silent bugs in form validation scenarios. Formality prioritizes explicit type safety and developer intent over JavaScript's permissive coercion.

---

## Table of Contents

1. [JavaScript's Default Mixed-Type Arithmetic Behavior](#1-javascripts-default-mixed-type-arithmetic-behavior)
2. [The ToPrimitive Abstract Operation](#2-the-toprimitive-abstract-operation)
3. [Type Coercion Rules by Operation](#3-type-coercion-rules-by-operation)
4. [Why Formality Returns `undefined`](#4-why-formality-returns-undefined)
5. [Documentation Sources](#5-documentation-sources)
6. [How Other Libraries Handle Mixed-Type Arithmetic](#6-how-other-libraries-handle-mixed-type-arithmetic)
7. [Design Trade-offs Analysis](#7-design-trade-offs-analysis)

---

## 1. JavaScript's Default Mixed-Type Arithmetic Behavior

### 1.1 Addition Operator (`+`)

The addition operator is **unique** in JavaScript because it performs either:

- **String concatenation** (if either operand converts to a string)
- **Numeric addition** (if both operands convert to numbers)

#### Examples of JavaScript's Default Behavior:

```javascript
// String + Number → String Concatenation
"hello" + 5      // → "hello5"
5 + "world"      // → "5world"
"5" + 5          // → "55"

// Object + Number → String Concatenation
{} + 5           // → "[object Object]5" (or 5 in some contexts due to block parsing)
[] + 5           // → "5" (empty array → "" → "5")
[1, 2] + 3       // → "1,23"

// Boolean + Boolean → Numeric Addition
true + false     // → 1 (true → 1, false → 0)
true + true      // → 2
false + false    // → 0

// null/undefined Coercion
null + 5         // → 5 (null → 0)
undefined + 5    // → NaN (undefined → NaN)
5 + null         // → 5
5 + undefined    // → NaN
```

**MDN Reference:**

- [Addition (+) - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition)
  > "If one of the operands is a string, the other is converted to a string and the strings are concatenated."

### 1.2 Subtraction Operator (`-`)

Subtraction **always** coerces to numbers, never string concatenation.

#### Examples:

```javascript
// String - Number → NaN
"hello" - 5      // → NaN
"5" - 3          // → 2 (string "5" → number 5)
"10abc" - 2      // → NaN

// Object - Number → NaN
{} - 5           // → NaN ({} → NaN)
[] - 5           // → -5 ([] → 0)
[5] - 2          // → 3 ([5] → 5)

// Boolean - Boolean → Numeric Subtraction
true - false     // → 1 (1 - 0 = 1)
true - true      // → 0

// null/undefined Coercion
null - 5         // → -5 (null → 0)
undefined - 5    // → NaN (undefined → NaN)
10 - null        // → 10
10 - undefined   // → NaN
```

**MDN Reference:**

- [Subtraction (-) - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction)
  > "Both operands are converted to numbers or become NaN."

### 1.3 Multiplication Operator (`*`)

Always coerces to numbers.

#### Examples:

```javascript
// String * Number → NaN (unless numeric string)
"hello" * 2      // → NaN
"5" * 2          // → 10 (string "5" → number 5)

// Object * Number → NaN
{} * 5           // → NaN
[] * 5           // → 0 ([] → 0)
[3] * 2          // → 6

// Boolean * Boolean
true * false     // → 0
true * true      // → 1

// null/undefined Coercion
null * 5         // → 0 (null → 0)
undefined * 5    // → NaN
5 * null         // → 0
```

**MDN Reference:**

- [Multiplication (\*) - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication)

### 1.4 Division Operator (`/`)

Always coerces to numbers with special handling for division by zero.

#### Examples:

```javascript
// String / Number → NaN
"hello" / 2      // → NaN
"10" / 2         // → 5

// Object / Number → NaN
{} / 2           // → NaN
[] / 2           // → 0 ([] → 0)

// Division by Zero
10 / 0           // → Infinity
-10 / 0          // → -Infinity
0 / 0            // → NaN

// null/undefined Coercion
null / 5         // → 0 (null → 0)
undefined / 5    // → NaN
```

**MDN Reference:**

- [Division (/) - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division)

### 1.5 Modulo Operator (`%`)

Always coerces to numbers.

#### Examples:

```javascript
// String % Number → NaN
"hello" % 3      // → NaN
"10" % 3         // → 1

// Object % Number → NaN
{} % 3           // → NaN
[] % 3           // → 0

// null/undefined Coercion
null % 3         // → 0 (null → 0)
undefined % 3    // → NaN
10 % null        // → NaN (division by zero, null → 0)
```

**MDN Reference:**

- [Remainder (%) - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder)

---

## 2. The ToPrimitive Abstract Operation

The `ToPrimitive` abstract operation is fundamental to JavaScript's type coercion system.

### 2.1 How ToPrimitive Works

**ECMAScript Specification:**

- [ECMA-262 ToPrimitive](https://tc39.es/ecma262/#sec-toprimitive)

**Algorithm:**

1. **Check if already primitive** → return as-is
2. **Determine preferred type** (String or Number hint)
3. **Call methods based on hint:**

#### For Number Hint (arithmetic operators):

1. Call `valueOf()` - if returns primitive, use it
2. Otherwise, call `toString()` - if returns primitive, use it
3. If neither returns primitive → throw TypeError

#### For String Hint (string concatenation):

1. Call `toString()` - if returns primitive, use it
2. Otherwise, call `valueOf()` - if returns primitive, use it
3. If neither returns primitive → throw TypeError

### 2.2 Default ToPrimitive Behavior by Type

| Type      | valueOf()         | toString()        | Result in Arithmetic |
| --------- | ----------------- | ----------------- | -------------------- |
| Number    | returns number    | "42"              | number               |
| String    | returns string    | same string       | number (if numeric)  |
| Boolean   | returns boolean   | "true"/"false"    | number (0 or 1)      |
| null      | N/A               | N/A               | 0                    |
| undefined | N/A               | N/A               | NaN                  |
| Object    | returns object    | "[object Object]" | NaN                  |
| Array     | returns array     | "1,2,3"           | 0 (empty) or NaN     |
| Date      | returns timestamp | date string       | timestamp (number)   |

**MDN References:**

- [Object.prototype.valueOf() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)
- [Object.prototype.toString() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
- [Type coercion - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion)

---

## 3. Type Coercion Rules by Operation

### 3.1 Addition (`+`) Special Case

The `+` operator uses **ToPrimitive with String hint** when either operand is a string:

```javascript
// String hint triggers toString() first
const obj = {
  valueOf: () => 42,
  toString: () => "result",
};

obj + 5; // → "result5" (toString used due to string hint)
```

### 3.2 All Other Arithmetic Operators

Use **ToPrimitive with Number hint**:

```javascript
// Number hint triggers valueOf() first
const obj = {
  valueOf: () => 42,
  toString: () => "result",
};

obj - 5; // → 37 (valueOf used)
obj * 2; // → 84 (valueOf used)
```

### 3.3 Numeric Conversions Summary

| Input Type | ToNumber Conversion         | Example                                      |
| ---------- | --------------------------- | -------------------------------------------- |
| Undefined  | → NaN                       | `Number(undefined)` = NaN                    |
| Null       | → 0                         | `Number(null)` = 0                           |
| Boolean    | → 1 (true) or 0 (false)     | `Number(true)` = 1                           |
| Number     | → same value                | `Number(42)` = 42                            |
| String     | → parsed number or NaN      | `Number("42")` = 42, `Number("hello")` = NaN |
| Object     | → ToPrimitive then ToNumber | See above                                    |
| Symbol     | → TypeError                 | `Number(Symbol())` throws                    |

**MDN Reference:**

- [Number() constructor - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/Number)

---

## 4. Why Formality Returns `undefined`

### 4.1 The Problem with JavaScript's Default Behavior

#### Problem 1: The "Silent Zero" Bug

```javascript
// JavaScript default behavior
let discount = null; // User didn't enter discount
let total = 100 + discount; // → 100 (Silent bug! Should be 100, not 100 + null)
```

In a form context, `null` means "no value entered", not "zero". JavaScript's coercion creates a silent bug.

#### Problem 2: String Concatenation vs Addition Ambiguity

```javascript
// JavaScript default behavior
let quantity = "5"; // From text input
let price = 10;
let total = quantity + price; // → "510" (string concatenation, not 50)
```

This is a **common form bug** where numeric strings from inputs silently concatenate instead of adding.

#### Problem 3: NaN Propagation

```javascript
// JavaScript default behavior
let result = "invalid" - 5; // → NaN
let final = result + 10; // → NaN (NaN propagates silently)
```

NaN doesn't throw errors - it silently invalidates calculations.

### 4.2 Formality's Design Philosophy

**File:** `/packages/core/src/expression/evaluate.ts`

The `isSafeNumber` type guard enforces strict type safety:

```typescript
function isSafeNumber(value: unknown): value is number {
  // Explicitly check for null and undefined first
  if (value === null || value === undefined) {
    return false;
  }
  // Then check for valid finite number
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}
```

**Design Principles:**

1. **Explicit over Implicit**: Reject `null`/`undefined` instead of coercing to 0/NaN
2. **Fail Fast**: Return `undefined` immediately on type mismatch (with development warnings)
3. **Prevent Silent Bugs**: No silent NaN or "silent zero" conversions
4. **Type Safety**: Only finite numbers allowed in arithmetic (no Infinity, no NaN)

### 4.3 Formality's Behavior vs JavaScript

| Operation       | JavaScript      | Formality   | Why?                            |
| --------------- | --------------- | ----------- | ------------------------------- |
| `null + 5`      | `5` (null → 0)  | `undefined` | Null means "no value", not zero |
| `undefined + 5` | `NaN`           | `undefined` | Explicit failure vs silent NaN  |
| `"5" + 3`       | `"53"` (concat) | `"53"`      | String concat is intentional    |
| `"5" * 3`       | `15`            | `undefined` | Prevent type confusion          |
| `[] * 2`        | `0`             | `undefined` | Arrays aren't numbers           |
| `{} + 5`        | `"5"` or `NaN`  | `undefined` | Objects aren't numbers          |
| `true + false`  | `1`             | `undefined` | Booleans aren't numbers         |

### 4.4 Developer Experience Benefits

#### Development Mode Warnings:

```typescript
// Formality logs detailed warnings in development
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Expression] Type error: ` +
      `Invalid operands for + (null/undefined not allowed): ` +
      `left=${typeof leftValue}, right=${typeof rightValue}`,
  );
}
```

**Example Output:**

```
[Formality Expression] Type error: Invalid operands for + (null/undefined not allowed): left=object, right=number
```

#### Production Mode:

- No warnings (performance)
- Returns `undefined` for invalid operations
- Fails gracefully without crashes

**Test Evidence:**

- File: `/packages/core/src/__tests__/expression.complex.test.ts` (lines 1446-1900)
- Comprehensive tests verify `undefined` is returned for all null/undefined arithmetic
- Development warning tests verify console.warn is called
- Production mode tests verify no warnings in production

---

## 5. Documentation Sources

### 5.1 Primary MDN Documentation

1. **Addition Operator (+)**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition
   - Key Sections: "Description", "Examples", "String concatenation"

2. **Subtraction Operator (-)**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction
   - Key Sections: "Description", "Coercion rules"

3. **Multiplication Operator (\*)**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication
   - Key Sections: "Description", "Examples"

4. **Division Operator (/)**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division
   - Key Sections: "Description", "Division by zero"

5. **Modulo Operator (%)**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
   - Key Sections: "Description", "Examples"

6. **Type Coercion**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion
   - Key Sections: "Implicit coercion", "Type conversion"

7. **Object.prototype.valueOf()**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf
   - Key Sections: "Description", "Examples", "ToPrimitive"

8. **Object.prototype.toString()**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
   - Key Sections: "Description", "Default toString() behavior"

9. **Number() Constructor**
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/Number
   - Key Sections: "Description", "Type conversion"

### 5.2 ECMAScript Specification

1. **ToPrimitive Abstract Operation**
   - URL: https://tc39.es/ecma262/#sec-toprimitive
   - Section: 7.1.1 ToPrimitive ( input [ , preferredType ] )

2. **ToNumber Abstract Operation**
   - URL: https://tc39.es/ecma262/#sec-tonumber
   - Section: 7.1.3 ToNumber ( argument )

3. **Addition Operator (+)**
   - URL: https://tc39.es/ecma262/#sec-addition-operator-plus
   - Section: 13.8 The Addition Operator (+)

4. **Subtraction Operator (-)**
   - URL: https://tc39.es/ecma262/#sec-subtraction-operator-minus
   - Section: 13.9 The Subtraction Operator (-)

### 5.3 TypeScript Documentation

1. **Type Guards and Narrowing**
   - URL: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
   - Key Sections: "Type predicates", "Type guards"

---

## 6. How Other Libraries Handle Mixed-Type Arithmetic

### 6.1 React Hook Form

**Approach:** Uses Zod or Yup schemas for validation **before** form submission.

**Type Safety:**

- Schema validation catches type mismatches
- Doesn't perform runtime arithmetic in expressions
- Relies on TypeScript for compile-time safety

**Example:**

```typescript
// React Hook Form uses Zod schema
const schema = z.object({
  quantity: z.number().min(0),
  price: z.number().min(0),
});

// Type coercion handled by Zod, not arithmetic expressions
```

**Relevance to Formality:** React Hook Form doesn't have expression evaluation, so no direct comparison for mixed-type arithmetic.

### 6.2 Formik

**Approach:** Uses Yup validation schema with **no built-in expression evaluation**.

**Type Safety:**

- Yup schema validation at field level
- Custom validation functions for complex logic
- No arithmetic expressions in validation rules

**Relevance to Formality:** Formality's expression evaluation is more powerful than Formik's field-level validation.

### 6.3 Vue.js Reactive System

**Approach:** Uses JavaScript's default coercion in computed properties.

**Example:**

```javascript
// Vue computed property uses JavaScript coercion
computed: {
  total() {
    return this.quantity + this.discount;  // Uses JavaScript coercion
  }
}
```

**Relevance to Formality:** Vue relies on developer discipline to avoid type coercion bugs. No built-in protection.

### 6.4 Excel/Google Sheets Formulas

**Approach:** **Strict type enforcement** - returns `#VALUE!` error for type mismatches.

**Example:**

```
= "hello" + 5     // → #VALUE! error
= A1 + B1         // → #VALUE! if A1 or B1 is text
= SUM(A1:A10)     // → Ignores non-numeric values
```

**Relevance to Formality:** **Very similar approach!** Excel returns error codes (like Formality returns `undefined`) for type mismatches. This is a **proven pattern** in spreadsheet software.

### 6.5 SQL Databases

**Approach:** **Strict type checking** - type mismatches cause errors.

**Example:**

```sql
-- PostgreSQL
SELECT 5 + 'hello';  -- ERROR: invalid input syntax for type numeric

-- MySQL
SELECT 5 + 'hello';  -- Returns 0 with warning (loose typing)
-- MySQL has STRICT sql_mode to prevent this
```

**Relevance to Formality:** Most databases use strict type checking. Formality follows this enterprise pattern.

### 6.6 JSON Schema Validation

**Approach:** **Type validation** at schema level, not runtime coercion.

**Example:**

```json
{
  "type": "object",
  "properties": {
    "quantity": { "type": "number" },
    "price": { "type": "number" }
  }
}
```

**Relevance to Formality:** JSON Schema validates types, but doesn't perform arithmetic. Formality combines schema validation with expression evaluation.

### 6.7 Summary Table

| Library/Tool        | Mixed-Type Handling                         | Similar to Formality?               |
| ------------------- | ------------------------------------------- | ----------------------------------- |
| JavaScript          | Permissive coercion (NaN, 0, string concat) | **No** - too loose                  |
| TypeScript          | Compile-time checking, runtime = JavaScript | **Partial** - no runtime safety     |
| React Hook Form     | Schema validation only                      | **No** - no expression eval         |
| Formik              | Schema validation only                      | **No** - no expression eval         |
| Vue.js              | JavaScript coercion in computed props       | **No** - too loose                  |
| Excel/Google Sheets | Returns `#VALUE!` error                     | **Yes** - explicit failure          |
| SQL (PostgreSQL)    | Throws error                                | **Yes** - explicit failure          |
| SQL (MySQL)         | Coerces with warning                        | **Partial** - warning like dev mode |
| JSON Schema         | Validation only                             | **Partial** - no runtime eval       |

**Conclusion:** Formality's approach aligns with **enterprise software patterns** (Excel, PostgreSQL) rather than JavaScript's permissive coercion.

---

## 7. Design Trade-offs Analysis

### 7.1 Formality's Approach: Return `undefined`

**Pros:**

- ✅ **Explicit failure** - Developers know when type mismatch occurs
- ✅ **No silent bugs** - Can't have `null + 5 = 5` silent errors
- ✅ **Development warnings** - Clear console messages in dev mode
- ✅ **Production safety** - Returns `undefined` instead of NaN/0
- ✅ **Type safety** - Only finite numbers allowed
- ✅ **Testable** - Easy to test for `undefined` return values
- ✅ **Consistent** - All arithmetic operators follow same rules
- ✅ **Enterprise pattern** - Similar to Excel, SQL databases

**Cons:**

- ❌ **More verbose expressions** - Need explicit type checks before arithmetic
- ❌ **Learning curve** - Developers must understand Formality's rules
- ❌ **Not JavaScript-like** - Diverges from JavaScript's coercion
- ❌ **Potential for `undefined` propagation** - Need to handle `undefined` in results

**Example:**

```typescript
// Formality requires explicit handling
evaluate("quantity && price ? quantity * price : 0", context);

// vs JavaScript's implicit coercion
quantity * price; // If quantity is null, returns 0 (silent bug)
```

### 7.2 Alternative: Follow JavaScript Coercion

**Pros:**

- ✅ **JavaScript-like** - Familiar to JavaScript developers
- ✅ **Less verbose** - No explicit type checks needed
- ✅ **Flexible** - Handles mixed types automatically

**Cons:**

- ❌ **Silent bugs** - `null + 5 = 5` is a common bug source
- ❌ **NaN propagation** - NaN silently spreads through calculations
- ❌ **String concat ambiguity** - `"5" + 3 = "53"` vs `"5" * 3 = 15`
- ❌ **Form-specific issues** - Form inputs often return strings, causing bugs
- ❌ **Harder to debug** - Type mismatches don't throw errors

**Example:**

```typescript
// JavaScript coercion in forms (common bug)
const quantity = formState.quantity; // Might be "" (empty string)
const price = 10;
const total = quantity + price; // → "010" (string concat!)
```

### 7.3 Alternative: Throw Errors on Type Mismatch

**Pros:**

- ✅ **Explicit failure** - Errors can't be ignored
- ✅ **Stack traces** - Easier to debug
- ✅ **No undefined propagation** - Forces error handling

**Cons:**

- ❌ **Crashes application** - Unhandled errors break UI
- ❌ **Try/catch required** - Verbose error handling
- ❌ **Less flexible** - Can't use expressions in optional contexts

**Example:**

```typescript
// Throwing errors approach
try {
  const result = evaluate("quantity * price", context);
} catch (error) {
  // Must handle error explicitly
  console.error(error);
  return 0;
}
```

### 7.4 Why Formality Chose "Return `undefined`"

**Decision Rationale:**

1. **Form-specific use case**: Forms often have optional fields (`null`/`undefined`). Arithmetic should fail explicitly, not silently coerce to 0.

2. **Developer experience**: Development warnings provide clear feedback without crashing the UI.

3. **Production safety**: Returns `undefined` (falsy) instead of NaN or 0, making it easy to handle:

   ```typescript
   const total = evaluate("quantity * price", context) || 0;
   ```

4. **Testing ease**: Testing for `undefined` is simpler than testing for thrown errors.

5. **Enterprise patterns**: Aligns with Excel (`#VALUE!`), PostgreSQL (errors), and other tools that prioritize explicit failure.

6. **Progressive enhancement**: Works with existing JavaScript patterns (falsy checks) while adding safety.

### 7.5 Implementation Evidence

**File:** `/packages/core/src/expression/evaluate.ts` (lines 49-58, 136-230)

```typescript
function isSafeNumber(value: unknown): value is number {
  // Explicitly check for null and undefined first
  if (value === null || value === undefined) {
    return false;
  }
  // Then check for valid finite number
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

// Usage in arithmetic operations (lines 151-159)
if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Formality Expression] Type error: ` +
        `Invalid operands for + (null/undefined not allowed): ` +
        `left=${typeof leftValue}, right=${typeof rightValue}`,
    );
  }
  return undefined;
}
```

**Test Coverage:** `/packages/core/src/__tests__/expression.complex.test.ts` (lines 1166-1900)

- 100+ test cases for null/undefined arithmetic
- Development warning verification
- Production mode verification

---

## 8. Key Findings Summary

### 8.1 JavaScript Type Coercion Rules

1. **Addition (`+`)**: String concatenation OR numeric addition (depends on operands)
2. **Subtraction (`-`)**: Always numeric coercion
3. **Multiplication (`*`)**: Always numeric coercion
4. **Division (`/`)**: Always numeric coercion
5. **Modulo (`%`)**: Always numeric coercion

### 8.2 ToPrimitive Operation

- **Number hint** (arithmetic): `valueOf()` → `toString()` → TypeError
- **String hint** (concatenation): `toString()` → `valueOf()` → TypeError

### 8.3 Numeric Conversions

| Type      | ToNumber | Example                                |
| --------- | -------- | -------------------------------------- |
| null      | 0        | `null + 5 = 5`                         |
| undefined | NaN      | `undefined + 5 = NaN`                  |
| true      | 1        | `true + false = 1`                     |
| false     | 0        | `true + false = 1`                     |
| []        | 0        | `[] * 2 = 0`                           |
| [5]       | 5        | `[5] * 2 = 10`                         |
| [1,2]     | NaN      | `[1,2] * 2 = NaN`                      |
| {}        | NaN      | `{} + 5 = NaN` or `"[object Object]5"` |

### 8.4 Why Formality Diverges

**JavaScript's coercion is designed for:**

- Dynamic, loose typing
- Quick prototyping
- Scripting and automation

**Form's needs are:**

- Explicit, strict typing
- Data validation
- Business logic accuracy

**Formality prioritizes:**

- Type safety over flexibility
- Explicit failure over silent bugs
- Developer intent over automatic coercion

### 8.5 Industry Alignment

Formality's approach aligns with:

- ✅ Excel/Google Sheets (`#VALUE!` errors)
- ✅ PostgreSQL (type errors)
- ✅ TypeScript (compile-time safety)
- ✅ Enterprise software patterns

Formality's approach diverges from:

- ❌ JavaScript's permissive coercion
- ❌ PHP's loose typing
- ❌ MySQL's loose typing (without STRICT mode)

---

## 9. Recommendations

### 9.1 For Formality Developers

1. **Document the difference**: Clearly explain why Formality returns `undefined` instead of following JavaScript coercion.

2. **Provide migration guide**: Show how to convert JavaScript expressions to Formality expressions:

   ```typescript
   // JavaScript
   result = quantity * price;

   // Formality (with null safety)
   result = quantity && price ? quantity * price : 0;
   ```

3. **Educate on type guards**: Show how to use `isSafeNumber` pattern in custom code.

4. **Test edge cases**: Ensure all null/undefined scenarios are tested.

### 9.2 For Formality Users

1. **Use nullish coalescing**: Handle `undefined` gracefully:

   ```typescript
   const total = evaluate("quantity * price", context) ?? 0;
   ```

2. **Provide default values**: Use conditional expressions:

   ```typescript
   evaluate("quantity ? quantity * price : 0", context);
   ```

3. **Read development warnings**: Pay attention to console warnings in development mode.

4. **Test form expressions**: Verify expressions work with null/undefined inputs.

---

## 10. Conclusion

JavaScript's type coercion in arithmetic operations is designed for flexibility in dynamic scripting scenarios. However, this flexibility creates silent bugs in form validation contexts:

- **The "Silent Zero" bug**: `null + 5 = 5` hides missing values
- **String concat ambiguity**: `"5" + 3 = "53"` instead of `8`
- **NaN propagation**: `NaN` silently spreads through calculations

Formality intentionally diverges from JavaScript's coercion by returning `undefined` for mixed-type arithmetic. This approach:

- ✅ Prevents silent bugs
- ✅ Provides explicit failure
- ✅ Offers development warnings
- ✅ Aligns with enterprise patterns (Excel, SQL)
- ✅ Maintains production safety

This trade-off prioritizes **correctness over convenience**, which is appropriate for a form validation library where data accuracy is critical.

---

## References

### MDN Documentation

- [Addition (+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition)
- [Subtraction (-)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction)
- [Multiplication (\*)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication)
- [Division (/)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division)
- [Remainder (%)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder)
- [Type Coercion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion)
- [Object.prototype.valueOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)
- [Object.prototype.toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
- [Number() constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/Number)

### ECMAScript Specification

- [ToPrimitive](https://tc39.es/ecma262/#sec-toprimitive)
- [ToNumber](https://tc39.es/ecma262/#sec-tonumber)
- [Addition Operator](https://tc39.es/ecma262/#sec-addition-operator-plus)
- [Subtraction Operator](https://tc39.es/ecma262/#sec-subtraction-operator-minus)

### TypeScript Documentation

- [Type Guards and Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

### Internal Documentation

- `/packages/core/src/expression/evaluate.ts` - Implementation of `isSafeNumber` and arithmetic operations
- `/packages/core/src/__tests__/expression.complex.test.ts` - Comprehensive test coverage
- `/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T2S1/PRP.md` - Test requirements for null/undefined handling

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Complete
