import fs from 'fs';
import * as cheerio from 'cheerio';

const emiHtml = fs.readFileSync('pages/emi.html', 'utf8');
const $emi = cheerio.load(emiHtml);

const navHtml = $emi('nav.sticky').prop('outerHTML');
const footerHtml = $emi('footer').prop('outerHTML');
const bodyClass = $emi('body').attr('class');

const pages = [
  'sip.html', 'step-up-sip.html', 'mutual-fund.html', 'lumpsum.html',
  'fd.html', 'rd.html', 'ppf.html', 'pomis.html', 'ssy.html', 'cagr.html'
];

for (const page of pages) {
  const filePath = `pages/${page}`;
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  // Update <head>
  $('script[src*="chart.umd.min.js"]').replaceWith('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
  
  const title = $('title').text();
  const desc = $('meta[name="description"]').attr('content');
  const h1 = $('header h1').text();
  const hp = $('header p').text();

  // Extract inputs
  const inputsHtml = [];
  $('section.card .row > div').each((i, el) => {
    const $div = $(el);
    const $label = $div.find('label');
    const labelText = $label.contents().filter((_, e) => e.nodeType === 3).text().trim();
    const tooltip = $label.find('.tooltip').text();
    const inputId = $div.find('input[type="number"]').attr('id');
    const inputMin = $div.find('input[type="number"]').attr('min');
    const inputMax = $div.find('input[type="number"]').attr('max');
    const inputStep = $div.find('input[type="number"]').attr('step');
    const inputPlaceholder = $div.find('input[type="number"]').attr('placeholder');
    const inputMode = $div.find('input[type="number"]').attr('inputmode') || 'decimal';
    
    const sliderId = $div.find('input[type="range"]').attr('id');
    const sliderMin = $div.find('input[type="range"]').attr('min');
    const sliderMax = $div.find('input[type="range"]').attr('max');
    const sliderStep = $div.find('input[type="range"]').attr('step');
    const sliderValue = $div.find('input[type="range"]').attr('value');
    
    const valId = $div.find('.slider-value').attr('id');
    const valText = $div.find('.slider-value').text();
    
    let tooltipHtml = '';
    if (tooltip) {
      tooltipHtml = `
            <div class="group relative ml-2 cursor-help">
              <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">?</span>
              <div class="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full">
                ${tooltip}
              </div>
            </div>`;
    }

    // Only add slider html if a slider exists
    let sliderHtml = '';
    if (sliderId) {
      sliderHtml = `
          <div class="flex items-center space-x-4">
            <input type="range" id="${sliderId}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" value="${sliderValue}">
            <span class="text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right" id="${valId}">${valText}</span>
          </div>`;
    }

    const inputBlock = `
        <div>
          <label for="${inputId}" class="label-text flex items-center">
            ${labelText}${tooltipHtml}
          </label>
          <input id="${inputId}" class="input-field mb-4" type="number" inputmode="${inputMode}" min="${inputMin}" ${inputMax ? `max="${inputMax}"` : ''} step="${inputStep}" placeholder="${inputPlaceholder}">
          ${sliderHtml}
        </div>`;
    inputsHtml.push(inputBlock);
  });

  // Determine grid columns
  const numInputs = inputsHtml.length;
  const gridCols = numInputs === 2 ? 'md:grid-cols-2' : (numInputs === 4 ? 'md:grid-cols-2' : 'md:grid-cols-3');

  // Extract Buttons
  const calcBtnId = $('.actions button:not(.ghost)').attr('id') || 'calcBtn';
  const calcBtnText = $('.actions button:not(.ghost)').text() || 'Calculate ✨';
  const resetBtnId = $('.actions button.ghost').attr('id') || 'resetBtn';
  const resetBtnText = $('.actions button.ghost').text() || 'Reset';

  // Extract KPIs
  const kpisHtml = [];
  $('.summary .kpi').each((i, el) => {
    const $kpi = $(el);
    const label = $kpi.find('.label').text().trim();
    const $val = $kpi.find('.value');
    const valId = $val.attr('id');
    const isHighlight = $val.hasClass('highlight');
    const isSuccess = $val.hasClass('success');
    
    let textClass = 'text-2xl font-bold text-slate-900 dark:text-white';
    if (isHighlight) textClass = 'text-4xl font-extrabold text-teal-600 dark:text-teal-400';
    if (isSuccess) textClass = 'text-2xl font-bold text-teal-600 dark:text-teal-400';
    
    let divider = '';
    if (i === 0 && !isHighlight) divider = '<div class="w-full h-px bg-slate-200 dark:bg-slate-700"></div>';
    
    kpisHtml.push(`
            <div>
              <div class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">${label}</div>
              <div class="${textClass}" id="${valId}">–</div>
            </div>${i === 0 ? '\n            <div class="w-full h-px bg-slate-200 dark:bg-slate-700"></div>' : ''}`);
  });

  // Extract Tip Card
  let tipHtml = '';
  if ($('.tip-card').length > 0) {
    const icon = $('.tip-card .tip-icon').text();
    const tipH4 = $('.tip-card h4').text();
    const tipP = $('.tip-card p').html();
    tipHtml = `
      <!-- Tip Card -->
      <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl p-5 mb-10 flex items-start gap-4">
        <div class="text-2xl">${icon}</div>
        <div>
          <h4 class="font-bold text-teal-800 dark:text-teal-300 mb-1">${tipH4}</h4>
          <p class="text-sm text-teal-700 dark:text-teal-400/80">
            ${tipP.replace(/style="[^"]*"/g, 'class="font-bold underline"')}
          </p>
        </div>
      </div>`;
  }

  // Construct new body
  const newBody = `
  <!-- Controls -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-3 pt-3 relative z-50">
    <button id="installBtn" class="hidden px-3 py-1.5 text-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Install App</button>
    <button id="themeToggle" class="px-3 py-1.5 text-base rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Toggle dark mode">🌓</button>
  </div>

  ${navHtml}

  <header class="py-12 md:py-16 text-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
        ${h1}
      </h1>
      <p class="text-lg text-slate-600 dark:text-slate-400">
        ${hp}
      </p>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
    <section class="card p-6 md:p-8 mb-8">
      <div class="grid grid-cols-1 ${gridCols} gap-6 mb-8">
        ${inputsHtml.join('\n')}
      </div>

      <div class="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button id="${calcBtnId}" class="btn-primary flex-1 sm:flex-none">${calcBtnText}</button>
        <button id="${resetBtnId}" class="btn-secondary flex-1 sm:flex-none">${resetBtnText}</button>
      </div>
    </section>

    <!-- Summary & Chart Section -->
    <div id="resultsSection" class="hidden">
      <h2 class="text-2xl font-bold mb-6">Overview</h2>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <!-- KPIs -->
        <div class="card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80">
          <div class="space-y-6">
            ${kpisHtml.join('\n')}
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8">
          <div class="w-48 h-48 sm:w-56 sm:h-56 relative flex-shrink-0">
            <canvas id="donutChart"></canvas>
          </div>
          <div id="chartLegend" class="flex-1 w-full space-y-3">
            <!-- Legend items will be injected here via JS -->
          </div>
        </div>
      </div>

      ${tipHtml}
    </div>
  </main>

  ${footerHtml}

  <script type="module">
    import { initApp } from '../scripts/app.js';
    import '../scripts/${page.replace('.html', '.js')}';
    initApp();
  </script>
`;

  $('body').attr('class', bodyClass).html(newBody);

  // Update active nav link (remove current from emi, add to this page)
  $('nav a').removeClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white').addClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800').removeAttr('aria-current');
  const navLink = $(`nav a[href="./${page}"]`);
  navLink.removeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800')
         .addClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white')
         .attr('aria-current', 'page');

  // Fix mobile nav current logic as well
  const mobileNavLink = $(`#mobile-menu a[href="./${page}"]`);
  mobileNavLink.removeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800')
               .addClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white');

  fs.writeFileSync(filePath, $.html(), 'utf8');
  console.log('Updated HTML:', filePath);
}
