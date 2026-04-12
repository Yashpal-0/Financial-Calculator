import { formatINR } from './util.js';
import { calculateSIP } from './finance.js';

function syncSlider(inputId, sliderId, displayId, formatter) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!input || !slider || !display) return;

    function update(val) {
        display.textContent = formatter(val);
        const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
        const thumbColor = '#0d9488';
        const trackColor = document.documentElement.dataset.theme === 'dark' ? '#334155' : '#e2e8f0';
        slider.style.background = `linear-gradient(to right, ${thumbColor} ${pct}%, ${trackColor} ${pct}%)`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
    
    const observer = new MutationObserver(() => update(slider.value));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

syncSlider('monthlyInv', 'monthlyInvSlider', 'monthlyInvVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('annualRate', 'annualRateSlider', 'annualRateVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('tenureYears', 'tenureYearsSlider', 'tenureYearsVal', v => `${v} yrs`);





}

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
    const P = Number(document.getElementById('monthlyInv').value || '0');
    const r = Number(document.getElementById('annualRate').value || '0');
    const years = Number(document.getElementById('tenureYears').value || '0');
    if (!(P > 0 && r >= 0 && Number.isInteger(years) && years > 0)) {
        alert('Please enter valid monthly investment, rate, and total years.'); return;
    }
    const months = years * 12;
    const fv = calculateSIP(P, r, months);
    const invested = P * months;
    const gained = fv - invested;
    document.getElementById('totalInvestedOut').textContent = formatINR(invested);
    document.getElementById('wealthGainedOut').textContent = formatINR(gained);
    document.getElementById('futureValueOut').textContent = formatINR(fv);
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    updateDonutChart('Invested Amount', invested, 'Estimated Returns', gained);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['monthlyInv', 'annualRate', 'tenureYears'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('totalInvestedOut').textContent = '–';
    document.getElementById('wealthGainedOut').textContent = '–';
    document.getElementById('futureValueOut').textContent = '–';
    document.getElementById('resultsSection').classList.add('hidden');
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
});
