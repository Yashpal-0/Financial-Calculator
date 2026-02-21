import { toNumber, formatINR, formatNum } from './util.js';
import { buildPrepayInstances, calculateLumpsum } from './finance.js';

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
  const totalPrepaid = schedule.reduce((sum, r) => sum + (r.prepayment || 0), 0);
  const mfRateEl = document.getElementById('prepayVsInvestRate');
  const mfRate = mfRateEl ? parseFloat(mfRateEl.value) || 12 : 12;
  const yearsSaved = monthsSaved / 12;
  const mfFV = totalPrepaid > 0 && yearsSaved > 0
    ? calculateLumpsum(totalPrepaid, mfRate, yearsSaved, 1)
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
    </div>
    <div class="row row-2">
      <div class="actions">
        <button type="button" class="ghost" data-prepay="remove">Remove</button>
      </div>
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

