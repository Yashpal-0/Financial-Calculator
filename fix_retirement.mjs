import fs from 'fs';
import * as cheerio from 'cheerio';

const htmlPath = 'pages/retirement.html';
let html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Find the summary section and extract KPIs
const kpis = [];
$('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 .flex-col').each((i, el) => {
    kpis.push($(el).prop('outerHTML'));
});

// Build the new results section
const resultsSection = `
<div id="resultsSection" class="hidden mt-8">
  <h2 class="text-2xl font-bold mb-6">Overview</h2>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
    <div class="card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80">
      <div class="space-y-6">
        ${kpis.join('\\n')}
      </div>
    </div>
    <div class="card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8">
      <div class="w-48 h-48 sm:w-56 sm:h-56 relative flex-shrink-0">
        <canvas id="donutChart"></canvas>
      </div>
      <div id="chartLegend" class="flex-1 w-full space-y-3">
      </div>
    </div>
  </div>
</div>
`;

$('#resultsSection').replaceWith(resultsSection);
$('#chartSection').remove();

fs.writeFileSync(htmlPath, $.html(), 'utf8');

// Update JS
const jsPath = 'scripts/retirement.js';
let js = fs.readFileSync(jsPath, 'utf8');

const chartLogic = `let chartInstance = null;
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
                    label: ctx => \` \${ctx.label}: ₹\${Number(ctx.raw).toLocaleString('en-IN')}\`
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
    legendEl.innerHTML = \`
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(13,148,136,0.85)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">\${label1}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">₹\${Number(val1).toLocaleString('en-IN')}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">\${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">₹\${Number(val2).toLocaleString('en-IN')}</span>
    </div>
  \`;
}`;

js = js.replace(/let retChart = null;/g, '');
js = js.replace(/\/\/ Chart: corpus build-up year by year[\s\S]*?\}\);/g, `
    const totalInvestment = monthlySIPNeeded * 12 * yearsToRetire;
    const estReturns = corpusNeeded - totalInvestment;
    document.getElementById('resultsSection').classList.remove('hidden');
    updateDonutChart('Total Investment', totalInvestment, 'Estimated Returns', estReturns);
`);
js = js.replace(/document\.getElementById\('chartSection'\)\.classList\.add\('hidden'\);/g, '');
js = js.replace(/if \(retChart\) \{ retChart\.destroy\(\); retChart = null; \}/g, "if (chartInstance) { chartInstance.destroy(); chartInstance = null; }");

js = chartLogic + '\\n\\n' + js;
fs.writeFileSync(jsPath, js, 'utf8');

