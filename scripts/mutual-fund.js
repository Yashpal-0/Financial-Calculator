/**
 * Mutual Fund Returns calculator: SIP + Lumpsum with CAGR and tax (LTCG/STCG).
 * WHY: Single unified calculator for MF-style returns with Indian tax estimates.
 */
import { formatINR, formatNum } from './util.js';
import { calculateSIP, calculateLumpsum, calculateCAGR, equityLTCGTax, equitySTCGTax } from './finance.js';

function getEl(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text;
}

function showSection(id, show) {
  const el = getEl(id);
  if (!el) return;
  if (show) {
    el.classList.remove('hidden');
    el.style.display = '';
  } else {
    el.classList.add('hidden');
    el.style.display = 'none';
  }
}

function onCalculate() {
  const mode = getEl('mfCalcMode')?.value || 'both';
  const holdingYears = parseFloat(getEl('mfHoldingYears')?.value || '') || null;

  hideSipResults();
  hideLumpResults();

  let totalInvested = 0;
  let totalFV = 0;
  let hasValidInput = false;

  if (mode === 'sip' || mode === 'both') {
    const sipRes = calcSIP(holdingYears);
    if (sipRes) {
      totalInvested += sipRes.invested;
      totalFV += sipRes.fv;
      hasValidInput = true;
    }
  } else {
    hideSipResults();
  }

  if (mode === 'lumpsum' || mode === 'both') {
    const lumpRes = calcLumpsum(holdingYears);
    if (lumpRes) {
      totalInvested += lumpRes.invested;
      totalFV += lumpRes.fv;
      hasValidInput = true;
    }
  } else {
    hideLumpResults();
  }

  if (hasValidInput) {
    const resultsSec = document.getElementById('resultsSection');
    if (resultsSec) resultsSec.classList.remove('hidden');
    updateDonutChart('Invested Amount', totalInvested, 'Estimated Returns', totalFV - totalInvested);
  }
}

function calcSIP(holdingYearsOverride) {
  const monthly = Number(getEl('mfMonthly')?.value || '0');
  const rate = Number(getEl('mfRate')?.value || '0');
  const years = Number(getEl('mfYears')?.value || '0');

  if (!(monthly > 0 && rate >= 0 && years > 0)) {
    hideSipResults();
    return null;
  }

  const months = years * 12;
  const fv = calculateSIP(monthly, rate, months);
  const invested = monthly * months;
  const gains = fv - invested;
  const holdingYears = holdingYearsOverride ?? years;
  const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
  const postTax = fv - tax;

      const cagrPct = invested > 0 && years > 0
        ? calculateCAGR(invested, fv, years) * 100
        : 0;

      setText('mfSipInvested', formatINR(invested));
      setText('mfSipFV', formatINR(fv));
      setText('mfSipGains', formatINR(gains));
      setText('mfSipCAGR', formatNum(cagrPct, 2) + '%');
  setText('mfSipTax', formatINR(tax));
  setText('mfSipPostTax', formatINR(postTax));
  showSection('mfSipSection', true);

  return { invested, fv };
}

function hideSipResults() {
  ['mfSipInvested', 'mfSipFV', 'mfSipGains', 'mfSipCAGR', 'mfSipTax', 'mfSipPostTax'].forEach(id => setText(id, '-'));
  showSection('mfSipSection', false);
}

function calcLumpsum(holdingYearsOverride) {
  const lumpsum = Number(getEl('mfLumpsum')?.value || '0');
  const rate = Number(getEl('mfLumpRate')?.value || '0');
  const years = Number(getEl('mfLumpYears')?.value || '0');

  if (!(lumpsum > 0 && rate >= 0 && years > 0)) {
    hideLumpResults();
    return null;
  }

  const fv = calculateLumpsum(lumpsum, rate, years, 1);
  const gains = fv - lumpsum;
  const holdingYears = holdingYearsOverride ?? years;
  const cagr = (years > 0 && lumpsum > 0) ? calculateCAGR(lumpsum, fv, years) * 100 : 0;
  const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
  const postTax = fv - tax;

  setText('mfLumpInvested', formatINR(lumpsum));
  setText('mfLumpFV', formatINR(fv));
  setText('mfLumpGains', formatINR(gains));
  setText('mfLumpCAGR', formatNum(cagr, 2) + '%');
  setText('mfLumpTax', formatINR(tax));
  setText('mfLumpPostTax', formatINR(postTax));
  showSection('mfLumpSection', true);

  return { invested: lumpsum, fv };
}

function hideLumpResults() {
  ['mfLumpInvested', 'mfLumpFV', 'mfLumpGains', 'mfLumpCAGR', 'mfLumpTax', 'mfLumpPostTax'].forEach(id => setText(id, '-'));
  showSection('mfLumpSection', false);
}

function onReset() {
  if (getEl('mfMonthly')) getEl('mfMonthly').value = '';
  if (getEl('mfRate')) getEl('mfRate').value = '';
  if (getEl('mfYears')) getEl('mfYears').value = '';
  if (getEl('mfLumpsum')) getEl('mfLumpsum').value = '';
  if (getEl('mfLumpRate')) getEl('mfLumpRate').value = '';
  if (getEl('mfLumpYears')) getEl('mfLumpYears').value = '';
  if (getEl('mfHoldingYears')) getEl('mfHoldingYears').value = '';
  if (getEl('mfCalcMode')) getEl('mfCalcMode').value = 'both';
  hideSipResults();
  hideLumpResults();
  
  const resultsSec = document.getElementById('resultsSection');
  if (resultsSec) resultsSec.classList.add('hidden');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

getEl('mfCalcBtn')?.addEventListener('click', onCalculate);
getEl('mfResetBtn')?.addEventListener('click', onReset);


let chartInstance = null;
function updateDonutChart(label1, val1, label2, val2) {
    if (typeof Chart === 'undefined') return;
    const isDark = document.documentElement.dataset.theme === 'dark';
    const canvas = document.getElementById('donutChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = {
        labels: [label1, label2],
        datasets: [{
            data: [val1, val2],
            backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
            hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
        }]
    };
    const opts = {
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.label}: ${formatINR(ctx.raw)}`
                }
            }
        },
        animation: { animateRotate: true, duration: 600 },
        maintainAspectRatio: false
    };

    if (chartInstance) {
        chartInstance.options.plugins.tooltip = opts.plugins.tooltip;
        chartInstance.data = data;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, { type: 'doughnut', data, options: opts });
    }

    const legendEl = document.getElementById('chartLegend');
    legendEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(13,148,136,0.85)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label1}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(val1)}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(val2)}</span>
    </div>
  `;
}