# Design Spec: FinCalc Suite Premium Evolution (2026)

## 1. Objective
Transform the 'Prepayment Home Loan Calculator' suite into a premium, reactive, and logically flawless financial dashboard using Preact and a modern Glassmorphism design system.

## 2. Visual & Interaction Design
- **Theme**: Premium Glassmorphism.
  - Background: `Slate-50` (Light) / `Slate-950` (Dark).
  - Cards: Translucent white/dark-blue with `backdrop-filter: blur(16px)` and 1px borders.
  - Palette: Emerald-Cyan-Indigo gradients for primary actions.
- **Interactions**:
  - **Instant-Update**: Calculations re-run on every input change (debounced for text, real-time for sliders).
  - **Shareable State**: Sync calculation inputs to URL query parameters (e.g., `?p=5000000&r=8.5&t=240`).
  - **Animations**: Smooth layout transitions when result sections expand/collapse.

## 3. Architecture (Option B)
- **Framework**: Preact + HTM (No-build, served via ES Modules).
- **Component Model**:
  - `Layout`: Unified header, nav, and footer.
  - `InputGroup`: Standardized sliders and number inputs with instant validation.
  - `ResultSummary`: High-level KPIs with animated counters.
  - `AmortizationTable`: Paginated/Virtual-scroll table for long schedules.
  - `VisualChart`: Chart.js wrapper that syncs colors with Tailwind dark-mode tokens.

## 4. Logical Fixes & Financial Accuracy
- **Prepayment Logic**: Move to "Bank Standard" (Interest calculated on opening balance before prepayment is applied).
- **SSY Calculation**: Implement monthly accrual simulation (balance on 5th vs end-of-month) with annual interest credit.
- **Tax Module**: Update to FY 2025-26 rules (latest Budget updates).
- **Validation**: Strict input sanitization (e.g., preventing negative interest or infinite tenures).

## 5. Implementation Strategy
- **Phase 1**: Core design tokens and `finance.js` audit.
- **Phase 2**: Base components (`Input`, `Slider`, `Card`).
- **Phase 3**: Migrate calculators starting with `emi.html` and `prepayment.html`.
- **Phase 4**: Global polish, PWA updates, and SEO metadata.

## 6. Success Criteria
- All calculations match Indian bank standards (SBI/HDFC) within 0.01% accuracy.
- Page Load Speed: Under 1s (First Contentful Paint).
- Accessibility: WCAG 2.1 AA compliant.
- UI: "Premium" aesthetic rating from user feedback.
