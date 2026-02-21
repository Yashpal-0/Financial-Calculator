import { formatINR } from './util.js';
import { calculateLumpsum } from './finance.js';

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const P = Number(document.getElementById('lumpsumInv').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const years = Number(document.getElementById('tenureYears').value || '0');

    if (!(P > 0 && r >= 0 && Number.isInteger(years) && years > 0)) {
        alert('Please enter valid investment amount, rate, and total years.');
        return;
    }

    // Standard mutual fund lumpsum gets compounded annually
    const fv = calculateLumpsum(P, r, years, 1);
    const invested = P;
    const gained = fv - invested;

    document.getElementById('totalInvestedOut').textContent = formatINR(invested);
    document.getElementById('wealthGainedOut').textContent = formatINR(gained);
    document.getElementById('futureValueOut').textContent = formatINR(fv);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.getElementById('lumpsumInv').value = '';
    document.getElementById('annualRate').value = '';
    document.getElementById('tenureYears').value = '';
    document.getElementById('totalInvestedOut').textContent = '-';
    document.getElementById('wealthGainedOut').textContent = '-';
    document.getElementById('futureValueOut').textContent = '-';
});
