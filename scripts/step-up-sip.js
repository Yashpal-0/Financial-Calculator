import { formatINR } from './util.js';
import { calculateStepUpSIP, calculateSIP } from './finance.js';

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
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); 
    document.getElementById('resultsSection').classList.remove('hidden');
    updateDonutChart('Invested Amount', invested, 'Estimated Returns', gained);
});
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
    
    const observer = new MutationObserver(() => update(slider.value));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

syncSlider('initSIP', 'initSIPSlider', 'initSIPVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('stepUpPct', 'stepUpPctSlider', 'stepUpPctVal', v => `${v}%`);
syncSlider('returnRate', 'returnRateSlider', 'returnRateVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('sipYears', 'sipYearsSlider', 'sipYearsVal', v => `${v} yrs`);



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
    const init = Number(document.getElementById('initSIP').value || '0');
    const step = Number(document.getElementById('stepUpPct').value || '0');
    const rate = Number(document.getElementById('returnRate').value || '0');
    const years = Number(document.getElementById('sipYears').value || '0');
    if (!(init > 0 && step >= 0 && rate >= 0 && years > 0)) { alert('Please enter valid values.'); return; }

    const { futureValue, totalInvested } = calculateStepUpSIP(init, step, rate, years);
    const wealthGained = futureValue - totalInvested;

    document.getElementById('totalInvestedOut').textContent = formatINR(totalInvested);
    document.getElementById('wealthGainedOut').textContent = formatINR(wealthGained);
    document.getElementById('futureValueOut').textContent = formatINR(futureValue);

    // Year-by-year for chart (compare stepup vs flat SIP)
    const labels = [], stepUpData = [], flatData = [], investedData = [];
    let cumInvested = 0, cumFlat = 0;
    let monthly = init;
    for (let y = 1; y <= years; y++) {
        const { futureValue: fvSU } = calculateStepUpSIP(init, step, rate, y);
        const fvFlat = calculateSIP(init, rate, y * 12);
        cumInvested += monthly * 12;
        cumFlat += init * 12;
        labels.push(`Yr ${y}`);
        stepUpData.push(fvSU);
        flatData.push(fvFlat);
        investedData.push(cumInvested);
        monthly = monthly * (1 + step / 100);
    }

    document.getElementById('resultsSection').classList.remove('hidden');
    updateDonutChart('Invested Amount', totalInvested, 'Estimated Returns', wealthGained);
    const isDark = document.documentElement.dataset.theme === 'dark';
    const ctx = document.getElementById('stepUpChart').getContext('2d');
    const datasets = [
        {
            label: 'Step-Up SIP Corpus',
            data: stepUpData,
            borderColor: 'rgba(13,148,136,0.9)',
            backgroundColor: 'rgba(13,148,136,0.12)',
            fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3,
        },
        {
            label: 'Flat SIP Corpus',
            data: flatData,
            borderColor: 'rgba(8,145,178,0.8)',
            backgroundColor: 'rgba(8,145,178,0.06)',
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, borderDash: [6, 3],
        },
    ];

    if (window.stepChart) { window.stepChart.destroy(); }
    window.stepChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: isDark ? '#fafaf9' : '#1c1917', font: { family: "'Plus Jakarta Sans', sans-serif", size: 13 } } },
                tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${formatINR(c.raw)}` } }
            },
            scales: {
                x: { ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 } }, grid: { display: false } },
                y: {
                    ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 }, callback: v => v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${v}` },
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                }
            },
            animation: { duration: 600 }
        }
    });
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['initSIP', 'stepUpPct', 'returnRate', 'sipYears'].forEach(id => document.getElementById(id).value = '');
    ['totalInvestedOut', 'wealthGainedOut', 'futureValueOut'].forEach(id => document.getElementById(id).textContent = '–');
    document.getElementById('resultsSection').classList.add('hidden');
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
});
