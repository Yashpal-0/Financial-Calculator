# Graph Report - .  (2026-04-24)

## Corpus Check
- Corpus is ~36,243 words - fits in a single context window. You may not need a graph.

## Summary
- 168 nodes · 216 edges · 28 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Home (index.html)|Home (index.html)]]
- [[_COMMUNITY_formatINR()|formatINR()]]
- [[_COMMUNITY_finance.js|finance.js]]
- [[_COMMUNITY_ui.js|ui.js]]
- [[_COMMUNITY_education.js|education.js]]
- [[_COMMUNITY_calcLumpsum()|calcLumpsum()]]
- [[_COMMUNITY_Investment & Savings|Investment & Savings]]
- [[_COMMUNITY_util.js|util.js]]
- [[_COMMUNITY_app.js|app.js]]
- [[_COMMUNITY_income-tax.js|income-tax.js]]
- [[_COMMUNITY_retirement.js|retirement.js]]
- [[_COMMUNITY_robots.txt|robots.txt]]
- [[_COMMUNITY_inverseEmiToPrincipal()|inverseEmiToPrincipal()]]
- [[_COMMUNITY_updateDonutChart()|updateDonutChart()]]
- [[_COMMUNITY_updateDonutChart()|updateDonutChart()]]
- [[_COMMUNITY_syncSlider()|syncSlider()]]
- [[_COMMUNITY_fixer.mjs|fixer.mjs]]
- [[_COMMUNITY_fix_rest.mjs|fix_rest.mjs]]
- [[_COMMUNITY_fix_retirement.mjs|fix_retirement.mjs]]
- [[_COMMUNITY_refactor_html.mjs|refactor_html.mjs]]
- [[_COMMUNITY_refactor_js.mjs|refactor_js.mjs]]
- [[_COMMUNITY_refactor_js_batch2.mjs|refactor_js_batch2.mjs]]
- [[_COMMUNITY_refactor_ui.mjs|refactor_ui.mjs]]
- [[_COMMUNITY_service-worker.js|service-worker.js]]
- [[_COMMUNITY_cagr.js|cagr.js]]
- [[_COMMUNITY_gratuity.js|gratuity.js]]
- [[_COMMUNITY_pomis.js|pomis.js]]
- [[_COMMUNITY_ssy.js|ssy.js]]

## God Nodes (most connected - your core abstractions)
1. `formatINR()` - 17 edges
2. `calcSIP()` - 12 edges
3. `calcLumpsum()` - 12 edges
4. `Investment & Savings` - 11 edges
5. `Home (index.html)` - 8 edges
6. `onCalculate()` - 8 edges
7. `getEl()` - 7 edges
8. `onCalculate()` - 7 edges
9. `Loans & Repayment` - 6 edges
10. `Financial Planning` - 6 edges

## Surprising Connections (you probably didn't know these)
- `exportCsv()` --calls--> `click()`  [INFERRED]
  scripts/ui.js → smoke-test.mjs
- `FinCalc Suite` --uses_tech--> `Tailwind CSS v4`  [EXTRACTED]
  CLAUDE.md → src/input.css
- `EMI Calculator` --uses_lib--> `Chart.js`  [EXTRACTED]
  pages/emi.html → index.html
- `exportCsv()` --calls--> `click()`  [INFERRED]
  scripts/education.js → smoke-test.mjs
- `exportCsv()` --calls--> `click()`  [INFERRED]
  scripts/emi.js → smoke-test.mjs

## Communities

### Community 0 - "Home (index.html)"
Cohesion: 0.08
Nodes (20): Loans & Repayment, Financial Planning, Chart.js, src/input.css, ES Modules, FinCalc Suite, GitHub Pages, Home (index.html) (+12 more)

### Community 1 - "formatINR()"
Cohesion: 0.1
Nodes (11): appendTd(), render(), showStickyBar(), updateDonutChart(), updateDonutChart(), updateDonutChart(), updateDonutChart(), updateDonutChart() (+3 more)

### Community 2 - "finance.js"
Cohesion: 0.12
Nodes (11): buildSchedule(), applySlabs(), baselineSchedule(), calculateEmi(), calculateIncomeTax(), calculateLumpsum(), calculateSIP(), computeNewRegimeTax() (+3 more)

### Community 3 - "ui.js"
Cohesion: 0.19
Nodes (13): buildPrepayInstances(), onCalculate(), onExportCsv(), appendCell(), collectInputs(), exportCsv(), readPrepayConfigs(), renderPrepayVsInvest() (+5 more)

### Community 4 - "education.js"
Cohesion: 0.15
Nodes (9): appendCell(), buildPrepayInstances(), calculateEmi(), exportCsv(), generateEducationLoanSchedule(), renderSchedule(), exportCsv(), click() (+1 more)

### Community 5 - "calcLumpsum()"
Cohesion: 0.38
Nodes (14): calculateCAGR(), equityLTCGTax(), equitySTCGTax(), calcLumpsum(), calcSIP(), getEl(), hideLumpResults(), hideSipResults() (+6 more)

### Community 6 - "Investment & Savings"
Cohesion: 0.18
Nodes (11): Investment & Savings, CAGR Calculator, Fixed Deposit Calculator, Lumpsum Calculator, Mutual Fund Returns, POMIS Calculator, PPF Calculator, RD Calculator (+3 more)

### Community 7 - "util.js"
Cohesion: 0.38
Nodes (3): addMonths(), alignToEmiDay(), daysInMonth()

### Community 8 - "app.js"
Cohesion: 0.67
Nodes (0): 

### Community 9 - "income-tax.js"
Cohesion: 0.67
Nodes (0): 

### Community 10 - "retirement.js"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "robots.txt"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "inverseEmiToPrincipal()"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "updateDonutChart()"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "updateDonutChart()"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "syncSlider()"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "fixer.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "fix_rest.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "fix_retirement.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "refactor_html.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "refactor_js.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "refactor_js_batch2.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "refactor_ui.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "service-worker.js"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "cagr.js"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "gratuity.js"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "pomis.js"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "ssy.js"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **23 isolated node(s):** `Progressive Web App`, `Tailwind CSS v4`, `ES Modules`, `GitHub Pages`, `src/input.css` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `robots.txt`** (2 nodes): `robots.txt`, `sitemap.xml`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `inverseEmiToPrincipal()`** (2 nodes): `inverseEmiToPrincipal()`, `affordability.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `updateDonutChart()`** (2 nodes): `updateDonutChart()`, `balance-transfer.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `updateDonutChart()`** (2 nodes): `updateDonutChart()`, `gst.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `syncSlider()`** (2 nodes): `syncSlider()`, `inflation.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `fixer.mjs`** (1 nodes): `fixer.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `fix_rest.mjs`** (1 nodes): `fix_rest.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `fix_retirement.mjs`** (1 nodes): `fix_retirement.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `refactor_html.mjs`** (1 nodes): `refactor_html.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `refactor_js.mjs`** (1 nodes): `refactor_js.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `refactor_js_batch2.mjs`** (1 nodes): `refactor_js_batch2.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `refactor_ui.mjs`** (1 nodes): `refactor_ui.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `service-worker.js`** (1 nodes): `service-worker.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cagr.js`** (1 nodes): `cagr.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `gratuity.js`** (1 nodes): `gratuity.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `pomis.js`** (1 nodes): `pomis.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ssy.js`** (1 nodes): `ssy.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.