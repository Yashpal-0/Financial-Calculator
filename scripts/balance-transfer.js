import { formatINR } from './util.js';
import { calculateEmi } from './finance.js';

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

document.getElementById('calcBtn').addEventListener('click', () => {
  const outstanding = Number(document.getElementById('currOutstanding').value || '0');
  const currRate = Number(document.getElementById('currRate').value || '0');
  const currTenure = Number(document.getElementById('currTenure').value || '0');
  const newRate = Number(document.getElementById('newRate').value || '0');
  const processingFee = Number(document.getElementById('processingFee').value || '0');
  const otherCosts = Number(document.getElementById('otherCosts').value || '0');

  if (!(outstanding>0 && currRate>=0 && newRate>=0 && Number.isInteger(currTenure) && currTenure>0)) { alert('Please enter valid values.'); return; }

  const currEmi = calculateEmi(outstanding, currRate, currTenure);
  const newEmi = calculateEmi(outstanding, newRate, currTenure);

  const currTotalInterest = (currEmi * currTenure) - outstanding;
  const newTotalInterest = (newEmi * currTenure) - outstanding;
  const interestSaved = Math.max(0, currTotalInterest - newTotalInterest);
  const netSavings = Math.max(0, interestSaved - (processingFee + otherCosts));

  document.getElementById('currEmi').textContent = formatINR(currEmi);
  document.getElementById('newEmi').textContent = formatINR(newEmi);
  document.getElementById('interestSaved').textContent = formatINR(interestSaved);
  document.getElementById('netSavings').textContent = formatINR(netSavings);
  document.getElementById('resultsSection').classList.remove('hidden');
  updateDonutChart('Net Savings', netSavings, 'Total Costs', processingFee + otherCosts);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('currOutstanding').value = '';
  document.getElementById('currRate').value = '9';
  document.getElementById('currTenure').value = '180';
  document.getElementById('newRate').value = '8.4';
  document.getElementById('processingFee').value = '10000';
  document.getElementById('otherCosts').value = '0';
  document.getElementById('currEmi').textContent = '-';
  document.getElementById('newEmi').textContent = '-';
  document.getElementById('interestSaved').textContent = '-';
  document.getElementById('netSavings').textContent = '-';
  document.getElementById('resultsSection').classList.add('hidden');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
});


