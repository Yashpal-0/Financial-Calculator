import { calculateGratuity } from './finance.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('calcBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const salary = Number(document.getElementById('salary').value) || 0;
      const tenure = Number(document.getElementById('tenure').value) || 0;
      
      const { gratuity } = calculateGratuity(salary, tenure);
      document.getElementById('resultOut').textContent = gratuity.toFixed(2);
    });
  }
});