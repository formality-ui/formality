import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@formality/core',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
