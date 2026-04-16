import { calculateCAGR } from './finance.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('calcBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const startValue = Number(document.getElementById('startValue').value) || 0;
      const endValue = Number(document.getElementById('endValue').value) || 0;
      const years = Number(document.getElementById('years').value) || 0;
      
      const cagr = calculateCAGR(startValue, endValue, years);
      document.getElementById('resultOut').textContent = (cagr * 100).toFixed(2) + '%';
      document.getElementById('resultsSection')?.classList.remove('hidden');
    });
  }
});

