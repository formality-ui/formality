// @formality/core - Framework Independence Verification Tests
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Framework Independence', () => {
  const srcDir = path.join(__dirname, '..');

  const getSourceFiles = (dir: string, extensions: string[] = ['.ts']): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
        files.push(...getSourceFiles(fullPath, extensions));
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  };

  it('should have no React imports in source files', () => {
    const issues: string[] = [];
    const sourceFiles = getSourceFiles(srcDir);

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);

      // Check for React imports
      if (content.includes("from 'react'") || content.includes('from "react"')) {
        issues.push(`${relativePath}: contains React import`);
      }
      if (content.includes("from 'react-dom'") || content.includes('from "react-dom"')) {
        issues.push(`${relativePath}: contains React DOM import`);
      }
      // Check for react-hook-form
      if (content.includes("from 'react-hook-form'") || content.includes('from "react-hook-form"')) {
        issues.push(`${relativePath}: contains react-hook-form import`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('should have no Vue imports in source files', () => {
    const issues: string[] = [];
    const sourceFiles = getSourceFiles(srcDir);

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);

      if (content.includes("from 'vue'") || content.includes('from "vue"')) {
        issues.push(`${relativePath}: contains Vue import`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('should have no Svelte imports in source files', () => {
    const issues: string[] = [];
    const sourceFiles = getSourceFiles(srcDir);

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);

      if (content.includes("from 'svelte'") || content.includes('from "svelte"')) {
        issues.push(`${relativePath}: contains Svelte import`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('should have no React types in exported types', () => {
    const typesDir = path.join(srcDir, 'types');
    const typeFiles = getSourceFiles(typesDir);

    const issues: string[] = [];

    for (const filePath of typeFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);

      // Check that types don't reference React-specific types
      if (content.includes('React.')) {
        issues.push(`${relativePath}: contains React. reference`);
      }
      if (content.includes('ReactNode')) {
        issues.push(`${relativePath}: contains ReactNode type`);
      }
      if (content.includes('ReactElement')) {
        issues.push(`${relativePath}: contains ReactElement type`);
      }
      if (content.includes('JSX.Element')) {
        issues.push(`${relativePath}: contains JSX.Element type`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('should not use React hooks patterns in pure functions', () => {
    const issues: string[] = [];
    const sourceFiles = getSourceFiles(srcDir);

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);

      // Check for specific React hook imports
      if (content.includes('useState')) {
        issues.push(`${relativePath}: contains useState`);
      }
      if (content.includes('useEffect')) {
        issues.push(`${relativePath}: contains useEffect`);
      }
      if (content.includes('useMemo')) {
        issues.push(`${relativePath}: contains useMemo`);
      }
      if (content.includes('useCallback')) {
        issues.push(`${relativePath}: contains useCallback`);
      }
      if (content.includes('useRef')) {
        issues.push(`${relativePath}: contains useRef`);
      }
      if (content.includes('useContext')) {
        issues.push(`${relativePath}: contains useContext`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('should verify package.json has no framework dependencies', () => {
    const packageJsonPath = path.join(srcDir, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.peerDependencies,
    };

    const frameworkDeps = Object.keys(deps).filter((dep) =>
      ['react', 'react-dom', 'vue', 'svelte', 'react-hook-form'].includes(dep)
    );

    expect(frameworkDeps).toEqual([]);
  });

  it('should export only pure functions from main entry point', () => {
    const indexPath = path.join(srcDir, 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Check that index.ts doesn't import from any framework
    expect(content).not.toContain("from 'react'");
    expect(content).not.toContain('from "react"');
    expect(content).not.toContain("from 'vue'");
    expect(content).not.toContain('from "vue"');
    expect(content).not.toContain("from 'svelte'");
    expect(content).not.toContain('from "svelte"');
  });

  it('should have comment indicating framework independence', () => {
    const indexPath = path.join(srcDir, 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Check that the file has documentation about being framework-agnostic
    expect(content).toContain('framework');
  });

  describe('Functional Exports Verification', () => {
    it('should export evaluate as a pure function', async () => {
      const { evaluate } = await import('../expression');
      expect(typeof evaluate).toBe('function');

      // Should work without any framework context
      const result = evaluate('true && false', { values: {} });
      expect(result).toBe(false);
    });

    it('should export evaluateConditions as a pure function', async () => {
      const { evaluateConditions } = await import('../conditions');
      expect(typeof evaluateConditions).toBe('function');

      // Should work without any framework context
      const result = evaluateConditions({
        conditions: [{ when: 'test', truthy: true, disabled: true }],
        fieldValues: { test: true },
      });
      expect(result.disabled).toBe(true);
    });

    it('should export runValidator as a pure function', async () => {
      const { runValidator, required } = await import('../validation');
      expect(typeof runValidator).toBe('function');

      // Should work without any framework context
      const result = await runValidator(required(), '', {});
      expect(result).not.toBe(true);
    });

    it('should export humanizeLabel as a pure function', async () => {
      const { humanizeLabel } = await import('../labels');
      expect(typeof humanizeLabel).toBe('function');

      // Should work without any framework context
      expect(humanizeLabel('clientContact')).toBe('Client Contact');
      expect(humanizeLabel('minGrossMargin')).toBe('Min Gross Margin');
    });

    it('should export parse and format as pure functions', async () => {
      const { parse, format, createFloatParser, createFloatFormatter } = await import('../transform');

      expect(typeof parse).toBe('function');
      expect(typeof format).toBe('function');

      // Should work without any framework context
      const parser = createFloatParser();
      const formatter = createFloatFormatter(2);

      expect(parse('42.567', parser)).toBe(42.567);
      expect(format(42.567, formatter)).toBe('42.57');
    });

    it('should export deepMerge as a pure function', async () => {
      const { deepMerge } = await import('../config');
      expect(typeof deepMerge).toBe('function');

      // Should work without any framework context
      const result = deepMerge({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});
