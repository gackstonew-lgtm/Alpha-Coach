# Arcade Fx Toolchain Upgrade & Maintenance Policy

This document defines the coordinated dependency and toolchain upgrade policy for **Arcade Fx**.

---

## 1. Toolchain Stability Policy

Frontend tooling packages are tightly interdependent. Upgrading an individual package to a new major version in isolation creates peer dependency conflicts or runtime/build pipeline failures.

To protect production and preview builds from uncoordinated bumps:
1. Automated tools (Dependabot) are configured in [`.github/dependabot.yml`](../.github/dependabot.yml) to perform **minor and patch** updates automatically.
2. **Major version upgrades** of core toolchain packages must be performed manually in dedicated upgrade branches where all interrelated dependencies and configs are updated and verified together.
3. Vercel builds for standalone Dependabot branches are automatically skipped via the `ignoreCommand` in `vercel.json` to prevent failed preview noise and resource exhaustion.

---

## 2. Coordinated Upgrade Ecosystems

### Ecosystem A: Vite Toolchain
These packages must always be upgraded in lockstep:
- `vite`
- `@vitejs/plugin-react`
- `vite-plugin-pwa`
- `typescript`
- `@types/react` and `@types/react-dom`

#### Root Cause of Failure (PR #20 / `@vitejs/plugin-react@6.1.2`):
- Dependabot opened a PR bumping `@vitejs/plugin-react` from `4.3.4` to `6.1.2`.
- `@vitejs/plugin-react@6.x` requires peer dependency `vite@^8.0.0` or higher.
- The project is on `vite@^6.2.0` (resolves `6.4.3`).
- `npm install` strictly enforces peer dependencies and aborted with `ERESOLVE unable to resolve dependency tree`.
- **Resolution**: Ignored `@vitejs/plugin-react` semver-major updates in Dependabot until a planned migration to Vite 8 is executed across all toolchain packages.

#### Coordinated Migration Checklist (When moving to Vite 8+):
1. Create a dedicated branch `chore/upgrade-vite-8`.
2. Update `frontend/package.json`:
   - `"vite": "^8.x"`
   - `"@vitejs/plugin-react": "^6.x"`
   - Verify `"vite-plugin-pwa"` compatibility with Vite 8 (currently accepts `^3 || ^4 || ^5 || ^6 || ^7 || ^8`).
   - Run `npm install` without `--force` or `--legacy-peer-deps`.
3. Verify plugin configuration in `frontend/vite.config.ts`.
4. Run `npx tsc --noEmit && npm run build` to confirm zero regressions.
5. Merge via PR to `main`.

---

### Ecosystem B: Tailwind CSS & PostCSS
These packages must be upgraded together with configuration file migrations:
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `@tailwindcss/postcss` (required for v4)

#### Root Cause of Failure (PR #17 / `tailwindcss-4.3.3`):
- Dependabot opened a PR bumping `tailwindcss` from `3.4.17` to `4.3.3`.
- Tailwind v4 replaced the legacy PostCSS plugin inside `tailwindcss` with the standalone `@tailwindcss/postcss` package.
- `postcss.config.js` was still configured with `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.
- Build aborted with: `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package...`.
- Additionally, Tailwind v4 moves from JavaScript-based `tailwind.config.js` to CSS-first `@theme` variables and directives.
- **Resolution**: Ignored `tailwindcss` and `postcss` semver-major updates in Dependabot. The project remains on Tailwind v3 LTS (`3.4.17`).

#### Coordinated Migration Checklist (When moving to Tailwind v4+):
1. Create a dedicated branch `chore/upgrade-tailwind-v4`.
2. Install `@tailwindcss/postcss` in `frontend/devDependencies`.
3. Update `frontend/postcss.config.js` to reference `@tailwindcss/postcss`.
4. Migrate `frontend/src/index.css` from `@tailwind base; @tailwind components; @tailwind utilities;` to `@import "tailwindcss";` and import custom color tokens via `@theme`.
5. Run full build and test responsive layouts (Bento grids, Bottom sheets, Hostinger design tokens).
6. Merge via PR to `main`.

---

### Ecosystem C: Data Visualization (Recharts)
- `recharts@2.15.x` is currently active and stable.
- `npm ci` logs a deprecation notice recommending migration to Recharts v3.
- Recharts v3 introduces breaking changes to custom tooltips, responsive containers, and SVG sizing properties.
- **Resolution**: Keep `recharts` pinned to v2 LTS in production. Plan a separate feature branch `chore/upgrade-recharts-v3` with comprehensive visual QA on `ChartsPage`, `DashboardPage`, and `SecTrackerPage`.

---

### Ecosystem D: Transitive Dependencies (Workbox & Glob)
- `npm ci` reports a deprecation notice for `glob@11.1.0`.
- Dependency trace (`npm ls glob` in `frontend`):
  ```
  alpha-coach-frontend@1.0.4
  `-- vite-plugin-pwa@1.3.0
    `-- workbox-build@7.4.1
      `-- glob@11.1.0
  ```
- `glob@11.1.0` is an internal transitive dependency of Google's official `workbox-build@7.4.1` library.
- It is only executed at build-time to collect static assets for the PWA service worker precache manifest, not in the browser runtime.
- Do not apply overrides that could break Workbox asset discovery. This notice will resolve naturally when Google releases Workbox 8.

---

## 3. GitHub Dependabot PR Management

The following existing PRs created by Dependabot must be closed to keep GitHub clear:

1. **PR #17** (`dependabot/npm_and_yarn/frontend/tailwindcss-4.3.3`):
   - Comment on PR: `@dependabot close`
   - Or close directly via GitHub Web UI with comment: "Closing uncoordinated Tailwind v4 bump. Tailwind v3 LTS is pinned per docs/UPGRADES.md."
2. **PR #20** (`dependabot/npm_and_yarn/frontend/vitejs/plugin-react-6.1.2`):
   - Comment on PR: `@dependabot close`
   - Or close directly via GitHub Web UI with comment: "Closing uncoordinated @vitejs/plugin-react v6 bump. Requires coordinated Vite 8 upgrade per docs/UPGRADES.md."
