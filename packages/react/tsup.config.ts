import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: [
    'react',
    'react-dom',
    'react-hook-form',
  ],
  esbuildOptions(opts) {
    opts.jsx = 'automatic';
  },
  // Auto-push to yalc on successful build in watch mode
  onSuccess: options.watch ? 'yalc push --changed' : undefined,
}));
