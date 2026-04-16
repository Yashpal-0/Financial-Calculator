import { calculateSSY } from './finance.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('calcBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const deposit = Number(document.getElementById('deposit').value) || 0;
      const tenure = Number(document.getElementById('tenure').value) || 15;
      const rate = Number(document.getElementById('rate').value) || 8.2;
      
      const maturity = calculateSSY(deposit, tenure, rate);
      document.getElementById('resultOut').textContent = maturity.toFixed(2);
      document.getElementById('resultsSection')?.classList.remove('hidden');
    });
  }
});

