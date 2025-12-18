// @formality/react - makeProxyState
// Lazy property access utility for React performance optimization

/**
 * Creates a proxy object with lazy property access via Object.defineProperty
 *
 * CRITICAL: This enables React's dependency tracking to only register
 * dependencies on actually accessed properties, not the entire object.
 *
 * Without proxy: accessing fieldState.value creates dependency on entire fieldState
 * With proxy: accessing fieldState.value only creates dependency on value property
 *
 * Performance Impact:
 * - Reduces unnecessary re-renders in condition-heavy forms
 * - Expression evaluation only subscribes to properties actually used
 * - Field states can change without triggering re-renders in unrelated fields
 *
 * Implementation Note:
 * Uses Object.defineProperty (NOT Proxy) because:
 * - Better performance for simple property access
 * - Works with Object.keys() iteration when enumerable: true
 * - Simpler debugging and stack traces
 *
 * @param source - The object to wrap with lazy getters
 * @returns A new object with getter properties that lazily access source
 *
 * @example
 * ```typescript
 * const source = { value: 5, isTouched: false };
 * const proxy = makeProxyState(source);
 *
 * // Properties are accessed lazily
 * console.log(proxy.value); // 5
 *
 * // Changes to source reflect in proxy (lazy access)
 * source.value = 10;
 * console.log(proxy.value); // 10
 *
 * // Object.keys still works
 * console.log(Object.keys(proxy)); // ['value', 'isTouched']
 * ```
 */
export function makeProxyState<T extends object>(source: T): T {
  const result = {} as T;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      Object.defineProperty(result, key, {
        get: () => source[key],
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}

/**
 * Creates a nested proxy state, recursively wrapping objects
 *
 * Use this for deeply nested state objects where you want
 * lazy access at multiple levels.
 *
 * @param source - The object to wrap with lazy getters (recursively)
 * @returns A new object with recursive getter properties
 */
export function makeDeepProxyState<T extends object>(source: T): T {
  const result = {} as T;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      Object.defineProperty(result, key, {
        get: () => {
          const currentValue = source[key];
          if (
            currentValue !== null &&
            typeof currentValue === 'object' &&
            !Array.isArray(currentValue)
          ) {
            return makeDeepProxyState(currentValue as object);
          }
          return currentValue;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}
