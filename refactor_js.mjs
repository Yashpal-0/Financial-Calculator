import fs from 'fs';

const pages = [
  'sip.js', 'step-up-sip.js', 'mutual-fund.js', 'lumpsum.js',
  'fd.js', 'rd.js', 'ppf.js', 'pomis.js', 'ssy.js', 'cagr.js'
];

const syncSliderReplacement = `function syncSlider(inputId, sliderId, displayId, formatter) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!input || !slider || !display) return;

    function update(val) {
        display.textContent = formatter(val);
        const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
        const thumbColor = '#0d9488';
        const trackColor = document.documentElement.dataset.theme === 'dark' ? '#334155' : '#e2e8f0';
        slider.style.background = \`linear-gradient(to right, \${thumbColor} \${pct}%, \${trackColor} \${pct}%)\`;
    }
    input.addEventListener('input', () => { slider.value = input.value; update(input.value); });
    slider.addEventListener('input', () => { input.value = slider.value; update(slider.value); });
    update(slider.value);
    
    const observer = new MutationObserver(() => update(slider.value));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}`;

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
                    label: ctx => \` \${ctx.label}: \${formatINR(ctx.raw)}\`
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
      <span class="font-semibold text-slate-900 dark:text-white">\${formatINR(val1)}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-3" style="background:rgba(8,145,178,0.75)"></div>
        <span class="text-sm text-slate-600 dark:text-slate-400">\${label2}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">\${formatINR(val2)}</span>
    </div>
  \`;
}`;

for (const page of pages) {
  const filePath = `scripts/${page}`;
  if (!fs.existsSync(filePath)) continue;

  let js = fs.readFileSync(filePath, 'utf8');

  // 1. Replace syncSlider
  js = js.replace(/function syncSlider[\s\S]*?\}\s*?(?=\n\S)/, syncSliderReplacement + '\n');

  // 2. Remove old chart code
  js = js.replace(/let \w+Chart = null;/, '');
  js = js.replace(/function buildYearlyData[\s\S]*?\}\s*(?=\n\S)/, '');
  js = js.replace(/function updateBarChart[\s\S]*?\}\s*(?=\n\S)/, '');
  js = js.replace(/function updateChart[\s\S]*?\}\s*(?=\n\S)/, '');
  js = js.replace(/function updatePieChart[\s\S]*?\}\s*(?=\n\S)/, '');

  // 3. Inject new chart logic before the first event listener
  if (!js.includes('updateDonutChart')) {
      const splitIdx = js.search(/document\.getElementById.*addEventListener/);
      if (splitIdx !== -1) {
          js = js.slice(0, splitIdx) + chartLogic + '\n\n' + js.slice(splitIdx);
      } else {
          js += '\n\n' + chartLogic;
      }
  }

  // 4. Update the chart section display logic in Calc
  js = js.replace(/document\.getElementById\('chartSection'\)\.style\.display\s*=\s*'';/, "document.getElementById('resultsSection').classList.remove('hidden');");
  
  // 5. Update the chart destruction in Reset
  js = js.replace(/document\.getElementById\('chartSection'\)\.style\.display\s*=\s*'none';/, "document.getElementById('resultsSection').classList.add('hidden');");
  js = js.replace(/if \(\w+Chart\) \{ \w+Chart\.destroy\(\); \w+Chart = null; \}/g, "if (chartInstance) { chartInstance.destroy(); chartInstance = null; }");

  let label1 = "'Invested Amount'";
  let label2 = "'Estimated Returns'";
  let val1 = "invested";
  let val2 = "gained";

  if (page === 'fd.js' || page === 'ssy.js' || page === 'ppf.js') {
      label1 = "'Principal Amount'";
      label2 = "'Total Interest'";
      val1 = "P";
      if (page === 'ppf.js' || page === 'ssy.js') val1 = "invested";
      val2 = "interest";
  } else if (page === 'rd.js') {
      label1 = "'Total Deposits'";
      label2 = "'Total Interest'";
      val1 = "deposits";
      val2 = "interest";
  } else if (page === 'pomis.js') {
      label1 = "'Invested Amount'";
      label2 = "'Total Income'";
      val1 = "P";
      val2 = "totalIncome";
  } else if (page === 'cagr.js') {
      label1 = "'Initial Value'";
      label2 = "'Absolute Return'";
      val1 = "Vbegin";
      val2 = "absReturn";
  } else if (page === 'mutual-fund.js') {
      val1 = "totalInvested";
      val2 = "estReturns";
  }

  if (js.includes('updateBarChart')) {
      js = js.replace(/updateBarChart\(.*?\);/, `document.getElementById('resultsSection').classList.remove('hidden');\n    updateDonutChart(${label1}, ${val1}, ${label2}, ${val2});`);
  } else {
      if (!js.includes('updateDonutChart(')) {
          const resHideRegex = /document\.getElementById\('resultsSection'\)\.classList\.remove\('hidden'\);/;
          if (resHideRegex.test(js)) {
             js = js.replace(resHideRegex, `document.getElementById('resultsSection').classList.remove('hidden');\n    updateDonutChart(${label1}, ${val1}, ${label2}, ${val2});`);
          } else {
             // For files like lumpsum.js that didn't have chartSection originally,
             // find the end of calc handler before resetBtn handler
             // A common pattern is inserting it right before the reset listener.
             // We can find the resetBtn addEventListener and insert right before the previous line, but it's safer to find the assignment of textContent.
             const textContentRegex = /(document\.getElementById\('.*?Out'\)\.textContent\s*=\s*.*?;\s*)+/;
             const match = js.match(textContentRegex);
             if (match) {
                 js = js.replace(match[0], match[0] + `\n    document.getElementById('resultsSection').classList.remove('hidden');\n    updateDonutChart(${label1}, ${val1}, ${label2}, ${val2});\n`);
             }
          }
      }
  }

  // Handle mutual fund specific code changes if any, but above regex handles most
  fs.writeFileSync(filePath, js, 'utf8');
  console.log('Updated JS:', filePath);
}