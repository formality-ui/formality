# Development Notes

## Local Development with a Consumer Project

This package uses [yalc](https://github.com/wclr/yalc) for local development against a real project.

### Initial Setup (one-time)

1. Install yalc globally:
   ```bash
   npm install -g yalc
   ```

2. Build and publish packages to local yalc store:
   ```bash
   pnpm build
   pnpm -r exec yalc push
   ```

3. In your consumer project, link the packages:
   ```bash
   cd /path/to/your-project
   yalc link @formality-ui/core @formality-ui/react
   ```

   This creates symlinks in `node_modules/@formality-ui/*` pointing to `.yalc/@formality-ui/*`.

4. If your consumer project uses webpack (e.g., Create React App with CRACO), add this to your webpack config to watch symlinked packages:
   ```js
   webpackConfig.resolve.symlinks = false;
   webpackConfig.snapshot = {
     ...(webpackConfig.snapshot || {}),
     managedPaths: [],
   };
   ```

### Development Workflow

**Terminal 1** - Run the watch build in this repo:
```bash
pnpm dev
```

This runs `tsup --watch` for all packages. On each successful rebuild, it automatically runs `yalc push --changed` to update the consumer project.

**Terminal 2** - Run your consumer project's dev server:
```bash
cd /path/to/your-project
yarn start  # or npm start
```

Now when you edit source files in this repo:
1. tsup detects the change and rebuilds
2. yalc pushes the new build to the consumer project
3. webpack detects the change and hot reloads

### Troubleshooting

**Changes not appearing?**

Clear the consumer project's webpack cache:
```bash
rm -rf node_modules/.cache
```

**Need to re-link after npm/yarn install?**

If you run `npm install` or `yarn` in the consumer project, it may overwrite the yalc links. Re-run:
```bash
yalc link @formality-ui/core @formality-ui/react
```

**Check link status:**
```bash
cat yalc.lock
```

Should show packages without `"file": true` (link mode, not copy mode).
