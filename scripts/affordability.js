import { formatINR } from './util.js';
import { calculateEmi } from './finance.js';

function inverseEmiToPrincipal(targetEmi, annualRate, tenureMonths) {
  const r = (annualRate/100)/12;
  if (r === 0) return targetEmi * tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return targetEmi * (factor - 1) / (r * factor);
}

document.getElementById('calcBtn').addEventListener('click', () => {
  const netIncome = Number(document.getElementById('netIncome').value || '0');
  const otherEmi = Number(document.getElementById('otherEmi').value || '0');
  const foir = Number(document.getElementById('foir').value || '40');
  const rate = Number(document.getElementById('annualRate').value || '8.5');
  const tenure = Number(document.getElementById('tenureMonths').value || '240');
  const down = Number(document.getElementById('downPayment').value || '0');

  if (!(netIncome>0 && rate>=0 && Number.isInteger(tenure) && tenure>0)) { alert('Please enter valid values.'); return; }

  const maxEmi = Math.max(0, (netIncome * (foir/100)) - otherEmi);
  const eligibleLoan = inverseEmiToPrincipal(maxEmi, rate, tenure);
  const propertyBudget = eligibleLoan + down;

  document.getElementById('maxEmi').textContent = formatINR(maxEmi);
  document.getElementById('eligibleLoan').textContent = formatINR(eligibleLoan);
  document.getElementById('propertyBudget').textContent = formatINR(propertyBudget);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('netIncome').value = '';
  document.getElementById('otherEmi').value = '';
  document.getElementById('foir').value = '40';
  document.getElementById('annualRate').value = '8.5';
  document.getElementById('tenureMonths').value = '240';
  document.getElementById('downPayment').value = '';
  document.getElementById('maxEmi').textContent = '-';
  document.getElementById('eligibleLoan').textContent = '-';
  document.getElementById('propertyBudget').textContent = '-';
});


