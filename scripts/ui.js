import { toNumber, formatINR, formatNum, formatDate } from './util.js';
import { buildPrepayInstances } from './finance.js';

export function collectInputs() {
  const P = toNumber(document.getElementById('loanAmount').value);
  const rate = toNumber(document.getElementById('annualRate').value);
  const tenure = toNumber(document.getElementById('tenureMonths').value);
  const startDateInput = document.getElementById('startDate').value;
  const startDate = startDateInput ? new Date(startDateInput) : new Date();
  const emiDay = toNumber(document.getElementById('emiDay').value) || 1;
  const strategy = document.getElementById('strategy').value;
  const recalcOnPrepay = document.getElementById('recalcOnPrepay').value === 'yes';

  const prepayConfigs = readPrepayConfigs();
  const prepayInstances = buildPrepayInstances(prepayConfigs, startDate, emiDay);

  return { P, rate, tenure, startDate, emiDay, strategy, recalcOnPrepay, prepayInstances };
}

export function validateInputs(P, rate, tenure) {
  const errors = [];
  if (!isFinite(P) || P <= 0) errors.push('Enter a valid loan amount');
  if (!isFinite(rate) || rate < 0) errors.push('Enter a valid interest rate');
  if (!Number.isInteger(tenure) || tenure <= 0) errors.push('Enter a valid tenure in months');
  return errors;
}

export function renderSummary(base, strat, tenure, schedLen) {
  document.getElementById('baseEmi').textContent = formatINR(base.emi);
  document.getElementById('baseInterest').textContent = formatINR(base.totalInterest);
  document.getElementById('baseTotal').textContent = formatINR(base.totalInterest + (base.emi * tenure));
  document.getElementById('stratEmi').textContent = formatINR(strat.strategyEmi);
  document.getElementById('stratInterest').textContent = formatINR(strat.totalInterest);
  const interestSaved = Math.max(0, base.totalInterest - strat.totalInterest);
  document.getElementById('interestSaved').textContent = formatINR(interestSaved);
  document.getElementById('baseTenure').textContent = formatNum(tenure) + ' months';
  document.getElementById('newTenure').textContent = formatNum(schedLen) + ' months';
  document.getElementById('monthsSaved').textContent = formatNum(Math.max(0, tenure - schedLen));
}

export function renderSchedule(schedule) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const row of schedule) {
    const tr = document.createElement('tr');
    appendCell(tr, row.index, true);
    appendCell(tr, formatDate(row.date), true);
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
      frequency: el.querySelector('[data-prepay="frequency"]').value,
      startDate: el.querySelector('[data-prepay="start"]').value,
      endDate: el.querySelector('[data-prepay="end"]').value
    };
  });
}

export function addPrepaymentUI(defaults) {
  const container = document.getElementById('prepayList');
  const wrap = document.createElement('div');
  wrap.className = 'prepay-item';
  wrap.innerHTML = `
    <div class="row row-3">
      <div>
        <label>Amount</label>
        <input type="number" inputmode="decimal" min="0" step="1000" data-prepay="amount" placeholder="e.g. 100000">
      </div>
      <div>
        <label>Frequency</label>
        <select data-prepay="frequency">
          <option value="once" selected>One-time</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label>Start Date</label>
        <input type="date" data-prepay="start">
      </div>
    </div>
    <div class="row row-2">
      <div>
        <label>End Date <span class="help">(for recurring)</span></label>
        <input type="date" data-prepay="end">
      </div>
      <div class="actions">
        <button type="button" class="ghost" data-prepay="remove">Remove</button>
      </div>
    </div>
  `;
  if (defaults) {
    wrap.querySelector('[data-prepay="amount"]').value = defaults.amount || '';
    wrap.querySelector('[data-prepay="frequency"]').value = defaults.frequency || 'once';
    wrap.querySelector('[data-prepay="start"]').value = defaults.startDate || '';
    wrap.querySelector('[data-prepay="end"]').value = defaults.endDate || '';
  }
  wrap.querySelector('[data-prepay="remove"]').addEventListener('click', () => { wrap.remove(); });
  container.appendChild(wrap);
}

export function exportCsv(schedule) {
  const header = ['Index','Date','Opening','EMI','Interest','Principal','Prepayment','Closing'];
  const lines = [header.join(',')];
  for (const r of schedule) {
    const row = [
      r.index,
      formatDate(r.date),
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

