import { formatINR, formatNum, toNumber } from './util.js';

function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const r = (annualRatePercent / 100) / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

function buildPrepayInstances(prepayConfigList) {
  const instances = [];
  for (const cfg of prepayConfigList) {
    const amount = toNumber(cfg.amount);
    if (!amount || amount <= 0) continue;
    const freq = cfg.frequency || 'once';
    if (freq === 'once') {
      instances.push({ monthOffset: 0, amount });
    } else if (freq === 'monthly' || freq === 'yearly') {
      const stepMonths = freq === 'monthly' ? 1 : 12;
      for (let m = 0; m < 1200; m += stepMonths) {
        instances.push({ monthOffset: m, amount });
        if (m > 1000) break;
      }
    }
  }
  instances.sort((a, b) => a.monthOffset - b.monthOffset);
  return instances;
}

function generateEducationLoanSchedule(params) {
  const {
    principal,
    annualRatePercent,
    moratoriumMonths,
    repaymentMonths,
    moratoriumInterest,
    moratoriumPayment,
    prepayments
  } = params;

  const monthlyRate = (annualRatePercent / 100) / 12;
  let currentPrincipal = principal;
  let totalInterest = 0;
  let moratoriumInterestAccrued = 0;
  const schedule = [];
  const prepayQueue = [...prepayments];

  // Moratorium period
  for (let month = 1; month <= moratoriumMonths; month++) {
    const interest = currentPrincipal * monthlyRate;
    let payment = 0;
    let principalPayment = 0;
    let prepaymentApplied = 0;

    // Apply prepayments
    while (prepayQueue.length && prepayQueue[0].monthOffset + 1 === month) {
      const pp = prepayQueue.shift();
      const amount = Math.min(pp.amount, currentPrincipal);
      if (amount > 0) {
        prepaymentApplied += amount;
        currentPrincipal -= amount;
      }
    }

    if (moratoriumInterest === 'pay') {
      payment = Math.min(interest, moratoriumPayment || interest);
      principalPayment = 0;
    } else if (moratoriumInterest === 'partial') {
      payment = Math.min(interest * 0.5, moratoriumPayment || interest * 0.5);
      principalPayment = 0;
    } else {
      // capitalize
      payment = 0;
      principalPayment = 0;
      currentPrincipal += interest;
    }

    totalInterest += interest;
    if (moratoriumInterest === 'capitalize') {
      moratoriumInterestAccrued += interest;
    }

    schedule.push({
      index: month,
      periodLabel: `Moratorium ${month}`,
      opening: currentPrincipal - (moratoriumInterest === 'capitalize' ? interest : 0),
      payment,
      interest,
      principal: principalPayment,
      prepayment: prepaymentApplied,
      closing: currentPrincipal
    });
  }

  // Repayment period
  const emi = calculateEmi(currentPrincipal, annualRatePercent, repaymentMonths);
  let remainingPrincipal = currentPrincipal;
  let remainingMonths = repaymentMonths;

  for (let month = 1; month <= repaymentMonths && remainingPrincipal > 0; month++) {
    const interest = remainingPrincipal * monthlyRate;
    let principalPayment = Math.min(emi - interest, remainingPrincipal);
    if (principalPayment < 0) principalPayment = 0;
    let prepaymentApplied = 0;

    // Apply prepayments
    while (prepayQueue.length && prepayQueue[0].monthOffset + 1 === (moratoriumMonths + month)) {
      const pp = prepayQueue.shift();
      const amount = Math.min(pp.amount, remainingPrincipal - principalPayment);
      if (amount > 0) {
        prepaymentApplied += amount;
        remainingPrincipal -= amount;
      }
    }

    const actualPayment = remainingPrincipal === 0 ? (principalPayment + interest) : emi;
    const opening = remainingPrincipal;
    remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
    totalInterest += interest;

    schedule.push({
      index: moratoriumMonths + month,
      periodLabel: `Repayment ${month}`,
      opening,
      payment: actualPayment,
      interest,
      principal: principalPayment,
      prepayment: prepaymentApplied,
      closing: remainingPrincipal
    });

    if (remainingPrincipal <= 0.01) break;
  }

  return {
    schedule,
    totalInterest,
    moratoriumInterestAccrued,
    emi,
    principalAtStart: principal,
    totalTenure: moratoriumMonths + repaymentMonths
  };
}

function renderSchedule(schedule) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const row of schedule) {
    const tr = document.createElement('tr');
    appendCell(tr, row.index, true);
    appendCell(tr, row.periodLabel, true);
    appendCell(tr, formatINR(row.opening));
    appendCell(tr, formatINR(row.payment));
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

function readPrepayConfigs() {
  const container = document.getElementById('prepayList');
  const items = Array.from(container.querySelectorAll('.prepay-item'));
  return items.map(el => {
    return {
      amount: el.querySelector('[data-prepay="amount"]').value,
      frequency: el.querySelector('[data-prepay="frequency"]').value
    };
  });
}

function addPrepaymentUI(defaults) {
  const container = document.getElementById('prepayList');
  const wrap = document.createElement('div');
  wrap.className = 'prepay-item';
  wrap.innerHTML = `
    <div class="row row-3">
      <div>
        <label>Amount</label>
        <input type="number" inputmode="decimal" min="0" step="1000" data-prepay="amount" placeholder="e.g. 50000">
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

function exportCsv(schedule) {
  const header = ['Index','Period','Opening','Payment','Interest','Principal','Prepayment','Closing'];
  const lines = [header.join(',')];
  for (const r of schedule) {
    const row = [
      r.index,
      r.periodLabel,
      r.opening.toFixed(2),
      r.payment.toFixed(2),
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
  a.download = 'education_loan_schedule.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

// Event listeners
document.getElementById('calcBtn').addEventListener('click', () => {
  const principal = toNumber(document.getElementById('loanAmount').value);
  const rate = toNumber(document.getElementById('annualRate').value);
  const moratoriumMonths = toNumber(document.getElementById('moratoriumMonths').value) || 0;
  const repaymentMonths = toNumber(document.getElementById('repaymentMonths').value);
  const moratoriumInterest = document.getElementById('moratoriumInterest').value;
  const moratoriumPayment = toNumber(document.getElementById('moratoriumPayment').value) || 0;

  if (!(principal > 0 && rate >= 0 && Number.isInteger(repaymentMonths) && repaymentMonths > 0)) {
    alert('Please enter valid values.');
    return;
  }

  const prepayConfigs = readPrepayConfigs();
  const prepayInstances = buildPrepayInstances(prepayConfigs);

  const result = generateEducationLoanSchedule({
    principal,
    annualRatePercent: rate,
    moratoriumMonths,
    repaymentMonths,
    moratoriumInterest,
    moratoriumPayment,
    prepayments: prepayInstances
  });

  document.getElementById('emiOut').textContent = formatINR(result.emi);
  document.getElementById('totalInterestOut').textContent = formatINR(result.totalInterest);
  document.getElementById('totalPaymentOut').textContent = formatINR(result.totalInterest + principal);
  document.getElementById('moratoriumInterestOut').textContent = formatINR(result.moratoriumInterestAccrued);
  document.getElementById('principalAtStartOut').textContent = formatINR(result.principalAtStart);
  document.getElementById('totalTenureOut').textContent = formatNum(result.totalTenure) + ' months';

  renderSchedule(result.schedule);
  window.__educationSchedule = result.schedule;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('loanAmount').value = '';
  document.getElementById('annualRate').value = '';
  document.getElementById('moratoriumMonths').value = '';
  document.getElementById('repaymentMonths').value = '';
  document.getElementById('moratoriumInterest').value = 'capitalize';
  document.getElementById('moratoriumPayment').value = '';
  document.getElementById('prepayList').innerHTML = '';
  
  document.getElementById('emiOut').textContent = '-';
  document.getElementById('totalInterestOut').textContent = '-';
  document.getElementById('totalPaymentOut').textContent = '-';
  document.getElementById('moratoriumInterestOut').textContent = '-';
  document.getElementById('principalAtStartOut').textContent = '-';
  document.getElementById('totalTenureOut').textContent = '-';
  document.getElementById('scheduleBody').innerHTML = '';
});

document.getElementById('addPrepayBtn').addEventListener('click', () => addPrepaymentUI());
document.getElementById('clearPrepayBtn').addEventListener('click', () => { document.getElementById('prepayList').innerHTML = ''; });

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  if (!window.__educationSchedule || !window.__educationSchedule.length) {
    alert('Please calculate first.');
    return;
  }
  exportCsv(window.__educationSchedule);
});

document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

// Moratorium interest option handler
document.getElementById('moratoriumInterest').addEventListener('change', (e) => {
  const paymentField = document.getElementById('moratoriumPayment');
  if (e.target.value === 'pay' || e.target.value === 'partial') {
    paymentField.disabled = false;
    paymentField.placeholder = 'e.g. 5000';
  } else {
    paymentField.disabled = true;
    paymentField.value = '';
    paymentField.placeholder = 'Not applicable';
  }
});

// Defaults
document.getElementById('loanAmount').value = '1000000';
document.getElementById('annualRate').value = '8.5';
document.getElementById('moratoriumMonths').value = '24';
document.getElementById('repaymentMonths').value = '120';
