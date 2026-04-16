import { formatINR } from './util.js';
import { calculateEmi } from './finance.js';

/** Build amortization schedule */
function buildSchedule(P, rAnnual, n) {
  const r = (rAnnual / 100) / 12;
  const emi = calculateEmi(P, rAnnual, n);
  let principal = P;
  let totalInterest = 0;
  const schedule = [];
  for (let i = 1; i <= n && principal > 0; i++) {
    const interest = principal * r;
    let principalPay = Math.min(emi - interest, principal);
    if (principalPay < 0) principalPay = 0;
    const opening = principal;
    principal = Math.max(0, principal - principalPay);
    totalInterest += interest;
    schedule.push({ index: i, opening, emi, interest, principal: principalPay, closing: principal });
  }
  return { emi, schedule, totalInterest };
}

function render(schedule) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const row of schedule) {
    const tr = document.createElement('tr');
    appendTd(tr, `Month ${row.index}`, true);
    appendTd(tr, formatINR(row.opening));
    appendTd(tr, formatINR(row.emi));
    appendTd(tr, formatINR(row.interest));
    appendTd(tr, formatINR(row.principal));
    appendTd(tr, formatINR(row.closing));
    fragment.appendChild(tr);
  }
  tbody.appendChild(fragment);
}

function appendTd(tr, text, left) {
  const td = document.createElement('td');
  if (left) td.className = 'text-left font-medium';
  td.textContent = text;
  tr.appendChild(td);
}

function exportCsv(schedule) {
  const header = ['Month', 'Opening Balance', 'EMI', 'Interest', 'Principal', 'Closing Balance'];
  const lines = [header.join(',')];
  for (const r of schedule) {
    lines.push([r.index, r.opening.toFixed(2), r.emi.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.closing.toFixed(2)].join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'emi_schedule.csv';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

/** Slider ↔ Input sync */
function syncSlider(inputId, sliderId, displayId, formatter) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  if (!input || !slider || !display) return;

  function update(val) {
    display.textContent = formatter(val);
    const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
    // We can use a custom property for Tailwind if needed, but inline style works fine for gradient
    const thumbColor = '#0d9488'; // teal-600
    const trackColor = document.documentElement.dataset.theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
    slider.style.background = `linear-gradient(to right, ${thumbColor} ${pct}%, ${trackColor} ${pct}%)`;
  }
  input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
  slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
  update(slider.value);
  
  // Also observe theme changes to update track color
  const observer = new MutationObserver(() => update(slider.value));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/** Chart.js donut chart */
let emiChart = null;
function updateDonutChart(principal, totalInterest) {
  if (typeof Chart === 'undefined') return;
  const isDark = document.documentElement.dataset.theme === 'dark';
  const canvas = document.getElementById('emiDonutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = {
    labels: ['Principal', 'Total Interest'],
    datasets: [{
      data: [principal, totalInterest],
      backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
      hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
      borderColor: isDark ? '#0f172a' : '#ffffff', // slate-900 / white
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

  if (emiChart) {
    emiChart.options.plugins.tooltip = opts.plugins.tooltip;
    emiChart.data = data;
    emiChart.update();
  } else {
    emiChart = new Chart(ctx, { type: 'doughnut', data, options: opts });
  }

  // Update legend
  const legendEl = document.getElementById('chartLegend');
  legendEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(13,148,136,0.85)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">Principal</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(principal)}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">Total Interest</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(totalInterest)}</span>
    </div>
    <div class="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <span class="font-bold text-slate-900 dark:text-white">Interest Ratio</span>
      <span class="font-bold text-teal-600 dark:text-teal-400">${((totalInterest / (principal + totalInterest)) * 100).toFixed(1)}%</span>
    </div>
  `;
}

/** Sticky bar logic */
let stickyHidden = false;
document.getElementById('stickyDismiss')?.addEventListener('click', () => {
  const bar = document.getElementById('stickyResult');
  bar.classList.remove('translate-y-0');
  bar.classList.add('translate-y-full');
  stickyHidden = true;
});

function showStickyBar(emi, interest) {
  if (stickyHidden) return;
  const bar = document.getElementById('stickyResult');
  document.getElementById('stickyEmi').textContent = formatINR(emi);
  document.getElementById('stickyInterest').textContent = formatINR(interest);
  bar.classList.remove('translate-y-full');
  bar.classList.add('translate-y-0');
}

function hideStickyBar() {
  const bar = document.getElementById('stickyResult');
  if(bar) {
    bar.classList.remove('translate-y-0');
    bar.classList.add('translate-y-full');
  }
}

// Intersection observer to show sticky bar when results are offscreen
const summaryObs = new IntersectionObserver(([entry]) => {
  const bar = document.getElementById('stickyResult');
  if (!bar) return;
  if (!stickyHidden && !entry.isIntersecting && window.__emiResult) {
    bar.classList.remove('translate-y-full');
    bar.classList.add('translate-y-0');
  } else {
    bar.classList.remove('translate-y-0');
    bar.classList.add('translate-y-full');
  }
}, { threshold: 0 });
const summaryEl = document.getElementById('emiOut'); // We can observe the KPI number

// Wire up
syncSlider('loanAmount', 'loanAmountSlider', 'loanAmountVal', v => {
  const lakh = v / 100000;
  return lakh >= 100 ? `₹${(v / 10000000).toFixed(1)}Cr` : `₹${lakh.toFixed(0)}L`;
});
syncSlider('annualRate', 'annualRateSlider', 'annualRateVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('tenureMonths', 'tenureMonthsSlider', 'tenureMonthsVal', v => `${v} mo`);

document.getElementById('calcBtn').addEventListener('click', () => {
  const P = Number(document.getElementById('loanAmount').value || '0');
  const r = Number(document.getElementById('annualRate').value || '0');
  const n = Number(document.getElementById('tenureMonths').value || '0');
  if (!(P > 0 && r >= 0 && Number.isInteger(n) && n > 0)) {
    alert('Please enter valid values.'); return;
  }
  const { emi, schedule, totalInterest } = buildSchedule(P, r, n);
  document.getElementById('emiOut').textContent = formatINR(emi);
  document.getElementById('totalInterestOut').textContent = formatINR(totalInterest);
  document.getElementById('totalPaymentOut').textContent = formatINR(totalInterest + P);
  render(schedule);
  window.__emiSchedule = schedule;
  window.__emiResult = { emi, totalInterest };

  // Show results
  document.getElementById('resultsSection').classList.remove('hidden');
  updateDonutChart(P, totalInterest);
  showStickyBar(emi, totalInterest);
  stickyHidden = false;
  
  if (summaryEl) {
    summaryObs.observe(summaryEl);
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  ['loanAmount', 'annualRate', 'tenureMonths'].forEach(id => document.getElementById(id).value = '');
  
  // Re-sync sliders
  const loanInput = document.getElementById('loanAmount');
  if(loanInput) loanInput.dispatchEvent(new Event('input'));
  const rateInput = document.getElementById('annualRate');
  if(rateInput) rateInput.dispatchEvent(new Event('input'));
  const tenureInput = document.getElementById('tenureMonths');
  if(tenureInput) tenureInput.dispatchEvent(new Event('input'));

  document.getElementById('emiOut').textContent = '–';
  document.getElementById('totalInterestOut').textContent = '–';
  document.getElementById('totalPaymentOut').textContent = '–';
  document.getElementById('scheduleBody').innerHTML = '';
  document.getElementById('resultsSection').classList.add('hidden');
  
  hideStickyBar();
  stickyHidden = false;
  if(summaryEl) summaryObs.unobserve(summaryEl);

  window.__emiSchedule = null;
  window.__emiResult = null;
  if (emiChart) { emiChart.destroy(); emiChart = null; }
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  if (!window.__emiSchedule?.length) { alert('Please calculate first.'); return; }
  exportCsv(window.__emiSchedule);
});