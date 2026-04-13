# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FinCalc Suite** — a static, no-build-step PWA (Progressive Web App) offering ~20 Indian personal finance calculators. Deployed to GitHub Pages at `https://yashpal-0.github.io/Financial-Calculator/`. No server, no bundler, no framework.

## Commands

```bash
# Build/watch Tailwind CSS (the only build step)
npm run build:css
# Equivalent: npx @tailwindcss/cli -i ./src/input.css -o ./styles.css --watch

# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8080
```

There are no tests, no linting scripts, and no other npm scripts.

## Architecture

### File layout
- `index.html` — homepage/hub linking to all calculators
- `pages/*.html` — one HTML file per calculator (20 calculators)
- `scripts/*.js` — ES module scripts, one per calculator plus shared modules
- `styles.css` — compiled Tailwind output (do **not** edit manually)
- `src/input.css` — Tailwind source with custom theme tokens and component classes
- `service-worker.js` — caches assets for offline use (bump `CACHE_NAME` on deploy)
- `manifest.webmanifest` — PWA manifest

### Shared script modules (`scripts/`)
| File | Role |
|------|------|
| `finance.js` | All financial math (EMI, SIP, FD, PPF, tax, prepayment schedule, etc.) — pure functions, no DOM |
| `ui.js` | DOM helpers for the prepayment page: input collection, schedule rendering, Chart.js donut chart, CSV export |
| `util.js` | Tiny utilities: `toNumber`, `formatINR`, `formatNum`, `formatDate`, date helpers |
| `app.js` | `initApp()` — theme toggle, service-worker registration, PWA install prompt; called by every page |

### Per-page scripts
Each `scripts/<name>.js` is a self-contained ES module that imports from `finance.js`, `util.js`, and sometimes `app.js`. It handles input reading, calculation invocation, and DOM updates for its page. Pages load scripts with `<script type="module">`.

### Styling conventions
- Tailwind v4 utility classes are used everywhere.
- Dark mode is toggled via `data-theme="dark"` on `<html>` (not the Tailwind `dark:` media query). The custom variant in `src/input.css` handles this: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`.
- Reusable component classes (`.btn-primary`, `.btn-secondary`, `.input-field`, `.card`, `.label-text`, etc.) are defined in `src/input.css` under `@layer components`.
- Primary brand color is teal (`#0d9488`).

### Chart.js
Chart.js is loaded via CDN `<script>` tag in individual HTML pages that need it. The prepayment page uses a donut chart rendered in `ui.js`. Other pages manage their own chart instances as `window.chartInstance`.

### PWA / offline
- `service-worker.js` caches a static list of URLs (`OFFLINE_URLS`). When adding new pages/scripts, add them to this list and bump `CACHE_NAME` so users receive the update.
- `app.js:initApp()` registers the service worker with dynamic scope detection (works both at root and under `/pages/`).

### Adding a new calculator
1. Create `pages/<name>.html` — copy nav/header structure from an existing page, add a `<script type="module" src="../scripts/<name>.js"></script>`.
2. Create `scripts/<name>.js` — import from `finance.js`/`util.js`/`app.js`, call `initApp()` on load.
3. Add the financial logic as an exported function in `finance.js` (pure, no DOM).
4. Add the new page to `OFFLINE_URLS` in `service-worker.js` and bump `CACHE_NAME`.
5. Add nav links in every existing HTML file.