import { describe, it, expect } from 'vitest';

describe('Core Package', () => {
  it('should be in node environment', () => {
    expect(typeof window).toBe('undefined');
  });

  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have no framework imports in package.json', async () => {
    const fs = await import('fs/promises');
    const pkg = JSON.parse(
      await fs.readFile(new URL('../../package.json', import.meta.url), 'utf-8')
    );

    const deps = Object.keys(pkg.dependencies || {});
    const frameworkDeps = deps.filter(
      (d) => d.includes('react') || d.includes('vue') || d.includes('svelte')
    );

    expect(frameworkDeps).toHaveLength(0);
  });
});
