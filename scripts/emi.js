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
  if (left) td.className = 'left';
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
    // gradient fill
    const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--slider-thumb) ${pct}%, var(--slider-track) ${pct}%)`;
  }
  input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
  slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
  update(slider.value);
}

/** Chart.js donut chart */
let emiChart = null;
function updateDonutChart(principal, totalInterest) {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const ctx = document.getElementById('emiDonutChart').getContext('2d');
  const data = {
    labels: ['Principal', 'Total Interest'],
    datasets: [{
      data: [principal, totalInterest],
      backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
      hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
      borderColor: isDark ? '#1c1917' : '#fff',
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
    animation: { animateRotate: true, duration: 600 }
  };

  if (emiChart) {
    emiChart.data = data;
    emiChart.update();
  } else {
    emiChart = new Chart(ctx, { type: 'doughnut', data, options: opts });
  }

  // Update legend
  const legendEl = document.getElementById('chartLegend');
  legendEl.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot" style="background:rgba(13,148,136,0.85)"></div>
      <span class="legend-label">Principal</span>
      <span class="legend-value">${formatINR(principal)}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:rgba(8,145,178,0.75)"></div>
      <span class="legend-label">Total Interest</span>
      <span class="legend-value">${formatINR(totalInterest)}</span>
    </div>
    <div class="legend-item" style="margin-top:4px;border-top:1px solid var(--border);padding-top:12px;">
      <span class="legend-label" style="font-weight:700;color:var(--text);">Interest Ratio</span>
      <span class="legend-value">${((totalInterest / (principal + totalInterest)) * 100).toFixed(1)}%</span>
    </div>
  `;
}

/** Sticky bar logic */
let stickyHidden = false;
document.getElementById('stickyDismiss')?.addEventListener('click', () => {
  document.getElementById('stickyResult').classList.remove('visible');
  stickyHidden = true;
});

function showStickyBar(emi, interest) {
  if (stickyHidden) return;
  const bar = document.getElementById('stickyResult');
  document.getElementById('stickyEmi').textContent = formatINR(emi);
  document.getElementById('stickyInterest').textContent = formatINR(interest);
  bar.classList.add('visible');
}

// Intersection observer to show sticky bar when results are offscreen
const summaryObs = new IntersectionObserver(([entry]) => {
  const bar = document.getElementById('stickyResult');
  if (!stickyHidden && !entry.isIntersecting && window.__emiResult) {
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
  }
}, { threshold: 0 });
const summaryEl = document.getElementById('summary');
if (summaryEl) summaryObs.observe(summaryEl);

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

  // Show chart
  document.getElementById('chartSection').style.display = '';
  updateDonutChart(P, totalInterest);
  showStickyBar(emi, totalInterest);
  stickyHidden = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  ['loanAmount', 'annualRate', 'tenureMonths'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('emiOut').textContent = '–';
  document.getElementById('totalInterestOut').textContent = '–';
  document.getElementById('totalPaymentOut').textContent = '–';
  document.getElementById('scheduleBody').innerHTML = '';
  document.getElementById('chartSection').style.display = 'none';
  document.getElementById('stickyResult').classList.remove('visible');
  window.__emiSchedule = null;
  window.__emiResult = null;
  if (emiChart) { emiChart.destroy(); emiChart = null; }
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  if (!window.__emiSchedule?.length) { alert('Please calculate first.'); return; }
  exportCsv(window.__emiSchedule);
});
