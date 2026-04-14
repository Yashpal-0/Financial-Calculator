import { calculateGST } from './finance.js';

let chartInstance = null;
function updateDonutChart(label1, val1, label2, val2) {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const ctx = document.getElementById('donutChart').getContext('2d');
    const data = {
        labels: [label1, label2],
        datasets: [{
            data: [val1, val2],
            backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
            hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
        }]
    };
    const opts = {
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
                }
            }
        },
        animation: { animateRotate: true, duration: 600 },
        maintainAspectRatio: false
    };

    if (chartInstance) {
        chartInstance.options.plugins.tooltip = opts.plugins.tooltip;
        chartInstance.data = data;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, { type: 'doughnut', data, options: opts });
    }

    const legendEl = document.getElementById('chartLegend');
    legendEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(13,148,136,0.85)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label1}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">₹${Number(val1).toLocaleString('en-IN')}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">₹${Number(val2).toLocaleString('en-IN')}</span>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('calcBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const amount = Number(document.getElementById('amount').value) || 0;
      const rate = Number(document.getElementById('rate').value) || 0;
      const type = document.getElementById('type').value || 'exclusive';
      
      const { netAmount, gstAmount, totalAmount } = calculateGST(amount, rate, type);
      document.getElementById('netOut').textContent = '₹' + netAmount.toFixed(2);
      document.getElementById('gstOut').textContent = '₹' + gstAmount.toFixed(2);
      document.getElementById('totalOut').textContent = '₹' + totalAmount.toFixed(2);
      document.getElementById('resultsSection').classList.remove('hidden');
      updateDonutChart('Base Amount', netAmount, 'GST Amount', gstAmount);
    });
  }
});