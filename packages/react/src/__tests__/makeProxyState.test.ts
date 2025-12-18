import { describe, it, expect } from 'vitest';
import { makeProxyState, makeDeepProxyState } from '../utils/makeProxyState';

describe('makeProxyState', () => {
  it('should create an object with getter properties', () => {
    const source = { value: 5, isTouched: false };
    const proxy = makeProxyState(source);

    // Verify getters were created (not direct values)
    const valueDescriptor = Object.getOwnPropertyDescriptor(proxy, 'value');
    expect(valueDescriptor?.get).toBeTypeOf('function');
    expect(valueDescriptor?.set).toBeUndefined();

    const touchedDescriptor = Object.getOwnPropertyDescriptor(proxy, 'isTouched');
    expect(touchedDescriptor?.get).toBeTypeOf('function');
  });

  it('should return correct values when accessed', () => {
    const source = { value: 5, isTouched: false, nested: { id: 1 } };
    const proxy = makeProxyState(source);

    expect(proxy.value).toBe(5);
    expect(proxy.isTouched).toBe(false);
    expect(proxy.nested).toEqual({ id: 1 });
  });

  it('should be enumerable for Object.keys', () => {
    const source = { value: 5, isTouched: false };
    const proxy = makeProxyState(source);

    expect(Object.keys(proxy)).toEqual(['value', 'isTouched']);
  });

  it('should reflect source changes (lazy access)', () => {
    const source = { value: 5 };
    const proxy = makeProxyState(source);

    expect(proxy.value).toBe(5);
    source.value = 10;
    expect(proxy.value).toBe(10); // Lazy access returns updated value
  });

  it('should support in operator for property checking', () => {
    const source = { value: 5 };
    const proxy = makeProxyState(source);

    expect('value' in proxy).toBe(true);
    expect('nonexistent' in proxy).toBe(false);
  });

  it('should NOT create dependencies on unaccessed properties', () => {
    const source = { value: 5, isTouched: false, isDirty: false };
    const proxy = makeProxyState(source);

    // Only access 'value'
    const _accessedValue = proxy.value;

    // Verify that the descriptor shows a getter (not direct value)
    const descriptor = Object.getOwnPropertyDescriptor(proxy, 'isTouched');
    expect(descriptor?.get).toBeDefined();
    expect(descriptor?.value).toBeUndefined();
  });

  it('should handle undefined values correctly', () => {
    const source: { value: number | undefined; name?: string } = { value: undefined };
    const proxy = makeProxyState(source);

    expect(proxy.value).toBeUndefined();
    expect(proxy.name).toBeUndefined();
  });

  it('should handle null values correctly', () => {
    const source = { value: null };
    const proxy = makeProxyState(source);

    expect(proxy.value).toBeNull();
  });

  it('should preserve array values', () => {
    const source = { items: [1, 2, 3], nested: { arr: ['a', 'b'] } };
    const proxy = makeProxyState(source);

    expect(proxy.items).toEqual([1, 2, 3]);
    expect(proxy.nested).toEqual({ arr: ['a', 'b'] });
    expect(Array.isArray(proxy.items)).toBe(true);
  });

  it('should handle empty objects', () => {
    const source = {};
    const proxy = makeProxyState(source);

    expect(Object.keys(proxy)).toEqual([]);
  });

  it('should handle objects with many properties', () => {
    const source = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7,
      h: 8,
      i: 9,
      j: 10,
    };
    const proxy = makeProxyState(source);

    expect(Object.keys(proxy).length).toBe(10);
    expect(proxy.a).toBe(1);
    expect(proxy.j).toBe(10);
  });

  it('should be configurable (allows property redefinition)', () => {
    const source = { value: 5 };
    const proxy = makeProxyState(source);

    // Configurable allows redefinition
    const descriptor = Object.getOwnPropertyDescriptor(proxy, 'value');
    expect(descriptor?.configurable).toBe(true);
  });

  it('should only include own properties, not prototype properties', () => {
    const parent = { inherited: true };
    const source = Object.create(parent);
    source.own = 'value';

    const proxy = makeProxyState(source);

    expect(Object.keys(proxy)).toEqual(['own']);
    expect(proxy.own).toBe('value');
    // Inherited property should not be copied
    expect('inherited' in proxy).toBe(false);
  });
});

describe('makeDeepProxyState', () => {
  it('should create nested proxy objects', () => {
    const source = {
      level1: {
        level2: {
          value: 42,
        },
      },
    };
    const proxy = makeDeepProxyState(source);

    // Access nested value
    expect(proxy.level1.level2.value).toBe(42);

    // Verify nested object is also proxied
    const level1Descriptor = Object.getOwnPropertyDescriptor(proxy, 'level1');
    expect(level1Descriptor?.get).toBeTypeOf('function');
  });

  it('should reflect nested source changes', () => {
    const source = {
      nested: {
        value: 5,
      },
    };
    const proxy = makeDeepProxyState(source);

    expect(proxy.nested.value).toBe(5);
    source.nested.value = 10;
    expect(proxy.nested.value).toBe(10);
  });

  it('should not wrap arrays', () => {
    const source = {
      items: [1, 2, 3],
    };
    const proxy = makeDeepProxyState(source);

    expect(proxy.items).toEqual([1, 2, 3]);
    expect(Array.isArray(proxy.items)).toBe(true);
  });

  it('should handle mixed structures', () => {
    const source = {
      simple: 'value',
      nested: {
        deep: {
          number: 42,
          string: 'hello',
        },
      },
      array: [1, 2, 3],
      nullValue: null,
    };
    const proxy = makeDeepProxyState(source);

    expect(proxy.simple).toBe('value');
    expect(proxy.nested.deep.number).toBe(42);
    expect(proxy.nested.deep.string).toBe('hello');
    expect(proxy.array).toEqual([1, 2, 3]);
    expect(proxy.nullValue).toBeNull();
  });
});
