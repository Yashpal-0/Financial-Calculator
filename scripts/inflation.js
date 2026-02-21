import { formatINR } from './util.js';
import { calculateInflation } from './finance.js';

function syncSlider(inputId, sliderId, displayId, formatter) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!input || !slider || !display) return;
    function update(val) {
        display.textContent = formatter(val);
        const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--slider-thumb) ${pct}%, var(--slider-track) ${pct}%)`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
}

syncSlider('currentValue', 'currentValueSlider', 'currentValueVal', v => {
    const L = v / 100000;
    return L >= 100 ? `₹${(v / 10000000).toFixed(1)}Cr` : L >= 1 ? `₹${L.toFixed(0)}L` : `₹${Number(v).toLocaleString('en-IN')}`;
});
syncSlider('inflationRate', 'inflationRateSlider', 'inflationRateVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('inflationYears', 'inflationYearsSlider', 'inflationYearsVal', v => `${v} yrs`);

let infChart = null;

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const val = Number(document.getElementById('currentValue').value || '0');
    const rate = Number(document.getElementById('inflationRate').value || '0');
    const years = Number(document.getElementById('inflationYears').value || '0');
    if (!(val > 0 && rate > 0 && years > 0)) { alert('Please enter valid values.'); return; }

    const { futureCost, purchasingPowerLost } = calculateInflation(val, rate, years);
    document.getElementById('todayOut').textContent = formatINR(val);
    document.getElementById('futureCostOut').textContent = formatINR(futureCost);
    document.getElementById('powerLostOut').textContent = formatINR(purchasingPowerLost);

    // Build year-by-year data
    const labels = [], data = [];
    for (let y = 1; y <= Math.min(years, 30); y++) {
        labels.push(`Yr ${y}`);
        data.push(val * Math.pow(1 + rate / 100, y));
    }

    document.getElementById('chartSection').style.display = '';
    const isDark = document.documentElement.dataset.theme === 'dark';
    const ctx = document.getElementById('inflationChart').getContext('2d');
    if (infChart) { infChart.destroy(); infChart = null; }
    infChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Future Value',
                data,
                fill: true,
                backgroundColor: 'rgba(13,148,136,0.12)',
                borderColor: 'rgba(13,148,136,0.9)',
                borderWidth: 2.5,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => ` Future Value: ${formatINR(c.raw)}` } }
            },
            scales: {
                x: { ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 } }, grid: { display: false } },
                y: {
                    ticks: {
                        color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 },
                        callback: v => v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${Math.round(v)}`
                    },
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                }
            },
            animation: { duration: 600 }
        }
    });
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['currentValue', 'inflationRate', 'inflationYears'].forEach(id => document.getElementById(id).value = '');
    ['todayOut', 'futureCostOut', 'powerLostOut'].forEach(id => document.getElementById(id).textContent = '–');
    document.getElementById('chartSection').style.display = 'none';
    if (infChart) { infChart.destroy(); infChart = null; }
});
