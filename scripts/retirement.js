import { formatINR } from './util.js';
import { calculateRetirementCorpus, calculateSIP } from './finance.js';

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

syncSlider('currentAge', 'currentAgeSlider', 'currentAgeVal', v => `${v} yrs`);
syncSlider('retirementAge', 'retirementAgeSlider', 'retirementAgeVal', v => `${v} yrs`);
syncSlider('monthlyExpense', 'monthlyExpenseSlider', 'monthlyExpenseVal', v => `₹${Number(v).toLocaleString('en-IN')}`);
syncSlider('postRetYears', 'postRetYearsSlider', 'postRetYearsVal', v => `${v} yrs`);
syncSlider('retInflation', 'retInflationSlider', 'retInflationVal', v => `${parseFloat(v).toFixed(1)}%`);
syncSlider('retReturn', 'retReturnSlider', 'retReturnVal', v => `${parseFloat(v).toFixed(1)}%`);



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
    document.getElementById('resultsSection')?.classList.remove('hidden');

    
    const totalInvestment = monthlySIPNeeded * 12 * yearsToRetire;
    const estReturns = corpusNeeded - totalInvestment;
    document.getElementById('resultsSection').classList.remove('hidden');
    updateDonutChart('Total Investment', totalInvestment, 'Estimated Returns', estReturns);

});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    ['currentAge', 'retirementAge', 'monthlyExpense', 'postRetYears', 'retInflation', 'retReturn'].forEach(id => document.getElementById(id).value = '');
    ['yearsToRetOut', 'retExpenseOut', 'corpusOut', 'monthlySIPOut'].forEach(id => document.getElementById(id).textContent = '–');
    const rs = document.getElementById('resultsSection');
    if (rs) rs.classList.add('hidden');
    
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
});
