# Pixframe Agent Guide

This file is for coding agents working in this repo. It captures commands and conventions.

Repo layout
- `web/`: Desktop/Web (React + Vite)
- `mobile/`: Mobile UI (React + Vite; Capacitor deps present)
- `.skills/`: vendored agent skills (not required for builds)

## Build / Lint / “Tests”

No dedicated automated test runner is checked in (no Vitest/Jest/Playwright). Treat `lint` + `tsc` + `vite build` as the CI gate.

### Root
```bash
npm install
npm run dev
```

### Web (`web/`)
```bash
cd web
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

### Mobile (`mobile/`)
```bash
cd mobile
npm install
npm run dev -- --port 5174
npm run lint
npm run build
```

### “Single test” / narrow-scope checks

Since there is no test runner, use narrow checks:

ESLint a single file
```bash
cd web
npx eslint src/components/desktop-layout.tsx
```

Typecheck only (no bundle)
```bash
cd web
npx tsc -p tsconfig.json --noEmit
```

Build only one app
```bash
cd mobile
npm run build
```

Security audit (production deps)
```bash
cd web
npm audit --omit=dev
```

## Release automation

Tag pushes create GitHub Releases automatically.
- Workflow: `.github/workflows/release.yml`
- Trigger: push a `v*.*.*` tag (example `v2.0.3`)

Recommended release flow (version bump -> tag -> release notes auto-generated):
1) Bump versions (keep them in sync)
   - `package.json` (root)
   - `web/package.json`
   - `mobile/package.json`
2) Commit the version bump
3) Create and push the tag `vX.Y.Z` (GitHub generates the Release + notes)

```bash
git commit -am "chore: release v2.0.3"
git tag -a v2.0.3 -m "v2.0.3"
git push origin main
git push origin v2.0.3
```

## Code Style & Conventions

### Formatting

Prettier lives in `web/.prettierrc` and `mobile/.prettierrc`.
- `printWidth: 200`, `singleQuote: true`, `semi: true`, `tabWidth: 2`

### ESLint

Config: `web/.eslintrc.cjs`, `mobile/.eslintrc.cjs`
- `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`
- `react-refresh/only-export-components` is enabled

`npm run lint` uses `--max-warnings 0`; do not introduce warnings.

### TypeScript

`web/tsconfig.json` and `mobile/tsconfig.json`:
- `strict: true`
- `noUnusedLocals`, `noUnusedParameters` enabled

Guidelines
- Avoid `any`. Prefer `unknown` + checks, or a narrow union type.
- Prefer browser-safe timers: `ReturnType<typeof setTimeout>`.
- Keep casts local; avoid `as any`.

### Imports

- Use ES module imports.
- Assume no path aliases; use relative imports under `src/`.
- Group imports: external libs first, then internal modules.

### Naming

- React components: `PascalCase`.
- Hooks: `useX`.
- Files: mostly kebab-case in UI (`desktop-layout.tsx`, `drop-zone.tsx`). Keep consistent.
- Theme folders: numeric prefix + name (e.g. `07_STRAP/index.ts`). Preserve numbering.
- Boolean names: `isX`/`hasX`/`showX`/`enableX`/`disableX`.

### State management (Zustand)

Stores live in `*/src/stores/**`.
- `*/src/stores/index.ts` merges stores for backwards compat (`useStore()`)
- Prefer using specific stores: `useUIStore`, `usePhotoStore`, `useSettingsStore`
- Persist user preferences via `SafeStorage` (`*/src/utils/safe-storage`)

Photo/selection boundary conditions to always handle
- Empty list
- Deleting the selected photo
- Selected index out of range after mutation

### i18n

Translations: `*/src/locales/translations/*.json`.
- When adding/changing UI strings, update all supported locales (en/ja/ko/zh-CN).

### Error handling

- Wrap heavy async flows (HEIC conversion, EXIF parsing, canvas render, zip export, downloads) in `try/catch/finally`.
- Log with context (operation + file/theme).
- For user-facing errors, prefer translated messages and avoid leaking stack traces.
- Serialize safely: `error instanceof Error ? error.message : 'Unknown error'`.

### Performance

Image work is expensive.
- Avoid unnecessary re-renders; keep hook deps accurate.
- Prefer progress reporting via the UI store loading/progress state.
- Keep heavy modules isolated to enable lazy loading/code splitting.

## Cursor / Copilot rules

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No Copilot instructions found (`.github/copilot-instructions.md` not present).

## Pre-PR checklist

- `web/`: `npm run lint` then `npm run build`
- `mobile/`: `npm run lint` then `npm run build`
- `npm audit --omit=dev` after dependency changes
- Ensure `.gitignore` rules are respected (e.g. `특허/` is local-only)
