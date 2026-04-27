# Implementation Plan: FinCalc Suite Premium Evolution

## 1. Background & Motivation
The current codebase consists of a collection of static HTML pages and vanilla JS scripts. While functional, it lacks reactivity (instant updates), shared component logic, and a modern "premium" aesthetic. This plan outlines the migration to a Preact-based component architecture with a high-fidelity design system and corrected financial logic.

## 2. Scope & Impact
- **Framework**: Migrate from vanilla JS/DOM manipulation to Preact + HTM (ES Modules).
- **UI/UX**: Global CSS update for Glassmorphism; redesign of all 14+ calculators.
- **Logic**: Audit and fix `finance.js` for prepayment timing, SSY accuracy, and FY 2025-26 tax rules.
- **Features**: URL state syncing, instant-calculate, and enhanced PWA support.

## 3. Proposed Solution
Use a "No-Build" Preact setup to maintain the project's simplicity. Each HTML page will remain as an entry point but will mount a Preact app that shares a common component library.

## 4. Phased Implementation Plan

### Phase 1: Foundation (Design & Logic)
- **Task 1.1: Global Styles**: Update `styles.css` with Tailwind v4 variables for Glassmorphism (`blur`, `border-opacity`, `glow` utility classes).
- **Task 1.2: Finance Core Audit**: 
  - Update `generateSchedule` in `finance.js` to Interest-First logic.
  - Implement precise SSY monthly simulation.
  - Update tax slabs for FY 2025-26.

### Phase 2: Shared Component Library
- **Task 2.1: Base Components**: Create `components/UI.js` containing:
    - `Slider`: Range input with synced number field.
    - `GlassCard`: Standard wrapper with blur effects.
    - `ResultSummary`: KPI display with animated numbers.
- **Task 2.2: State Management**: Create `scripts/state.js` for URL parameter syncing and debounced state updates.

### Phase 3: Main Page Migration (EMI & Prepay)
- **Task 3.1: EMI Calculator**: Rebuild `pages/emi.html` using the new component system.
- **Task 3.2: Prepayment Calculator**: Rebuild `pages/prepayment.html` with reactive "what-if" modeling.

### Phase 4: Full Suite Migration
- **Task 4.1: Investment Tools**: Migrate SIP, Step-Up SIP, Mutual Fund, FD, RD.
- **Task 4.2: Planning Tools**: Migrate Retirement, Inflation, Tax.
- **Task 4.3: Utility Tools**: Migrate CAGR, GST, Gratuity, SSY, POMIS.

### Phase 5: Final Polish & Verification
- **Task 5.1: Navigation & Home**: Update `index.html` to a dashboard view showing high-level snapshots from recent calculations.
- **Task 5.2: PWA & Performance**: Update `service-worker.js` and `manifest.webmanifest`.
- **Task 5.3: Verification**: Cross-verify all 14 calculators against trusted benchmarks.

## 5. Verification Plan
- **Unit Tests**: Add a suite of tests for `finance.js` using a lightweight test runner (or `smoke-test.mjs`).
- **Visual Audit**: Check contrast ratios (WCAG AA) and mobile responsiveness.
- **Functional Testing**: Verify URL state persistence (refreshing the page maintains inputs).

## 6. Migration & Rollback
- Each page migration will be done in a separate commit.
- Rollback strategy: Revert to the specific commit of the failed page migration.
- Original files will be kept as `.bak` or in a `legacy/` folder if needed during the transition, then removed.
