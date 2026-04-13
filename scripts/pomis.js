import { calculatePOMIS } from './finance.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('calcBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const deposit = Number(document.getElementById('deposit').value) || 0;
      const rate = Number(document.getElementById('rate').value) || 7.4;
      
      const { monthlyIncome } = calculatePOMIS(deposit, rate);
      document.getElementById('resultOut').textContent = monthlyIncome.toFixed(2);
    });
  }
});

