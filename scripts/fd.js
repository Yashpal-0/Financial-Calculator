import { formatINR } from './util.js';
import { calculateFD } from './finance.js';

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const P = Number(document.getElementById('fdAmount').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const months = Number(document.getElementById('tenureMonths').value || '0');
    const freq = document.getElementById('compoundFreq').value;

    if (!(P > 0 && r >= 0 && Number.isInteger(months) && months > 0)) {
        alert('Please enter valid deposit amount, rate, and tenure in months.');
        return;
    }

    const maturity = calculateFD(P, r, months, freq);
    const interest = maturity - P;

    document.getElementById('principalOut').textContent = formatINR(P);
    document.getElementById('interestOut').textContent = formatINR(interest);
    document.getElementById('maturityOut').textContent = formatINR(maturity);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.getElementById('fdAmount').value = '';
    document.getElementById('annualRate').value = '';
    document.getElementById('tenureMonths').value = '';
    document.getElementById('principalOut').textContent = '-';
    document.getElementById('interestOut').textContent = '-';
    document.getElementById('maturityOut').textContent = '-';
});
