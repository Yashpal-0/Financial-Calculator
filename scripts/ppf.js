import { formatINR } from './util.js';
import { calculatePPF } from './finance.js';

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
                    label: ctx => ` ${ctx.label}: ${formatINR(ctx.raw)}`
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
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(val1)}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${formatINR(val2)}</span>
    </div>
  `;
}

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
ment.getElementById('annualRate').value = '7.1';
    document.getElementById('tenureYears').value = '15';
    document.getElementById('totalInvestedOut').textContent = '-';
    document.getElementById('wealthGainedOut').textContent = '-';
    document.getElementById('futureValueOut').textContent = '-';
});
