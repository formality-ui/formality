import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@formality/react',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
