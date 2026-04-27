# Research: FinCalc Suite Enhancements

## Core Modules Analysis

- **`scripts/finance.js`**: Central calculation logic. Contains functions for EMI, SIP, Tax, etc.
- **`scripts/ui.js`**: Shared UI rendering logic, including charts (using Chart.js) and DOM manipulation.
- **`scripts/util.js`**: Utility functions for formatting and basic date math.
- **`scripts/main.js`**: Entry point for the Prepayment calculator.
- **`styles.css`**: Tailwind v4 based styles.
- **`pages/`**: Individual calculator HTML files.

## Observed Logical Issues

1. **Prepayment Month Offset**: In `finance.js`, `buildPrepayInstances` sets `monthOffset: 0` for 'once', but `generateSchedule` checks `prepayQueue[0].monthOffset + 1 === installmentIndex`. Since `installmentIndex` starts at 1, a `monthOffset` of 0 means the prepayment applies in Month 1. However, most users expect "Month 1" to mean "at the time of the first EMI". The current logic applies it *before* the first EMI interest is calculated.
2. **Prepayment Strategy 'reduce_tenure'**: When reducing tenure, `remainingMonths` is recalculated using `computeRemainingMonths`. However, the loop continues based on `remainingMonths -= 1`. If `remainingMonths` becomes larger than original due to some weird input, it might loop longer than expected, though `installmentIndex < 1200` protects it.
3. **SSY Calculation**: Sukanya Samriddhi Yojana (SSY) logic in `finance.js` uses a simple loop of 21 years. In reality, deposits are for 15 years, and interest continues for 21 years. The current code `if (i < tenureYears) { balance += yearlyDeposit; }` is correct, but SSY interest is compounded *monthly* but credited *annually* in some systems. I need to verify the exact SSY formula.
4. **Income Tax**: Currently hardcoded for FY 2024-25. It should ideally be updated or clearly labeled.
5. **Chart Color Sync**: Charts use hardcoded RGBA values which might not perfectly match Tailwind's dark mode variables if they change.

## UI/UX Improvement Ideas (Aesthetic Redesign)

1. **Glassmorphism**: Current UI uses `backdrop-blur-md` on the nav, but cards could benefit from a more consistent glassmorphism effect.
2. **Typography**: The site uses "Plus Jakarta Sans". We can enhance readability with better line-heights and letter-spacing.
3. **Animations**: Use Framer Motion style transitions (via CSS) for results appearing.
4. **Interactive Elements**: Better slider feedback, skeleton loaders for charts, and more "premium" looking input fields.
5. **Empty States**: Improve how results look before any calculation is performed.

## Implementation Strategy

### Phase 1: Foundation & Design System
- Refine Tailwind configuration and variables.
- Standardize components (Buttons, Inputs, Cards).

### Phase 2: Logical Bug Fixes
- Fix prepayment month logic.
- Audit and refine complex financial formulas (SSY, Step-Up SIP).

### Phase 3: UI Redesign (Page by Page)
- Index/Home page: Make it a proper dashboard.
- Individual calculators: Consistent layout, better responsiveness.

### Phase 4: Polish & Performance
- Optimize Chart.js initialization.
- Enhance PWA features (manifest, service worker).
