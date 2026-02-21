import { formatINR } from './util.js';
import { calculateRD } from './finance.js';

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const P = Number(document.getElementById('monthlyDeposit').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const months = Number(document.getElementById('tenureMonths').value || '0');

    if (!(P > 0 && r >= 0 && Number.isInteger(months) && months > 0)) {
        alert('Please enter valid monthly deposit, rate, and tenure in months.');
        return;
    }

    const maturity = calculateRD(P, r, months);
    const invested = P * months;
    const interest = maturity - invested;

    document.getElementById('principalOut').textContent = formatINR(invested);
    document.getElementById('interestOut').textContent = formatINR(interest);
    document.getElementById('maturityOut').textContent = formatINR(maturity);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.getElementById('monthlyDeposit').value = '';
    document.getElementById('annualRate').value = '';
    document.getElementById('tenureMonths').value = '';
    document.getElementById('principalOut').textContent = '-';
    document.getElementById('interestOut').textContent = '-';
    document.getElementById('maturityOut').textContent = '-';
});
