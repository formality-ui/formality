# External Best Practices for Null Arithmetic Testing

**Research Date:** 2025-01-13
**Task:** P3M2T2S1 - Research external best practices for null arithmetic testing

## Table of Contents

1. [TypeScript Testing Best Practices for Null/Undefined](#typescript-testing-best-practices)
2. [Vitest Patterns for Testing Console Output](#vitest-console-testing-patterns)
3. [Testing Environment-Specific Behavior](#testing-environment-specific-behavior)
4. [Testing Arithmetic Expressions with Edge Cases](#testing-arithmetic-edge-cases)
5. [Testing Type Guards](#testing-type-guards)
6. [Common Pitfalls to Avoid](#common-pitfalls)
7. [Additional Resources](#additional-resources)

---

## TypeScript Testing Best Practices for Null/Undefined

### Understanding JavaScript Type Coercion

**Null Behavior:**

```javascript
null + 5; // 5 (null coerces to 0)
null - 5; // -5
null * 3; // 0
null / 5; // 0
null ** 2; // 0
```

**Undefined Behavior:**

```javascript
undefined + 5; // NaN
undefined - 5; // NaN
undefined * 3; // NaN
undefined / 5; // NaN
undefined ** 2; // NaN
```

### TypeScript Strict Null Checks

**tsconfig.json Configuration:**

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Best Practice:** Always enable `strictNullChecks` to catch null/undefined issues at compile time rather than runtime.

### Type-Safe Arithmetic Functions

**Defensive Programming Patterns:**

```typescript
// Pattern 1: Default values with nullish coalescing
function safeAdd(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  const numA = a ?? 0;
  const numB = b ?? 0;
  return numA + numB;
}

// Pattern 2: Explicit validation
function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | never {
  if (denominator === null || denominator === undefined || denominator === 0) {
    throw new Error("Denominator must be a non-zero number");
  }
  const validatedNumerator = numerator ?? 0;
  return validatedNumerator / denominator;
}

// Pattern 3: Return type indicates possible failure
function safeOperation(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return a + b;
}
```

---

## Vitest Console Testing Patterns

### Basic Console Spying

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Console output testing", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log expected message", () => {
    const value = null;
    console.log("Processing value:", value);

    expect(consoleSpy).toHaveBeenCalledWith("Processing value:", null);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Development Logging

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("Development-specific logging", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset environment before each test
    process.env.NODE_ENV = originalEnv;
  });

  it("should log warnings in development when null is used in arithmetic", () => {
    process.env.NODE_ENV = "development";
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Function under test
    performArithmetic(null as any, 5);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("null value"),
    );

    consoleSpy.mockRestore();
  });

  it("should not log warnings in production", () => {
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    performArithmetic(null as any, 5);

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
```

### Mocking All Console Methods

```typescript
import { vi } from "vitest";

export function setupConsoleMocks() {
  return {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
  };
}

export function restoreConsoleMocks(
  mocks: ReturnType<typeof setupConsoleMocks>,
) {
  Object.values(mocks).forEach((spy) => spy.mockRestore());
}

// Usage in tests
describe("Comprehensive console testing", () => {
  it("should use all console methods appropriately", () => {
    const consoleMocks = setupConsoleMocks();

    try {
      yourFunctionUnderTest();

      expect(consoleMocks.warn).toHaveBeenCalledTimes(2);
      expect(consoleMocks.error).not.toHaveBeenCalled();
    } finally {
      restoreConsoleMocks(consoleMocks);
    }
  });
});
```

### Testing Console Output Content

```typescript
import { vi, expect, it } from "vitest";

it("should log specific patterns for null arithmetic", () => {
  const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  performArithmetic(null, 5);

  // Test exact match
  expect(consoleSpy).toHaveBeenCalledWith(
    "[Development] Null value detected in arithmetic operation",
  );

  // Test partial match
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining("Null value"),
  );

  // Test with matchers
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringMatching(/null.*arithmetic/i),
  );

  consoleSpy.mockRestore();
});
```

---

## Testing Environment-Specific Behavior

### Environment Variable Patterns

```typescript
// config/env.ts
interface EnvironmentConfig {
  NODE_ENV: "development" | "test" | "production";
  ENABLE_DEV_LOGGING: boolean;
  STRICT_NULL_CHECKS: boolean;
}

export const config: EnvironmentConfig = {
  NODE_ENV: (process.env.NODE_ENV as any) || "development",
  ENABLE_DEV_LOGGING: process.env.NODE_ENV !== "production",
  STRICT_NULL_CHECKS: process.env.STRICT_NULL_CHECKS === "true",
};

// utils/arithmetic.ts
export function devLog(message: string, ...args: any[]) {
  if (config.ENABLE_DEV_LOGGING) {
    console.warn(`[Development] ${message}`, ...args);
  }
}

export function addWithLogging(a: number | null, b: number | null): number {
  if (a === null || a === undefined) {
    devLog("Null/undefined value in addition", { a, b });
  }
  if (b === null || b === undefined) {
    devLog("Null/undefined value in addition", { a, b });
  }

  const numA = a ?? 0;
  const numB = b ?? 0;
  return numA + numB;
}
```

### Testing Environment Switching

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { config } from "@/config/env";

describe("Environment-specific behavior", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("Development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should enable detailed logging", () => {
      expect(config.ENABLE_DEV_LOGGING).toBe(true);
    });

    it("should log warnings for null values", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      addWithLogging(null, 5);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should disable detailed logging", () => {
      expect(config.ENABLE_DEV_LOGGING).toBe(false);
    });

    it("should not log warnings for null values", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      addWithLogging(null, 5);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
```

### Feature Flag Testing

```typescript
// utils/featureFlags.ts
export const featureFlags = {
  ENABLE_NULL_GUARDS: process.env.ENABLE_NULL_GUARDS === "true",
  ENABLE_ARITHMETIC_VALIDATION:
    process.env.ENABLE_ARITHMETIC_VALIDATION === "true",
};

// utils/guardedArithmetic.ts
export function guardedAdd(a: number | null, b: number | null): number {
  if (featureFlags.ENABLE_NULL_GUARDS) {
    if (a === null || a === undefined || b === null || b === undefined) {
      throw new Error("Null values not allowed in guarded arithmetic");
    }
  }

  return (a ?? 0) + (b ?? 0);
}

// tests/featureFlags.test.ts
describe("Feature flag controlled behavior", () => {
  it("should throw error when null guards enabled", () => {
    process.env.ENABLE_NULL_GUARDS = "true";

    expect(() => guardedAdd(null, 5)).toThrow("Null values not allowed");
  });

  it("should use default values when null guards disabled", () => {
    process.env.ENABLE_NULL_GUARDS = "false";

    expect(guardedAdd(null, 5)).toBe(5);
  });
});
```

---

## Testing Arithmetic Expressions with Edge Cases

### Comprehensive Edge Case Test Suite

```typescript
import { describe, it, expect } from "vitest";

describe("Arithmetic operations - comprehensive edge cases", () => {
  const testCases = [
    // Null cases
    { a: null, b: 5, operation: "addition", expected: 5 },
    { a: 5, b: null, operation: "addition", expected: 5 },
    { a: null, b: null, operation: "addition", expected: 0 },

    // Undefined cases
    { a: undefined, b: 5, operation: "addition", expected: NaN },
    { a: 5, b: undefined, operation: "addition", expected: NaN },
    { a: undefined, b: undefined, operation: "addition", expected: NaN },

    // Mixed null/undefined
    { a: null, b: undefined, operation: "addition", expected: NaN },
    { a: undefined, b: null, operation: "addition", expected: NaN },

    // Zero edge cases
    { a: 0, b: null, operation: "division", expected: NaN },
    { a: null, b: 0, operation: "division", expected: NaN },

    // Negative numbers with null
    { a: -5, b: null, operation: "addition", expected: -5 },
    { a: null, b: -5, operation: "multiplication", expected: 0 },

    // Special values
    { a: NaN, b: null, operation: "addition", expected: NaN },
    { a: Infinity, b: null, operation: "addition", expected: Infinity },
    { a: null, b: Infinity, operation: "multiplication", expected: NaN },
  ];

  testCases.forEach(({ a, b, operation, expected }) => {
    it(`${operation}: ${a} ${operation} ${b} = ${expected}`, () => {
      const result = performOperation(a, b, operation);

      if (typeof expected === "number" && isNaN(expected)) {
        expect(result).toBeNaN();
      } else {
        expect(result).toBe(expected);
      }
    });
  });
});

function performOperation(
  a: number | null | undefined,
  b: number | null | undefined,
  operation: string,
): number {
  switch (operation) {
    case "addition":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (a as any) + (b as any);
    case "subtraction":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (a as any) - (b as any);
    case "multiplication":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (a as any) * (b as any);
    case "division":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (a as any) / (b as any);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
```

### Testing Arithmetic with Objects

```typescript
describe("Object property arithmetic", () => {
  it("should handle null in nested properties", () => {
    const obj = {
      level1: {
        level2: {
          value: null,
        },
      },
    };

    // Optional chaining prevents errors
    const result = obj.level1?.level2?.value ?? 0;
    expect(result).toBe(0);
  });

  it("should handle undefined in array access", () => {
    const arr: number[] = [1, 2, 3];
    const outOfBounds = arr[10]; // undefined

    expect(() => outOfBounds! * 2).not.toThrow();
    expect(outOfBounds! * 2).toBeNaN();
  });

  it("should handle arithmetic with array methods", () => {
    const numbers: (number | null)[] = [1, null, 3, undefined, 5];

    const sum = numbers.reduce((acc, val) => acc + (val ?? 0), 0);
    expect(sum).toBe(9); // 1 + 0 + 3 + 0 + 5

    const filtered = numbers.filter(
      (val): val is number => val !== null && val !== undefined,
    );
    expect(filtered).toEqual([1, 3, 5]);
  });
});
```

### Testing Arithmetic Expressions

```typescript
describe("Complex arithmetic expressions", () => {
  it("should handle null in compound expressions", () => {
    const a = 10;
    const b: number | null = null;
    const c = 5;

    // Expression: (a + b) * c
    // With null coercion: (10 + 0) * 5 = 50
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (a + (b as any)) * c;
    expect(result).toBe(50);
  });

  it("should handle undefined in compound expressions", () => {
    const a = 10;
    const b: number | undefined = undefined;
    const c = 5;

    // Expression: (a + b) * c
    // With undefined: (10 + undefined) * 5 = NaN * 5 = NaN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (a + (b as any)) * c;
    expect(result).toBeNaN();
  });

  it("should handle operator precedence with null values", () => {
    const a: number | null = null;
    const b = 5;
    const c = 3;

    // Test different operator precedence scenarios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((a as any) + b * c).toBe(15); // null + (5 * 3) = 0 + 15 = 15
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(((a as any) + b) * c).toBe(15); // (null + 5) * 3 = 5 * 3 = 15
  });
});
```

---

## Testing Type Guards

### Basic Type Guard Testing

```typescript
// utils/typeGuards.ts
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function isNotNullOrUndefined<T>(
  value: T | null | undefined,
): value is T {
  return value !== null && value !== undefined;
}

export function isSafeForArithmetic(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

// tests/typeGuards.test.ts
import { describe, it, expect } from "vitest";
import {
  isNumber,
  isNotNullOrUndefined,
  isSafeForArithmetic,
} from "@/utils/typeGuards";

describe("Type guards", () => {
  describe("isNumber", () => {
    const validNumbers = [0, 1, -1, 3.14, Infinity, -Infinity];
    const invalidNumbers = [null, undefined, NaN, "1", {}, [], true];

    validNumbers.forEach((value) => {
      it(`should identify ${value} as number`, () => {
        expect(isNumber(value)).toBe(true);
      });
    });

    invalidNumbers.forEach((value) => {
      it(`should reject ${value}`, () => {
        expect(isNumber(value)).toBe(false);
      });
    });
  });

  describe("isNotNullOrUndefined", () => {
    it("should narrow type correctly", () => {
      const value: number | null | undefined = 5;

      if (isNotNullOrUndefined(value)) {
        // TypeScript knows value is number here
        expect(value * 2).toBe(10);
      }
    });

    it("should filter null values", () => {
      const values: (number | null)[] = [1, null, 3, null, 5];
      const filtered = values.filter(isNotNullOrUndefined);

      expect(filtered).toEqual([1, 3, 5]);
    });
  });

  describe("isSafeForArithmetic", () => {
    it("should reject NaN", () => {
      expect(isSafeForArithmetic(NaN)).toBe(false);
    });

    it("should reject Infinity", () => {
      expect(isSafeForArithmetic(Infinity)).toBe(false);
      expect(isSafeForArithmetic(-Infinity)).toBe(false);
    });

    it("should accept finite numbers", () => {
      expect(isSafeForArithmetic(42)).toBe(true);
      expect(isSafeForArithmetic(-3.14)).toBe(true);
      expect(isSafeForArithmetic(0)).toBe(true);
    });
  });
});
```

### Testing Type Guard Integration

```typescript
describe("Type guard integration with arithmetic", () => {
  it("should use type guards to prevent null arithmetic", () => {
    function safeMultiply(a: unknown, b: unknown): number | never {
      if (!isSafeForArithmetic(a) || !isSafeForArithmetic(b)) {
        throw new Error("Invalid arithmetic operands");
      }
      return a * b;
    }

    expect(safeMultiply(5, 3)).toBe(15);

    expect(() => safeMultiply(null, 5)).toThrow("Invalid arithmetic operands");
    expect(() => safeMultiply(5, undefined)).toThrow(
      "Invalid arithmetic operands",
    );
    expect(() => safeMultiply(NaN, 5)).toThrow("Invalid arithmetic operands");
  });

  it("should use type guards with array methods", () => {
    const values: unknown[] = [1, null, 3, undefined, 5, "invalid", 7];
    const numbers = values.filter(isSafeForArithmetic);

    expect(numbers).toEqual([1, 3, 5, 7]);

    const sum = numbers.reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(16);
  });
});
```

### Testing Custom Type Predicates

```typescript
// utils/numericTypeGuards.ts
export interface NumericValue {
  value: number;
  isValid: boolean;
}

export function isNumericValue(obj: unknown): obj is NumericValue {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    "isValid" in obj &&
    typeof (obj as NumericValue).value === "number" &&
    typeof (obj as NumericValue).isValid === "boolean"
  );
}

// tests/customTypeGuards.test.ts
describe("Custom type predicates", () => {
  it("should correctly identify NumericValue objects", () => {
    const valid = { value: 42, isValid: true };
    const invalid = { value: "42", isValid: true };
    const missingField = { value: 42 };

    expect(isNumericValue(valid)).toBe(true);
    expect(isNumericValue(invalid)).toBe(false);
    expect(isNumericValue(missingField)).toBe(false);
    expect(isNumericValue(null)).toBe(false);
    expect(isNumericValue(undefined)).toBe(false);
  });

  it("should narrow type in conditional blocks", () => {
    const obj: unknown = { value: 42, isValid: true };

    if (isNumericValue(obj)) {
      // TypeScript knows obj is NumericValue here
      expect(obj.value * 2).toBe(84);
      expect(obj.isValid).toBe(true);
    }
  });
});
```

---

## Common Pitfalls to Avoid

### 1. Relying on Type Assertions

**Pitfall:**

```typescript
// BAD: Using type assertions to bypass null checks
function badAdd(a: number | null, b: number | null): number {
  return (a as number) + (b as number); // Runtime error if a or b is null
}
```

**Best Practice:**

```typescript
// GOOD: Proper null handling
function goodAdd(a: number | null, b: number | null): number {
  return (a ?? 0) + (b ?? 0);
}
```

### 2. Inconsistent Null Handling

**Pitfall:**

```typescript
// BAD: Different behavior for null vs undefined
function inconsistent(value: number | null | undefined): number {
  if (value === null) return 0;
  return value; // Fails if value is undefined
}
```

**Best Practice:**

```typescript
// GOOD: Consistent handling
function consistent(value: number | null | undefined): number {
  return value ?? 0;
}
```

### 3. Forgetting to Restore Mocks

**Pitfall:**

```typescript
// BAD: Mock not restored, affects other tests
it("logs warning", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // test code
  // Missing: consoleSpy.mockRestore();
});
```

**Best Practice:**

```typescript
// GOOD: Always restore mocks
it("logs warning", () => {
  const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    // test code
  } finally {
    consoleSpy.mockRestore();
  }
});

// BETTER: Use beforeEach/afterEach
describe("tests", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs warning", () => {
    // test code without worrying about cleanup
  });
});
```

### 4. Testing Implementation Details

**Pitfall:**

```typescript
// BAD: Testing implementation (exact console output)
it("logs exact message", () => {
  const spy = vi.spyOn(console, "warn");
  performCalculation(null, 5);
  expect(spy).toHaveBeenCalledWith(
    "[Development] Null value detected at 2025-01-13T10:30:00.000Z",
  );
  // Fragile: breaks if message format or timestamp changes
});
```

**Best Practice:**

```typescript
// GOOD: Testing behavior
it("warns about null values in development", () => {
  const spy = vi.spyOn(console, "warn");
  performCalculation(null, 5);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("Null value detected"),
  );
  // More robust: tests intent, not exact format
});
```

### 5. Not Testing All Code Paths

**Pitfall:**

```typescript
// BAD: Missing edge case coverage
describe("addition", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
  // Missing: null, undefined, NaN, Infinity cases
});
```

**Best Practice:**

```typescript
// GOOD: Comprehensive coverage
describe("addition", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("handles null values", () => {
    expect(add(null, 5)).toBe(5);
  });

  it("handles undefined values", () => {
    expect(add(undefined, 5)).toBeNaN();
  });

  it("handles NaN", () => {
    expect(add(NaN, 5)).toBeNaN();
  });
});
```

### 6. Ignoring TypeScript Errors

**Pitfall:**

```typescript
// BAD: Using @ts-ignore to bypass type checking
// @ts-ignore
function riskyAdd(a: any, b: any): number {
  return a + b;
}
```

**Best Practice:**

```typescript
// GOOD: Proper type definitions
function safeAdd(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  const numA = a ?? 0;
  const numB = b ?? 0;

  if (Number.isNaN(numA) || Number.isNaN(numB)) {
    return NaN;
  }

  return numA + numB;
}
```

### 7. Not Testing Environment-Specific Behavior

**Pitfall:**

```typescript
// BAD: Only tests in default environment
it("logs warnings", () => {
  const spy = vi.spyOn(console, "warn");
  performCalculation(null, 5);
  expect(spy).toHaveBeenCalled();
  // But what if NODE_ENV=production?
});
```

**Best Practice:**

```typescript
// GOOD: Tests all environments
describe("logging behavior", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("logs warnings in development", () => {
    process.env.NODE_ENV = "development";
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    performCalculation(null, 5);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not log warnings in production", () => {
    process.env.NODE_ENV = "production";
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    performCalculation(null, 5);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

---

## Additional Resources

### TypeScript Documentation

- **TypeScript Handbook - Null and Undefined**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- **TypeScript Compiler Options**: https://www.typescriptlang.org/tsconfig#strictNullChecks
- **TypeScript Utility Types**: https://www.typescriptlang.org/docs/handbook/utility-types.html

### Vitest Documentation

- **Vitest Mocking Guide**: https://vitest.dev/guide/mocking.html
- **Vitest Assertion API**: https://vitest.dev/api/expect.html
- **Vitest Configuration**: https://vitest.dev/config/

### Testing Best Practices

- **Testing Library Principles**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **JavaScript Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices

### Type Guard Resources

- **TypeScript Type Guards and Predicates**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- **Defensive Programming in TypeScript**: https://basarat.gitbook.io/typescript/type-system/typeguard

### Arithmetic Edge Cases

- **IEEE 754 Floating Point**: https://en.wikipedia.org/wiki/IEEE_754
- **JavaScript Number Reference**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
- **Type Equality in JavaScript**: https://dorey.github.io/JavaScript-Equality-Table/

---

## Key Takeaways

1. **Always enable strict null checking** in TypeScript to catch issues at compile time
2. **Use console spy patterns** with proper setup/teardown in beforeEach/afterEach
3. **Test environment-specific behavior** by explicitly setting and resetting environment variables
4. **Cover all edge cases** including null, undefined, NaN, Infinity, and mixed types
5. **Test type guards** both for correctness and type narrowing behavior
6. **Avoid common pitfalls** like type assertions, inconsistent null handling, and testing implementation details
7. **Use defensive programming** patterns like nullish coalescing (??) and optional chaining (?.)
8. **Write comprehensive test suites** that cover normal cases, edge cases, and error conditions

---

**Note:** This research was compiled when web search services were temporarily unavailable. The information provided is based on established best practices and documentation as of 2025. For the most current information, refer to the official documentation links provided above.
