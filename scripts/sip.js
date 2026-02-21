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
        slider.style.background = `linear-gradient(to right, var(--slider-thumb) ${pct}%, var(--slider-track) ${pct}%)`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
}

syncSlider('monthlyInv', 'monthlyInvSlider', 'monthlyInvVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('annualRate', 'annualRateSlider', 'annualRateVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('tenureYears', 'tenureYearsSlider', 'tenureYearsVal', v => `${v} yrs`);

let sipChart = null;

function buildYearlyData(monthly, rate, years) {
    const data = [];
    for (let y = 1; y <= years; y++) {
        const fv = calculateSIP(monthly, rate, y * 12);
        const invested = monthly * y * 12;
        data.push({ year: y, fv, invested });
    }
    return data;
}

function updateBarChart(yearlyData) {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const labels = yearlyData.map(d => `Yr ${d.year}`);
    const invested = yearlyData.map(d => d.invested);
    const gains = yearlyData.map(d => d.fv - d.invested);

    const ctx = document.getElementById('sipBarChart').getContext('2d');
    const datasets = [
        {
            label: 'Amount Invested',
            data: invested,
            backgroundColor: 'rgba(8,145,178,0.65)',
            borderColor: 'rgba(8,145,178,1)',
            borderWidth: 1.5,
            borderRadius: 6,
        },
        {
            label: 'Wealth Gained',
            data: gains,
            backgroundColor: 'rgba(13,148,136,0.75)',
            borderColor: 'rgba(13,148,136,1)',
            borderWidth: 1.5,
            borderRadius: 6,
        },
    ];

    if (sipChart) {
        sipChart.data.labels = labels;
        sipChart.data.datasets[0].data = invested;
        sipChart.data.datasets[1].data = gains;
        sipChart.update();
    } else {
        sipChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#fafaf9' : '#1c1917', font: { family: "'Plus Jakarta Sans', sans-serif", size: 13 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: c => ` ${c.dataset.label}: ${formatINR(c.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 } },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            color: isDark ? '#a8a29e' : '#57534e',
                            font: { size: 12 },
                            callback: v => v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${v}`
                        },
                        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                    }
                },
                animation: { duration: 600 }
            }
        });
    }
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
    document.getElementById('chartSection').style.display = '';
    updateBarChart(buildYearlyData(P, r, years));
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['monthlyInv', 'annualRate', 'tenureYears'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('totalInvestedOut').textContent = '–';
    document.getElementById('wealthGainedOut').textContent = '–';
    document.getElementById('futureValueOut').textContent = '–';
    document.getElementById('chartSection').style.display = 'none';
    if (sipChart) { sipChart.destroy(); sipChart = null; }
});
