# Research: Handling Null and Undefined in TypeScript/JavaScript Arithmetic Operations

**Date:** 2026-01-13
**Research Focus:** Best practices for handling null/undefined in arithmetic operations

---

## Table of Contents

1. [JavaScript Behavior with Null/Undefined](#javascript-behavior)
2. [How Popular Libraries Handle Null/Undefined](#library-handling)
3. [TypeScript Best Practices](#typescript-best-practices)
4. [Edge Cases and Gotchas](#edge-cases)
5. [Documentation References](#documentation-references)
6. [Best Practice Recommendations](#recommendations)

---

## 1. JavaScript Behavior with Null/Undefined <a name="javascript-behavior"></a>

### 1.1 Type Coercion Rules

#### Null in Arithmetic Contexts

According to the ECMAScript specification, `null` is coerced to `0` in numeric contexts:

```javascript
// Addition
null + 5; // → 5
5 + null; // → 5
null + null; // → 0

// Subtraction
null - 5; // → -5
5 - null; // → 5
null - null; // → 0

// Multiplication
null * 5; // → 0
5 * null; // → 0
null * null; // → 0

// Division
null / 5; // → 0
5 / null; // → Infinity
null / null; // → NaN (0/0 is undefined)

// Modulo
null % 5; // → 0
5 % null; // → NaN
null % null; // → NaN

// Explicit conversion
Number(null) + // → 0
  null; // → 0
parseInt(null); // → NaN
```

#### Undefined in Arithmetic Contexts

`undefined` is coerced to `NaN` (Not a Number) in numeric contexts:

```javascript
// Addition
undefined + 5; // → NaN
5 + undefined; // → NaN
undefined + undefined; // → NaN

// Subtraction
undefined - 5; // → NaN
5 - undefined; // → NaN
undefined - undefined; // → NaN

// Multiplication
undefined * 5; // → NaN
5 * undefined; // → NaN
undefined * undefined; // → NaN

// Division
undefined / 5; // → NaN
5 / undefined; // → NaN
undefined / undefined; // → NaN

// Explicit conversion
Number(undefined) + // → NaN
  undefined; // → NaN
parseInt(undefined); // → NaN
```

### 1.2 Why This Matters

**The Silent Zero Problem:**

```javascript
// Dangerous: null silently becomes 0
function calculateDiscount(price, discount) {
  return price - discount; // If discount is null, returns full price!
}

calculateDiscount(100, null); // → 100 (silent, no error)
```

**The NaN Cascade:**

```javascript
// Dangerous: undefined produces NaN which spreads
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// If one item.price is undefined, entire sum becomes NaN
```

---

## 2. How Popular Libraries Handle Null/Undefined <a name="library-handling"></a>

### 2.1 Lodash

**URL:** https://lodash.com/docs/4.17.15

Lodash provides several utility functions for safe arithmetic operations:

#### `_.add(a, b)`

```javascript
import _ from "lodash";

// Basic usage
_.add(5, 3); // → 8

// With null/undefined
_.add(null, 5); // → 5 (null treated as 0)
_.add(undefined, 5); // → NaN
_.add(null, null); // → 0
_.add(undefined, undefined); // → NaN

// Real-world pattern: defensive checks needed
function safeAdd(a, b) {
  if (a == null || b == null) return a ?? b ?? 0;
  return _.add(a, b);
}
```

#### `_.sum(array)`

```javascript
// Lodash sum handles null by ignoring it or treating as 0
_.sum([1, 2, 3]); // → 6
_.sum([1, null, 3]); // → 4 (null becomes 0)
_.sum([1, undefined, 3]); // → NaN (undefined poisons the sum)
```

**Best Practice Pattern in Lodash:**

```javascript
// Common pattern: Guard before arithmetic
function calculateTotal(items) {
  return _.sum(_.filter(items, (item) => item != null));
}

// Or using defaults
function safeCalculate(item) {
  return _.add(_.defaultTo(item.price, 0), _.defaultTo(item.tax, 0));
}
```

### 2.2 Math.js

**URL:** https://mathjs.org/docs/reference/functions.html

Math.js is more strict about type handling:

```javascript
import { add, multiply, chain } from "mathjs";

// Strict type checking
try {
  add(null, 5); // Throws Error: Unexpected type of argument
  add(undefined, 5); // Throws Error: Unexpected type of argument
} catch (e) {
  console.error("Math.js throws on null/undefined");
}

// Proper usage requires explicit numbers
add(5, 3); // → 8

// With optional values, you must preprocess
function safeMathAdd(a, b) {
  const safeA = a ?? 0;
  const safeB = b ?? 0;
  return add(safeA, safeB);
}
```

**Math.js Philosophy:** Explicit is better than implicit. Throws errors rather than coercing types unexpectedly.

### 2.3 D3.js (Data Visualization Library)

**URL:** https://d3js.org/

D3 provides array utilities that handle null/undefined gracefully:

```javascript
import { sum, max, min, mean } from "d3-array";

// d3.sum treats null/undefined as 0 or ignores them
sum([1, 2, 3]); // → 6
sum([1, null, 3]); // → 4
sum([1, undefined, 3]); // → 4 (ignores undefined)

// d3.max/min skip null/undefined
max([1, null, 3, 5]); // → 5
min([null, 1, 3]); // → 1

// d3.mean ignores null/undefined
mean([1, null, 3]); // → 2 (average of [1, 3])
```

### 2.4 Utility-First Approach

**Common Pattern Across Libraries:**

```javascript
// Most libraries use some form of this pattern:
function toNumber(value, defaultValue = 0) {
  if (value == null) return defaultValue;
  if (typeof value === "number") return value;
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

// Usage
function safeArithmetic(a, b, operation) {
  const safeA = toNumber(a);
  const safeB = toNumber(b);
  return operation(safeA, safeB);
}
```

---

## 3. TypeScript Best Practices <a name="typescript-best-practices"></a>

### 3.1 Enable Strict Null Checks

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "strict": true
  }
}
```

This prevents implicit null/undefined assignments:

```typescript
// With strictNullChecks: true
let count: number;
count = null; // ❌ Type error: Type 'null' is not assignable to type 'number'

// Proper type definition
let count: number | null | undefined;
count = null; // ✅ OK
```

### 3.2 Type Guards and Narrowing

#### Basic Type Guards

```typescript
function safeAdd(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  // Type guard: check for null/undefined
  if (a === null || a === undefined || b === null || b === undefined) {
    throw new Error("Cannot perform arithmetic on null or undefined values");
  }
  // TypeScript now knows a and b are numbers
  return a + b;
}
```

#### Custom Type Guard

```typescript
function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function safeMultiply(a: unknown, b: unknown): number {
  if (!isNumber(a) || !isNumber(b)) {
    throw new Error("Both arguments must be valid numbers");
  }
  return a * b;
}
```

#### Utility Type Guards

```typescript
// Type guard for non-null
function assertNotNullOrUndefined<T>(
  value: T | null | undefined,
  message?: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Value cannot be null or undefined");
  }
  return value;
}

// Usage
function calculateTotal(item: { price: number | null }) {
  const price = assertNotNullOrUndefined(item.price, "Price is required");
  return price * 1.1; // TypeScript knows price is number
}
```

### 3.3 Nullish Coalescing Operator (??)

Introduced in TypeScript 3.7/ES2020:

```typescript
// ?? only catches null and undefined (not 0, false, '')
function calculateTotal(
  price: number | null | undefined,
  quantity: number | null | undefined,
): number {
  const safePrice = price ?? 0;
  const safeQuantity = quantity ?? 0;
  return safePrice * safeQuantity;
}

// Example comparison
function example(a: number | null) {
  // Using ?? (recommended for numbers)
  const result1 = a ?? 0; // null → 0, 0 → 0, undefined → 0

  // Using || (can be problematic)
  const result2 = a || 0; // null → 0, 0 → 0, undefined → 0, but also 0.5 → 0.5
}
```

### 3.4 Optional Chaining with Default Values

```typescript
interface Product {
  price?: number | null;
  discount?: { amount: number | null } | null;
}

function calculateFinalPrice(product: Product): number {
  const basePrice = product.price ?? 0;
  const discountAmount = product.discount?.amount ?? 0;
  return basePrice - discountAmount;
}

// Nested optional chaining
function deepCalculate(product: Product | null | undefined): number {
  return (product?.discount?.amount ?? 0) * 1.1;
}
```

### 3.5 Utility Types

```typescript
// Remove null and undefined from a type
type NonNullableNumber = NonNullable<number | null | undefined>; // number

// Make all properties non-nullable
type RequiredProduct = Required<{
  price?: number;
  quantity?: number;
}>;

// Make specific properties required
type PriceRequired = {
  price: number;
  quantity?: number;
};
```

### 3.6 Validation Functions Pattern

```typescript
// Create a reusable validator
type ValidationResult<T> = success: true, value: T} | { success: false, error: string };

function validateNumber(value: unknown, fieldName: string): ValidationResult<number> {
    if (value === null || value === undefined) {
        return { success: false, error: `${fieldName} cannot be null or undefined` };
    }
    if (typeof value !== 'number') {
        return { success: false, error: `${fieldName} must be a number` };
    }
    if (Number.isNaN(value)) {
        return { success: false, error: `${fieldName} cannot be NaN` };
    }
    return { success: true, value };
}

// Usage
function safeCalculate(a: unknown, b: unknown): number {
    const validationA = validateNumber(a, 'First argument');
    const validationB = validateNumber(b, 'Second argument');

    if (!validationA.success) throw new Error(validationA.error);
    if (!validationB.success) throw new Error(validationB.error);

    return validationA.value + validationB.value;
}
```

### 3.7 Definite Assignment Assertions

```typescript
let total: number;

function calculate() {
  // Some logic that definitely assigns total
  total = 5 + 3;
}

calculate();

// Assert to TypeScript that total is definitely assigned
console.log(total!); // ✅ OK with ! assertion
```

### 3.8 Generic Safe Arithmetic Utilities

```typescript
// Generic safe arithmetic function
type SafeNumber = number | null | undefined;

function safeOperation(
  a: SafeNumber,
  b: SafeNumber,
  operation: (x: number, y: number) => number,
  defaultValue: number = 0,
): number {
  const safeA = a ?? defaultValue;
  const safeB = b ?? defaultValue;
  return operation(safeA, safeB);
}

// Usage
const sum = safeOperation(5, null, (x, y) => x + y); // → 5
const product = safeOperation(null, 3, (x, y) => x * y); // → 0

// Or throw on null/undefined
function strictOperation<T extends SafeNumber>(
  a: T,
  b: T,
  operation: (x: number, y: number) => number,
): number {
  if (a === null || a === undefined || b === null || b === undefined) {
    throw new Error("Operation requires non-null, non-undefined values");
  }
  return operation(a, b);
}
```

---

## 4. Edge Cases and Gotchas <a name="edge-cases"></a>

### 4.1 The Silent Zero Problem

**Problem:** `null` coerces to `0`, which can hide bugs:

```javascript
// Bug: User forgot to set discount
function applyDiscount(price: number, discount: number | null) {
    return price - discount; // If discount is null, returns full price!
}

applyDiscount(100, null); // → 100 (looks like success, but discount was null)
```

**Solution:**

```javascript
function applyDiscount(price: number, discount: number | null) {
    if (discount === null) {
        throw new Error('Discount cannot be null');
    }
    return price - discount;
}
```

### 4.2 The NaN Cascade

**Problem:** `undefined` produces `NaN`, which spreads through calculations:

```javascript
function calculateOrderTotal(items: Array<{ price: number | undefined }>) {
    return items.reduce((sum, item) => sum + item.price, 0);
    // If any item.price is undefined, entire sum becomes NaN
}

calculateOrderTotal([
    { price: 10 },
    { price: undefined }, // This causes NaN
    { price: 30 }
]); // → NaN
```

**Solution:**

```javascript
function calculateOrderTotal(items: Array<{ price: number | undefined }>) {
    return items.reduce((sum, item) => {
        const price = item.price ?? 0; // Default to 0 for undefined
        return sum + price;
    }, 0);
}
```

### 4.3 Comparison Gotchas

```javascript
// Loose equality (==) with null/undefined
null == undefined; // true
null == 0; // false
undefined == 0; // false

// Strict equality (===) with null/undefined
null === undefined; // false
null === 0; // false
undefined === 0; // false

// Arithmetic comparisons
null < 5; // true (0 < 5)
undefined < 5; // false (NaN comparison is always false)
undefined > 5; // false (NaN comparison is always false)
undefined >= 5; // false (NaN comparison is always false)

// Array.includes behavior
[1, 2, null].includes(undefined); // false
[1, 2, undefined].includes(null); // false
```

### 4.4 Array Method Gotchas

```javascript
// reduce with initial value 0
[1, null, 3].reduce((sum, n) => sum + n, 0); // → 4 (null → 0)
[1, undefined, 3].reduce((sum, n) => sum + n, 0); // → NaN

// map then reduce
[1, null, 3].map((n) => n ?? 0).reduce((sum, n) => sum + n, 0); // → 4

// filter null/undefined
[1, null, undefined, 3].filter((n) => n != null); // → [1, 3]
```

### 4.5 Object Property Access

```javascript
const obj = {
  a: 5,
  b: null,
  c: undefined,
};

// Direct access
obj.a + 1; // → 6
obj.b + 1; // → 1 (null → 0)
obj.c + 1; // → NaN

// Optional chaining
obj?.d + 1; // → TypeError: Cannot read property 'd' of undefined
obj?.d ?? 0 + 1; // → 1 (safe)

// Destructuring with defaults
const { a = 0, b = 0, c = 0, d = 0 } = obj;
a + b + c + d; // → 5
```

### 4.6 Function Parameter Gotchas

```javascript
// Default parameters don't catch null
function add(a = 0, b = 0) {
    return a + b;
}

add(5, 10);        // → 15
add(5, null);      // → 5 (null is passed, default not used)
add(5, undefined); // → 5 (default used)

// Solution: Use nullish coalescing in function body
function addSafe(a: number | null, b: number | null) {
    const safeA = a ?? 0;
    const safeB = b ?? 0;
    return safeA + safeB;
}
```

### 4.7 Template String Gotchas

```javascript
// Template strings convert to strings
const a = null;
const b = undefined;

`Value: ${a}`; // → "Value: null"
`Value: ${b}`; // → "Value: undefined"
`Sum: ${a + 5}`; // → "Sum: 5"
`Sum: ${b + 5}`; // → "Sum: NaN"

// Number() in template strings
`Number(null): ${Number(null)}`; // → "Number(null): 0"
`Number(undefined): ${Number(undefined)}`; // → "Number(undefined): NaN"
```

### 4.8 JSON Serialization Gotchas

```javascript
// JSON.stringify includes null but excludes undefined
JSON.stringify({ a: 5, b: null, c: undefined });
// → '{"a":5,"b":null}'

// JSON.parse returns null for missing values, never undefined
JSON.parse('{"a":5}').b; // → undefined
JSON.parse('{"a":null}').a; // → null
```

### 4.9 Bitwise Operations

```javascript
// Bitwise operations coerce to 32-bit integers
5 & null; // → 0 (null → 0)
5 | null; // → 5
5 ^ null; // → 5
~null; // → -1 (~0 is -1)

5 & undefined; // → 0 (undefined → 0 in bitwise context!)
5 | undefined; // → 5
5 ^ undefined; // → 5
~undefined; // → -1

// Important: undefined behaves differently in bitwise vs arithmetic
undefined + 5; // → NaN
5 | undefined; // → 5
```

### 4.10 Math Function Gotchas

```javascript
// Math functions handle null/undefined differently
Math.max(1, null, 3); // → 3 (null → 0)
Math.max(1, undefined, 3); // → NaN

Math.min(1, null, 3); // → 0 (null → 0)
Math.min(1, undefined, 3); // → NaN

Math.round(null); // → 0
Math.round(undefined); // → NaN

Math.abs(null); // → 0
Math.abs(undefined); // → NaN

Math.pow(2, null); // → 1 (2^0)
Math.pow(2, undefined); // → NaN
```

### 4.11 Implicit Conversion Gotchas

```javascript
// Unary operators
+null; // → 0
+undefined; // → NaN
-null; // → -0
-undefined; // → NaN

// Prefix increment/decrement
let a = null;
a++; // → 0 (a becomes 0)

let b = undefined;
b++; // → NaN (b becomes NaN)

// Logical NOT (converted to boolean first)
!null; // → true
!undefined; // → true
!0; // → true

// Double negation (converts to boolean)
!!null; // → false
!!undefined; // → false
```

### 4.12 Edge Case Summary Table

| Operation  | null   | undefined   |
| ---------- | ------ | ----------- |
| + 5        | 5      | NaN         |
| - 5        | -5     | NaN         |
| \* 5       | 0      | NaN         |
| / 5        | 0      | NaN         |
| % 5        | 0      | NaN         |
| \*\* 2     | 0      | NaN         |
| == 0       | false  | false       |
| === 0      | false  | false       |
| < 5        | true   | false       |
| > 5        | false  | false       |
| \|\| 5     | 5      | 5           |
| ?? 5       | 5      | 5           |
| & 5        | 0      | 5           |
| \| 5       | 5      | 5           |
| toString() | "null" | "undefined" |
| Number()   | 0      | NaN         |
| Boolean()  | false  | false       |

---

## 5. Documentation References <a name="documentation-references"></a>

### 5.1 Official ECMAScript/JavaScript Documentation

**ECMAScript Specification:**

- URL: https://tc39.es/ecma262/
- Section: [Abstract Operations](https://tc39.es/ecma262/#sec-abstract-operations)
  - ToNumeric: https://tc39.es/ecma262/#sec-tonumeric
  - ToNumber: https://tc39.es/ecma262/#sec-tonumber
  - ToPrimitive: https://tc39.es/ecma262/#sec-toprimitive

**MDN Web Docs - JavaScript:**

- Type Coercion: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion
- Number: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
- Null: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null
- Undefined: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
- Equality comparisons: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
- NaN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN

### 5.2 TypeScript Documentation

**TypeScript Handbook:**

- URL: https://www.typescriptlang.org/docs/handbook/intro.html
- Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Type Guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- Nullish Coalescing: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing
- Optional Chaining: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining
- Strict Null Checks: https://www.typescriptlang.org/tsconfig#strictNullChecks

**TypeScript Deep Dive:**

- URL: https://basarat.gitbook.io/typescript/
- Null and Undefined: https://basarat.gitbook.io/typescript/type-system/null-and-undefined
- Type Narrowing: https://basarat.gitbook.io/typescript/type-system/typeguard#type-guards

### 5.3 Library Documentation

**Lodash:**

- URL: https://lodash.com/docs/4.17.15
- \_.add: https://lodash.com/docs/4.17.15#add
- \_.sum: https://lodash.com/docs/4.17.15#sum
- \_.defaultTo: https://lodash.com/docs/4.17.15#defaultTo
- \_.filter: https://lodash.com/docs/4.17.15#filter

**Math.js:**

- URL: https://mathjs.org/docs/index.html
- Reference: https://mathjs.org/docs/reference/functions.html
- Create: https://mathjs.org/docs/reference/functions.html#create
- Type checking: https://mathjs.org/docs/core.html#type-checking

**D3.js (d3-array):**

- URL: https://github.com/d3/d3-array
- sum: https://github.com/d3/d3-array/blob/main/README.md#sum
- max: https://github.com/d3/d3-array/blob/main/README.md#max
- min: https://github.com/d3/d3-array/blob/main/README.md#min
- mean: https://github.com/d3/d3-array/blob/main/README.md#mean

### 5.4 Additional Resources

**You Don't Know JS (book series):**

- Types & Grammar: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20%26%20grammar/README.md
- Chapter 4: Coercion: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20%26%20grammar/ch4.md

**JavaScript.info:**

- Data Types: https://javascript.info/types
- Type Conversions: https://javascript.info/type-conversions
- Operators: https://javascript.info/operators

**2ality Blog (Dr. Axel Rauschmayer):**

- Type coercion: https://2ality.com/2019/10/coercion.html
- null vs undefined: https://2ality.com/2022/01/undefined-vs-null.html

---

## 6. Best Practice Recommendations <a name="recommendations"></a>

### 6.1 General Principles

1. **Always Use Strict Null Checks in TypeScript**

   ```json
   {
     "compilerOptions": {
       "strictNullChecks": true
     }
   }
   ```

2. **Be Explicit About Null/Undefined Handling**
   - Don't rely on implicit coercion
   - Use `??` for null/undefined defaults
   - Use `||` for falsy value defaults (when intentional)

3. **Validate Input Early**

   ```typescript
   function calculate(a: number | null, b: number | null): number {
     if (a === null || a === undefined || b === null || b === undefined) {
       throw new Error("Arguments cannot be null or undefined");
     }
     return a + b;
   }
   ```

4. **Use Type Guards**

   ```typescript
   function isNumber(value: unknown): value is number {
     return typeof value === "number" && !Number.isNaN(value);
   }
   ```

5. **Provide Sensible Defaults**
   ```typescript
   function safeAdd(
     a: number | null | undefined,
     b: number | null | undefined,
   ): number {
     return (a ?? 0) + (b ?? 0);
   }
   ```

### 6.2 Patterns for Different Scenarios

#### Scenario 1: Public API (Fail Fast)

```typescript
function publicApiCalculate(
  price: number | null,
  quantity: number | null,
): number {
  if (price === null || price === undefined) {
    throw new Error("price is required and cannot be null");
  }
  if (quantity === null || quantity === undefined) {
    throw new Error("quantity is required and cannot be null");
  }
  return price * quantity;
}
```

#### Scenario 2: Internal Utility (Default to Zero)

```typescript
function internalSum(values: Array<number | null | undefined>): number {
  return values.reduce((sum, value) => sum + (value ?? 0), 0);
}
```

#### Scenario 3: Data Processing (Filter Out Null/Undefined)

```typescript
function processDataset(
  items: Array<{ value: number | null | undefined }>,
): number[] {
  return items
    .map((item) => item.value)
    .filter((value): value is number => value != null);
}
```

#### Scenario 4: Configuration (Apply Defaults)

```typescript
interface Config {
  timeout: number | null;
  retries: number | null;
}

function applyDefaults(config: Config): Required<Config> {
  return {
    timeout: config.timeout ?? 5000,
    retries: config.retries ?? 3,
  };
}
```

### 6.3 Testing Recommendations

Always test with null and undefined:

```typescript
describe("Arithmetic Operations", () => {
  it("should handle null values", () => {
    expect(() => safeAdd(5, null)).not.toThrow();
    expect(safeAdd(5, null)).toBe(5);
  });

  it("should handle undefined values", () => {
    expect(() => safeAdd(5, undefined)).not.toThrow();
    expect(safeAdd(5, undefined)).toBe(5);
  });

  it("should handle both null", () => {
    expect(safeAdd(null, null)).toBe(0);
  });

  it("should handle both undefined", () => {
    expect(safeAdd(undefined, undefined)).toBe(0);
  });
});
```

### 6.4 Code Review Checklist

When reviewing code with arithmetic operations:

- [ ] Are all variables properly typed (not `any`)?
- [ ] Are null/undefined cases handled explicitly?
- [ ] Are tests covering null/undefined inputs?
- [ ] Is `??` used instead of `||` for number defaults?
- [ ] Are validation errors informative?
- [ ] Is the behavior consistent across the codebase?
- [ ] Are edge cases documented?

### 6.5 Avoid These Anti-Patterns

❌ **Bad:** Relying on implicit coercion

```typescript
function badAdd(a: any, b: any) {
  return a + b; // What if a is null? What if b is undefined?
}
```

✅ **Good:** Explicit handling

```typescript
function goodAdd(a: number | null, b: number | null) {
  return (a ?? 0) + (b ?? 0);
}
```

❌ **Bad:** Using `||` for numbers

```typescript
function badMultiply(a: number | null, b: number | null) {
  return (a || 1) * (b || 1); // 0 becomes 1!
}
```

✅ **Good:** Using `??` for numbers

```typescript
function goodMultiply(a: number | null, b: number | null) {
  return (a ?? 1) * (b ?? 1); // Only null/undefined become 1
}
```

❌ **Bad:** Silent failures

```typescript
function badCalculate(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
  // If any price is undefined, returns NaN
}
```

✅ **Good:** Explicit error

```typescript
function goodCalculate(items: Item[]) {
  return items.reduce((sum, item) => {
    if (item.price === undefined) {
      throw new Error(`Item ${item.id} has undefined price`);
    }
    return sum + (item.price ?? 0);
  }, 0);
}
```

---

## Summary

**Key Takeaways:**

1. **JavaScript treats `null` as `0` and `undefined` as `NaN` in arithmetic**
   - This is specified in the ECMAScript standard
   - Can lead to silent bugs or NaN cascades

2. **Popular libraries handle this differently:**
   - Lodash: Treats null as 0, undefined produces NaN
   - Math.js: Throws errors on null/undefined (strict)
   - D3.js: Ignores null/undefined in aggregations

3. **TypeScript best practices:**
   - Always enable `strictNullChecks`
   - Use type guards and narrowing
   - Use `??` for null/undefined defaults
   - Use optional chaining `?.` for safe access

4. **Edge cases are numerous:**
   - Silent zero problem with null
   - NaN cascade with undefined
   - Bitwise operations coerce undefined to 0
   - Array methods behave inconsistently

5. **Recommended approach:**
   - Be explicit about null/undefined handling
   - Validate inputs early
   - Provide sensible defaults or throw clear errors
   - Test with null and undefined inputs
   - Use TypeScript's type system to prevent issues at compile time

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Researcher:** Claude (Anthropic)
