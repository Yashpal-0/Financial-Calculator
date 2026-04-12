import fs from 'fs';
import * as cheerio from 'cheerio';

const emiHtml = fs.readFileSync('pages/emi.html', 'utf8');
const $emi = cheerio.load(emiHtml);

const navHtml = $emi('nav.sticky').prop('outerHTML');
const footerHtml = $emi('footer').prop('outerHTML');

const pages = [
  'prepayment.html', 'affordability.html', 'balance-transfer.html',
  'income-tax.html', 'inflation.html', 'retirement.html',
  'education.html', 'gst.html', 'gratuity.html'
];

for (const page of pages) {
  const filePath = `pages/${page}`;
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  // Update <head> chart.js
  $('script[src*="chart.umd.min.js"]').replaceWith('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
  
  // Replace nav and footer, controls
  $('.navbar').replaceWith(navHtml);
  $('footer').replaceWith(footerHtml);
  
  // Controls div mapping (theme toggle)
  const controlsHtml = `
  <!-- Controls -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-3 pt-3 relative z-50">
    <button id="installBtn" class="hidden px-3 py-1.5 text-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Install App</button>
    <button id="themeToggle" class="px-3 py-1.5 text-base rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Toggle dark mode">🌓</button>
  </div>`;
  $('.container[style*="justify-content:flex-end"]').replaceWith(controlsHtml);

  // Body classes
  $('body').attr('class', 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans antialiased transition-colors duration-300');

  // Header styling
  $('header.page-header').removeClass('page-header container').addClass('py-12 md:py-16 text-center px-4 sm:px-6 lg:px-8');
  $('header h1').addClass('text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent');
  $('header p').addClass('text-lg text-slate-600 dark:text-slate-400');
  $('header h1').removeAttr('style');
  $('header p').removeAttr('style');
  $('header').wrapInner('<div class="max-w-3xl mx-auto"></div>');

  // Main wrapper
  $('main').addClass('max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24');
  
  // Clean up containers
  $('.container').removeClass('container');

  // Cards
  $('section.card, div.card').addClass('p-6 md:p-8 mb-8');

  // Rows -> Grids
  $('.row').each((i, el) => {
      const $row = $(el);
      $row.removeClass('row');
      $row.addClass('grid grid-cols-1 md:grid-cols-3 gap-6 mb-8');
      if ($row.hasClass('row-2')) {
          $row.removeClass('row-2');
      }
      $row.removeAttr('style');
  });

  // Inputs and Labels
  $('label').addClass('label-text flex items-center mb-1');
  $('input[type="number"], input[type="text"], select').addClass('input-field mb-4 w-full');
  
  // Actions
  $('.actions').addClass('flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800').removeClass('actions');
  $('button').each((i, el) => {
      const $btn = $(el);
      const id = $btn.attr('id');
      if (id === 'themeToggle' || id === 'installBtn' || $btn.closest('nav').length > 0 || $btn.closest('.actions').length === 0) return;
      
      $btn.addClass('flex-1 sm:flex-none');
      if ($btn.hasClass('ghost') || $btn.hasClass('secondary')) {
          $btn.removeClass('ghost secondary').addClass('btn-secondary');
      } else {
          $btn.addClass('btn-primary');
      }
      $btn.removeAttr('style');
  });

  // Tooltips
  $('.label-hint').each((i, el) => {
      const $hint = $(el);
      const tooltipText = $hint.find('.tooltip').text();
      const newHint = `
      <div class="group relative ml-2 cursor-help">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">?</span>
        <div class="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full">
          ${tooltipText}
        </div>
      </div>`;
      $hint.replaceWith(newHint);
  });

  // Sliders
  $('.slider-group').each((i, el) => {
      const $group = $(el);
      const $range = $group.find('input[type="range"]');
      const $val = $group.find('.slider-value');
      
      $range.addClass('w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600').removeAttr('style');
      $val.addClass('text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right').removeClass('slider-value').removeAttr('style');
      
      const newSlider = `
      <div class="flex items-center space-x-4">
        ${$range.prop('outerHTML')}
        ${$val.prop('outerHTML')}
      </div>`;
      $group.replaceWith(newSlider);
  });

  // Summary KPIs
  $('.summary').each((i, el) => {
      const $summary = $(el);
      $summary.addClass('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 mb-10').removeClass('summary').removeAttr('style');
      
      $summary.find('.kpi').each((j, kpi) => {
          const $kpi = $(kpi);
          const $label = $kpi.find('.label');
          const $val = $kpi.find('.value');
          
          $kpi.removeClass('kpi').addClass('flex flex-col space-y-1');
          $label.removeClass('label').addClass('text-sm font-medium text-slate-500 dark:text-slate-400');
          
          let textClass = 'text-2xl font-bold text-slate-900 dark:text-white';
          if ($val.hasClass('highlight')) textClass = 'text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400';
          if ($val.hasClass('success')) textClass = 'text-2xl font-bold text-teal-600 dark:text-teal-400';
          
          $val.removeClass('value highlight success').addClass(textClass);
      });
  });

  // Tables
  $('.table-container, .compare-table-wrap, .scroll-x').addClass('overflow-x-auto').removeClass('table-container compare-table-wrap scroll-x');
  $('table').addClass('w-full text-left border-collapse').removeClass('compare-table data-table');
  $('th').addClass('px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800').removeAttr('style');
  $('td').addClass('px-4 py-3 text-sm border-b border-slate-200 dark:border-slate-800').removeAttr('style');

  // Update active nav link
  $('nav a').removeClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white').addClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800').removeAttr('aria-current');
  const navLink = $(`nav a[href="./${page}"]`);
  navLink.removeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800')
         .addClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white')
         .attr('aria-current', 'page');
  const mobileNavLink = $(`#mobile-menu a[href="./${page}"]`);
  mobileNavLink.removeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800')
               .addClass('bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white');

  // Fix income-tax result banner
  $('#recommBanner').removeClass().addClass('bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 md:p-8 flex items-center gap-6 flex-wrap shadow-lg text-white mb-8').removeAttr('style');
  $('#recommText').removeAttr('style').addClass('text-2xl md:text-3xl font-extrabold mt-1');
  $('#savingsText').removeAttr('style').addClass('text-2xl md:text-3xl font-extrabold');

  // Any tip cards
  $('.tip-card').each((i, el) => {
    const $tip = $(el);
    const icon = $tip.find('.tip-icon').text();
    const tipH4 = $tip.find('h4').text();
    const tipP = $tip.find('p').html() || '';
    const newTip = `
      <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl p-5 mb-10 flex items-start gap-4">
        <div class="text-2xl">${icon}</div>
        <div>
          <h4 class="font-bold text-teal-800 dark:text-teal-300 mb-1">${tipH4}</h4>
          <p class="text-sm text-teal-700 dark:text-teal-400/80">
            ${tipP.replace(/style="[^"]*"/g, 'class="font-bold underline"')}
          </p>
        </div>
      </div>`;
    $tip.replaceWith(newTip);
  });

  fs.writeFileSync(filePath, $.html(), 'utf8');
  console.log('Updated HTML:', filePath);
}
