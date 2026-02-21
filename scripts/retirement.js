import { formatINR } from './util.js';
import { calculateRetirementCorpus, calculateSIP } from './finance.js';

function syncSlider(inputId, sliderId, displayId, formatter) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!input || !slider || !display) return;
    function update(val) {
        display.textContent = formatter(val);
        const pct = ((+val - +slider.min) / (+slider.max - +slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--slider-thumb) ${pct}%, var(--slider-track) ${pct}%)`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
}

syncSlider('currentAge', 'currentAgeSlider', 'currentAgeVal', v => `${v} yrs`);
syncSlider('retirementAge', 'retirementAgeSlider', 'retirementAgeVal', v => `${v} yrs`);
syncSlider('monthlyExpense', 'monthlyExpenseSlider', 'monthlyExpenseVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('postRetYears', 'postRetYearsSlider', 'postRetYearsVal', v => `${v} yrs`);
syncSlider('retInflation', 'retInflationSlider', 'retInflationVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('retReturn', 'retReturnSlider', 'retReturnVal', v => `${parseFloat(v).toFixed(1)}%`);

let retChart = null;

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const currentAge = Number(document.getElementById('currentAge').value || 0);
    const retirementAge = Number(document.getElementById('retirementAge').value || 0);
    const monthlyExpense = Number(document.getElementById('monthlyExpense').value || 0);
    const postRetYears = Number(document.getElementById('postRetYears').value || 25);
    const inflation = Number(document.getElementById('retInflation').value || 0);
    const returnRate = Number(document.getElementById('retReturn').value || 0);

    if (currentAge <= 0 || retirementAge <= currentAge || monthlyExpense <= 0 || inflation <= 0 || returnRate <= 0) {
        alert('Please enter valid values. Retirement age must be greater than current age.'); return;
    }

    const { corpusNeeded, monthlySIPNeeded, retMonthlyExpense, yearsToRetire } =
        calculateRetirementCorpus(currentAge, retirementAge, monthlyExpense, inflation, returnRate, postRetYears);

    document.getElementById('yearsToRetOut').textContent = `${yearsToRetire} years`;
    document.getElementById('retExpenseOut').textContent = formatINR(retMonthlyExpense);
    document.getElementById('corpusOut').textContent = formatINR(corpusNeeded);
    document.getElementById('monthlySIPOut').textContent = formatINR(monthlySIPNeeded);
    document.getElementById('resultsSection')?.removeAttribute('style');

    // Chart: corpus build-up year by year
    const labels = [], built = [];
    const r = returnRate / 100 / 12;
    for (let y = 1; y <= yearsToRetire; y++) {
        const fv = calculateSIP(monthlySIPNeeded, returnRate, y * 12);
        labels.push(`Age ${currentAge + y}`);
        built.push(fv);
    }

    document.getElementById('chartSection').style.display = '';
    const isDark = document.documentElement.dataset.theme === 'dark';
    const ctx = document.getElementById('retChart').getContext('2d');
    if (retChart) { retChart.destroy(); retChart = null; }
    retChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Corpus Built',
                    data: built,
                    borderColor: 'rgba(13,148,136,0.9)',
                    backgroundColor: 'rgba(13,148,136,0.12)',
                    fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 2,
                },
                {
                    label: 'Target Corpus',
                    data: Array(labels.length).fill(corpusNeeded),
                    borderColor: 'rgba(220,38,38,0.6)',
                    backgroundColor: 'transparent',
                    fill: false, tension: 0, borderWidth: 1.5, borderDash: [8, 4], pointRadius: 0,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: isDark ? '#fafaf9' : '#1c1917', font: { family: "'Plus Jakarta Sans', sans-serif", size: 13 } } },
                tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${formatINR(c.raw)}` } }
            },
            scales: {
                x: { ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 11 }, maxRotation: 45 }, grid: { display: false } },
                y: {
                    ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 11 }, callback: v => v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${v}` },
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                }
            },
            animation: { duration: 600 }
        }
    });
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['currentAge', 'retirementAge', 'monthlyExpense', 'postRetYears', 'retInflation', 'retReturn'].forEach(id => document.getElementById(id).value = '');
    ['yearsToRetOut', 'retExpenseOut', 'corpusOut', 'monthlySIPOut'].forEach(id => document.getElementById(id).textContent = '–');
    const rs = document.getElementById('resultsSection');
    if (rs) rs.style.display = 'none';
    document.getElementById('chartSection').style.display = 'none';
    if (retChart) { retChart.destroy(); retChart = null; }
});
