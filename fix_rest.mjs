import fs from 'fs';
import * as cheerio from 'cheerio';

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

// --- 1. BALANCE TRANSFER ---
let btHtml = fs.readFileSync('pages/balance-transfer.html', 'utf8');
let $bt = cheerio.load(btHtml);

const btKpis = [];
$bt('#summary .flex-col').each((i, el) => {
    btKpis.push($bt(el).prop('outerHTML'));
});

$bt('section[aria-labelledby="bt-summary-heading"]').replaceWith(`
<div id="resultsSection" class="hidden mt-8">
  <h2 class="text-2xl font-bold mb-6">Comparison Summary</h2>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
    <div class="card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80">
      <div class="space-y-6">
        ${btKpis.join('\\n')}
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
`);
fs.writeFileSync('pages/balance-transfer.html', $bt.html(), 'utf8');

let btJs = fs.readFileSync('scripts/balance-transfer.js', 'utf8');
btJs = chartLogic + '\\n\\n' + btJs;
btJs = btJs.replace(/document\.getElementById\('netSavings'\)\.textContent = formatINR\(netSavings\);/, `document.getElementById('netSavings').textContent = formatINR(netSavings);
  document.getElementById('resultsSection').classList.remove('hidden');
  updateDonutChart('Net Savings', netSavings, 'Total Costs', processingFee + otherCosts);`);
btJs = btJs.replace(/document\.getElementById\('netSavings'\)\.textContent = '-';/, `document.getElementById('netSavings').textContent = '-';
  document.getElementById('resultsSection').classList.add('hidden');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }`);
fs.writeFileSync('scripts/balance-transfer.js', btJs, 'utf8');


// --- 2. GST ---
let gstHtml = fs.readFileSync('pages/gst.html', 'utf8');
let $gst = cheerio.load(gstHtml);

$gst('section').last().replaceWith(`
<div id="resultsSection" class="hidden mt-8">
  <h2 class="text-2xl font-bold mb-6">Results</h2>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
    <div class="card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80">
      <div class="space-y-6">
        <div class="flex flex-col space-y-1">
          <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Net Amount</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white" id="netOut">–</div>
        </div>
        <div class="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
        <div class="flex flex-col space-y-1">
          <div class="text-sm font-medium text-slate-500 dark:text-slate-400">GST Amount</div>
          <div class="text-2xl font-bold text-teal-600 dark:text-teal-400" id="gstOut">–</div>
        </div>
        <div class="flex flex-col space-y-1">
          <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Amount</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white" id="totalOut">–</div>
        </div>
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
`);
// add script tag back if removed
if (!$gst.html().includes('chart.js')) {
    $gst('head').append('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
}
fs.writeFileSync('pages/gst.html', $gst.html(), 'utf8');

let gstJs = fs.readFileSync('scripts/gst.js', 'utf8');
gstJs = chartLogic + '\\n\\n' + gstJs;
gstJs = gstJs.replace(/document\.getElementById\('totalOut'\)\.textContent = '₹' \+ totalAmount\.toFixed\(2\);/, `document.getElementById('totalOut').textContent = '₹' + totalAmount.toFixed(2);
      document.getElementById('resultsSection').classList.remove('hidden');
      updateDonutChart('Base Amount', netAmount, 'GST Amount', gstAmount);`);
fs.writeFileSync('scripts/gst.js', gstJs, 'utf8');

// --- 3. PREPAYMENT ---
let ppHtml = fs.readFileSync('pages/prepayment.html', 'utf8');
let $pp = cheerio.load(ppHtml);

const ppKpis = [];
$pp('#summary .kpi').each((i, el) => {
    ppKpis.push($pp(el).prop('outerHTML'));
});
// wait, my refactor_ui already modified #summary. Let's find flex-col inside #summary.
const ppKpis2 = [];
$pp('#summary .flex-col').each((i, el) => {
    ppKpis2.push($pp(el).prop('outerHTML'));
});

const kpiElements = ppKpis2.length > 0 ? ppKpis2 : ppKpis;

$pp('section').filter((i, el) => $pp(el).find('#summary').length > 0).replaceWith(`
<div id="resultsSection" class="hidden mt-8">
  <h2 class="text-2xl font-bold mb-6">Prepayment Analysis</h2>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
    <div class="card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80">
      <div class="grid grid-cols-2 gap-4">
        ${kpiElements.join('\\n')}
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
  ${$pp('#prepayVsInvestCard').prop('outerHTML')}
</div>
`);
$pp('#prepayVsInvestCard').remove(); // if it duplicated
fs.writeFileSync('pages/prepayment.html', $pp.html(), 'utf8');

// Prepayment UI.js
let uiJs = fs.readFileSync('scripts/ui.js', 'utf8');
uiJs = chartLogic + '\\n\\n' + uiJs;
uiJs = uiJs.replace(/setEl\('newTenure', formatNum\(schedLen\) \+ ' months'\);/, `setEl('newTenure', formatNum(schedLen) + ' months');
  document.getElementById('resultsSection').classList.remove('hidden');
  updateDonutChart('Interest Paid', strat.totalInterest, 'Interest Saved', interestSaved);`);
uiJs = uiJs.replace(/setEl\('interestSaved', formatINR\(interestSaved\)\);/, `setEl('interestSaved', formatINR(interestSaved));`);
fs.writeFileSync('scripts/ui.js', uiJs, 'utf8');

// Prepayment Main.js
let mainJs = fs.readFileSync('scripts/main.js', 'utf8');
mainJs = mainJs.replace(/renderSummary\(0, \{ emi: 0, totalInterest: 0 \}, \{ strategyEmi: 0, totalInterest: 0 \}, 0, 0\);/, `renderSummary(0, { emi: 0, totalInterest: 0 }, { strategyEmi: 0, totalInterest: 0 }, 0, 0);
  document.getElementById('resultsSection').classList.add('hidden');
  if (window.chartInstance) { window.chartInstance.destroy(); window.chartInstance = null; }`);
fs.writeFileSync('scripts/main.js', mainJs, 'utf8');
