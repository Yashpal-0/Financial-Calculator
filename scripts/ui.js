import { toNumber, formatINR, formatNum } from './util.js';
import { buildPrepayInstances } from './finance.js';

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
                    label: ctx => ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
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
      <span class="font-semibold text-slate-900 dark:text-white">₹${Number(val1).toLocaleString('en-IN')}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">₹${Number(val2).toLocaleString('en-IN')}</span>
    </div>
  `;
}


export function collectInputs() {
  const P = toNumber(document.getElementById('loanAmount').value);
  const rate = toNumber(document.getElementById('annualRate').value);
  const tenure = toNumber(document.getElementById('tenureMonths').value);
  const startDate = null;
  const emiDay = 1;
  const strategy = document.getElementById('strategy').value;

  const prepayConfigs = readPrepayConfigs();
  const prepayInstances = buildPrepayInstances(prepayConfigs);

  return { P, rate, tenure, startDate, emiDay, strategy, prepayInstances };
}

export function validateInputs(P, rate, tenure) {
  const errors = [];
  if (!isFinite(P) || P <= 0) errors.push('Enter a valid loan amount');
  if (!isFinite(rate) || rate < 0) errors.push('Enter a valid interest rate');
  if (!Number.isInteger(tenure) || tenure <= 0) errors.push('Enter a valid tenure in months');
  return errors;
}

/**
 * Renders prepayment summary KPIs. Uses optional elements to support different page layouts.
 * @param {number} principal - Original loan amount (for total-paid calc)
 * @param {object} base - { emi, totalInterest } from baseline schedule
 * @param {object} strat - { totalInterest, strategyEmi } from prepayment schedule
 * @param {number} tenure - Original tenure in months
 * @param {number} schedLen - New tenure (months) after prepayments
 */
export function renderSummary(principal, base, strat, tenure, schedLen) {
  const totalPaidBase = base.emi * tenure;
  const totalPaidStrat = principal + strat.totalInterest;
  const interestSaved = Math.max(0, base.totalInterest - strat.totalInterest);
  const monthsSaved = Math.max(0, tenure - schedLen);

  setEl('baseEmi', formatINR(base.emi));
  setEl('baseTotal', formatINR(totalPaidBase));
  setEl('stratEmi', formatINR(strat.strategyEmi));
  setEl('stratInterest', formatINR(totalPaidStrat));
  setEl('interestSaved', formatINR(interestSaved));
  setEl('monthsSaved', formatNum(monthsSaved));
  setEl('baseInterest', formatINR(base.totalInterest));
  setEl('baseTenure', formatNum(tenure) + ' months');
  setEl('newTenure', formatNum(schedLen) + ' months');
  document.getElementById('resultsSection').classList.remove('hidden');
  updateDonutChart('Interest Paid', strat.totalInterest, 'Interest Saved', interestSaved);
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Renders Prepay vs Invest comparison: total prepaid, interest saved, and
 * projected MF growth for the same amount at user-specified return.
 */
export function renderPrepayVsInvest(schedule, interestSaved, loanRatePercent, monthsSaved) {
  const prepayRows = schedule.filter(r => (r.prepayment || 0) > 0);
  const totalPrepaid = prepayRows.reduce((sum, r) => sum + (r.prepayment || 0), 0);
  const mfRateEl = document.getElementById('prepayVsInvestRate');
  const mfRate = mfRateEl ? parseFloat(mfRateEl.value) || 12 : 12;
  const monthlyRate = mfRate / 100 / 12;
  const lastMonth = schedule.length;

  const mfFV = totalPrepaid > 0
    ? prepayRows.reduce((sum, row) => {
        const monthsToGrow = Math.max(0, lastMonth - row.index + 1);
        return sum + row.prepayment * Math.pow(1 + monthlyRate, monthsToGrow);
      }, 0)
    : 0;

  setEl('prepayTotalPrepaid', formatINR(totalPrepaid));
  setEl('prepayInterestSaved', formatINR(interestSaved));
  setEl('prepayMfProjected', totalPrepaid > 0 ? formatINR(mfFV) : '-');
  setEl('prepayVsInvestNote',
    totalPrepaid > 0
      ? `Prepaying saves guaranteed interest (≈${loanRatePercent}% effective). MF at ${mfRate}% has market risk.`
      : 'Add prepayments and calculate to compare.');
}

export function renderSchedule(schedule) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const row of schedule) {
    const tr = document.createElement('tr');
    appendCell(tr, row.index, true);
    appendCell(tr, row.monthLabel || `Month ${row.index}`, true);
    appendCell(tr, formatINR(row.opening));
    appendCell(tr, formatINR(row.emi));
    appendCell(tr, formatINR(row.interest));
    appendCell(tr, formatINR(row.principal));
    appendCell(tr, row.prepayment ? formatINR(row.prepayment) : '-');
    appendCell(tr, formatINR(row.closing));
    fragment.appendChild(tr);
  }
  tbody.appendChild(fragment);
}

function appendCell(tr, text, left) {
  const td = document.createElement('td');
  if (left) td.className = 'left';
  td.textContent = text;
  tr.appendChild(td);
}

export function readPrepayConfigs() {
  const container = document.getElementById('prepayList');
  const items = Array.from(container.querySelectorAll('.prepay-item'));
  return items.map(el => {
    return {
      amount: el.querySelector('[data-prepay="amount"]').value,
      frequency: el.querySelector('[data-prepay="frequency"]').value
    };
  });
}

export function addPrepaymentUI(defaults) {
  const container = document.getElementById('prepayList');
  const wrap = document.createElement('div');
  wrap.className = 'prepay-item mb-4 card p-4';
  wrap.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="label-text">Amount</label>
        <input type="number" class="input-field" inputmode="decimal" min="0" step="1000" data-prepay="amount" placeholder="e.g. 100000">
      </div>
      <div>
        <label class="label-text">Frequency</label>
        <select class="input-field" data-prepay="frequency">
          <option value="once" selected>One-time</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
    </div>
    <div class="flex justify-end">
      <button type="button" class="btn-secondary text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm py-1.5 px-3" data-prepay="remove">Remove</button>
    </div>
  `;
  if (defaults) {
    wrap.querySelector('[data-prepay="amount"]').value = defaults.amount || '';
    wrap.querySelector('[data-prepay="frequency"]').value = defaults.frequency || 'once';
  }
  wrap.querySelector('[data-prepay="remove"]').addEventListener('click', () => { wrap.remove(); });
  container.appendChild(wrap);
}

export function exportCsv(schedule) {
  const header = ['Index','Month','Opening','EMI','Interest','Principal','Prepayment','Closing'];
  const lines = [header.join(',')];
  for (const r of schedule) {
    const row = [
      r.index,
      (r.monthLabel || `Month ${r.index}`),
      r.opening.toFixed(2),
      r.emi.toFixed(2),
      r.interest.toFixed(2),
      r.principal.toFixed(2),
      (r.prepayment||0).toFixed(2),
      r.closing.toFixed(2)
    ];
    lines.push(row.join(','));
  }
  const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amortization_schedule.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

