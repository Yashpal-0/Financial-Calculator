import { formatINR } from './util.js';
import { calculateIncomeTax } from './finance.js';

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

const lakhFmt = v => { const L = v / 100000; return L >= 100 ? `₹${(v / 10000000).toFixed(1)}Cr` : L >= 1 ? `₹${L.toFixed(1)}L` : `₹${Number(v).toLocaleString('en-IN')}`; };
syncSlider('grossIncome', 'grossIncomeSlider', 'grossIncomeVal', lakhFmt);
syncSlider('sec80C', 'sec80CSlider', 'sec80CVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('hra', 'hraSlider', 'hraVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('nps', 'npsSlider', 'npsVal', v => `₹${Number(v).toLocaleString('en-IN')}`);

let taxChart = null;

document.getElementById('calcBtn')?.addEventListener('click', () => {
    const gross = Number(document.getElementById('grossIncome').value || 0);
    const sec80C = Number(document.getElementById('sec80C').value || 0);
    const hra = Number(document.getElementById('hra').value || 0);
    const nps = Number(document.getElementById('nps').value || 0);
    const otherDeductions = Number(document.getElementById('otherDed').value || 0);

    if (gross <= 0) { alert('Please enter a valid gross income.'); return; }

    const { oldRegimeTax, newRegimeTax, recommendation, savings, oldTaxableIncome, newTaxableIncome } =
        calculateIncomeTax(gross, { section80C: sec80C, hra, nps, otherDeductions });

    const oldStdDed = 50000;
    const newStdDed = 75000;
    const totalOldDed = Math.min(sec80C, 150000) + hra + Math.min(nps, 50000) + otherDeductions + oldStdDed;
    const regimeName = recommendation === 'new' ? '🆕 New Regime' : '📋 Old Regime';

    document.getElementById('recommText').textContent = regimeName + ' saves you more';
    document.getElementById('savingsText').textContent = formatINR(savings) + '/yr';
    const recommSection = document.getElementById('recommSection');
    if (recommSection) {
        recommSection.classList.remove('hidden');
        recommSection.style.display = '';
    }
    document.getElementById('resultsSection')?.classList.remove('hidden');

    // Comparison table
    const rows = [
        ['Gross Income', formatINR(gross), formatINR(gross)],
        ['Standard Deduction', formatINR(oldStdDed), formatINR(newStdDed)],
        ['Section 80C', formatINR(Math.min(sec80C, 150000)), '–'],
        ['HRA Exemption', formatINR(hra), '–'],
        ['NPS (80CCD 1B)', formatINR(Math.min(nps, 50000)), '–'],
        ['Other Deductions', formatINR(otherDeductions), '–'],
        ['Total Deductions', formatINR(totalOldDed), formatINR(newStdDed)],
        ['Taxable Income', formatINR(oldTaxableIncome), formatINR(newTaxableIncome)],
        ['Tax + Cess (4%)', formatINR(oldRegimeTax), formatINR(newRegimeTax)],
        ['Monthly Tax', formatINR(oldRegimeTax / 12), formatINR(newRegimeTax / 12)],
    ];

    const tbody = document.getElementById('compareTableBody');
    tbody.innerHTML = '';
    for (const [param, oldVal, newVal] of rows) {
        const tr = document.createElement('tr');
        const isLastRow = param.includes('Tax +') || param.includes('Monthly');
        if (isLastRow) tr.classList.add('highlight-row');

        const tdParam = document.createElement('td');
        tdParam.className = 'left';
        tdParam.style.fontWeight = isLastRow ? '700' : '';
        tdParam.textContent = param;
        tr.appendChild(tdParam);

        const tdOld = document.createElement('td');
        tdOld.textContent = oldVal;
        if (isLastRow) { tdOld.className = recommendation === 'old' ? 'better' : 'worse'; }
        tr.appendChild(tdOld);

        const tdNew = document.createElement('td');
        tdNew.textContent = newVal;
        if (isLastRow) { tdNew.className = recommendation === 'new' ? 'better' : 'worse'; }
        tr.appendChild(tdNew);

        tbody.appendChild(tr);
    }

    // Bar chart
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
        chartSection.classList.remove('hidden');
        chartSection.style.display = '';
    }
    const isDark = document.documentElement.dataset.theme === 'dark';
    const chartCanvas = document.getElementById('taxBarChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
    if (taxChart) { taxChart.destroy(); taxChart = null; }
    if (typeof Chart !== 'undefined') {
        taxChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Old Regime', 'New Regime'],
            datasets: [{
                label: 'Annual Tax',
                data: [oldRegimeTax, newRegimeTax],
                backgroundColor: [
                    recommendation === 'old' ? 'rgba(13,148,136,0.85)' : 'rgba(8,145,178,0.75)',
                    recommendation === 'new' ? 'rgba(13,148,136,0.85)' : 'rgba(8,145,178,0.75)',
                ],
                borderColor: [
                    recommendation === 'old' ? 'rgba(13,148,136,1)' : 'rgba(8,145,178,1)',
                    recommendation === 'new' ? 'rgba(13,148,136,1)' : 'rgba(8,145,178,1)',
                ],
                borderWidth: 1.5,
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => ` Annual Tax: ${formatINR(c.raw)}` } }
            },
            scales: {
                x: { ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 14, weight: '600' } }, grid: { display: false } },
                y: {
                    ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 }, callback: v => v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${v}` },
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                }
            },
            animation: { duration: 500 }
        }
    });
    }
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['grossIncome', 'sec80C', 'hra', 'nps', 'otherDed'].forEach(id => document.getElementById(id).value = '');
    const recommSection = document.getElementById('recommSection');
    if (recommSection) {
        recommSection.classList.add('hidden');
        recommSection.style.display = 'none';
    }
    document.getElementById('resultsSection')?.classList.add('hidden');
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
        chartSection.classList.add('hidden');
        chartSection.style.display = 'none';
    }
    if (taxChart) { taxChart.destroy(); taxChart = null; }
});
