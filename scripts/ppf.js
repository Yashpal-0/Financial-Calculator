import { formatINR } from './util.js';
import { calculatePPF } from './finance.js';

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const P = Number(document.getElementById('yearlyInv').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const years = Number(document.getElementById('tenureYears').value || '0');

    if (!(P > 0 && P <= 150000 && r >= 0 && Number.isInteger(years) && years >= 15)) {
        alert('Please enter a valid investment (max 1.5L), rate, and tenure (min 15 yrs).');
        return;
    }

    const fv = calculatePPF(P, r, years);
    const invested = P * years;
    const gained = fv - invested;

    document.getElementById('totalInvestedOut').textContent = formatINR(invested);
    document.getElementById('wealthGainedOut').textContent = formatINR(gained);
    document.getElementById('futureValueOut').textContent = formatINR(fv);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.getElementById('yearlyInv').value = '';
    document.getElementById('annualRate').value = '7.1';
    document.getElementById('tenureYears').value = '15';
    document.getElementById('totalInvestedOut').textContent = '-';
    document.getElementById('wealthGainedOut').textContent = '-';
    document.getElementById('futureValueOut').textContent = '-';
});
