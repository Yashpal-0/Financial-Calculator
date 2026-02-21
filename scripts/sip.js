import { formatINR } from './util.js';
import { calculateSIP } from './finance.js';

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const P = Number(document.getElementById('monthlyInv').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const years = Number(document.getElementById('tenureYears').value || '0');

    if (!(P > 0 && r >= 0 && Number.isInteger(years) && years > 0)) {
        alert('Please enter valid monthly investment, rate, and total years.');
        return;
    }

    const months = years * 12;
    const fv = calculateSIP(P, r, months);
    const invested = P * months;
    const gained = fv - invested;

    document.getElementById('totalInvestedOut').textContent = formatINR(invested);
    document.getElementById('wealthGainedOut').textContent = formatINR(gained);
    document.getElementById('futureValueOut').textContent = formatINR(fv);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.getElementById('monthlyInv').value = '';
    document.getElementById('annualRate').value = '';
    document.getElementById('tenureYears').value = '';
    document.getElementById('totalInvestedOut').textContent = '-';
    document.getElementById('wealthGainedOut').textContent = '-';
    document.getElementById('futureValueOut').textContent = '-';
});
