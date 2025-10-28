import { formatINR } from './util.js';
import { calculateEmi } from './finance.js';

function buildSchedule(P, rAnnual, n) {
  const r = (rAnnual/100)/12;
  const emi = calculateEmi(P, rAnnual, n);
  let principal = P;
  let totalInterest = 0;
  const schedule = [];
  for (let i=1;i<=n && principal>0;i++) {
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
    append(tr, row.index, true);
    append(tr, formatINR(row.opening));
    append(tr, formatINR(row.emi));
    append(tr, formatINR(row.interest));
    append(tr, formatINR(row.principal));
    append(tr, formatINR(row.closing));
    fragment.appendChild(tr);
  }
  tbody.appendChild(fragment);
}

function append(tr, text, left) {
  const td = document.createElement('td');
  if (left) td.className = 'left';
  td.textContent = text;
  tr.appendChild(td);
}

function exportCsv(schedule) {
  const header = ['Index','Opening','EMI','Interest','Principal','Closing'];
  const lines = [header.join(',')];
  for (const r of schedule) {
    lines.push([r.index, r.opening.toFixed(2), r.emi.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.closing.toFixed(2)].join(','));
  }
  const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'emi_schedule.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},0);
}

document.getElementById('calcBtn').addEventListener('click', () => {
  const P = Number(document.getElementById('loanAmount').value || '0');
  const r = Number(document.getElementById('annualRate').value || '0');
  const n = Number(document.getElementById('tenureMonths').value || '0');
  if (!(P>0 && r>=0 && Number.isInteger(n) && n>0)) { alert('Please enter valid values.'); return; }
  const { emi, schedule, totalInterest } = buildSchedule(P, r, n);
  document.getElementById('emiOut').textContent = formatINR(emi);
  document.getElementById('totalInterestOut').textContent = formatINR(totalInterest);
  document.getElementById('totalPaymentOut').textContent = formatINR(totalInterest + P);
  render(schedule);
  window.__emiSchedule = schedule;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('loanAmount').value = '';
  document.getElementById('annualRate').value = '';
  document.getElementById('tenureMonths').value = '';
  document.getElementById('emiOut').textContent = '-';
  document.getElementById('totalInterestOut').textContent = '-';
  document.getElementById('totalPaymentOut').textContent = '-';
  document.getElementById('scheduleBody').innerHTML = '';
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  if (!window.__emiSchedule || !window.__emiSchedule.length) { alert('Please calculate first.'); return; }
  exportCsv(window.__emiSchedule);
});


