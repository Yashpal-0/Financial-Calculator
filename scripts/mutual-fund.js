/**
 * Mutual Fund Returns calculator: SIP + Lumpsum with CAGR and tax (LTCG/STCG).
 * WHY: Single unified calculator for MF-style returns with Indian tax estimates.
 */
import { formatINR, formatNum } from './util.js';
import { calculateSIP, calculateLumpsum, calculateCAGR, equityLTCGTax, equitySTCGTax } from './finance.js';

function getEl(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text;
}

function showSection(id, show) {
  const el = getEl(id);
  if (el) el.style.display = show ? '' : 'none';
}

function onCalculate() {
  const mode = getEl('mfCalcMode')?.value || 'both';
  const holdingYears = parseFloat(getEl('mfHoldingYears')?.value || '') || null;

  if (mode === 'sip' || mode === 'both') {
    calcSIP(holdingYears);
  } else {
    hideSipResults();
  }

  if (mode === 'lumpsum' || mode === 'both') {
    calcLumpsum(holdingYears);
  } else {
    hideLumpResults();
  }
}

function calcSIP(holdingYearsOverride) {
  const monthly = Number(getEl('mfMonthly')?.value || '0');
  const rate = Number(getEl('mfRate')?.value || '0');
  const years = Number(getEl('mfYears')?.value || '0');

  if (!(monthly > 0 && rate >= 0 && years > 0)) {
    hideSipResults();
    return;
  }

  const months = years * 12;
  const fv = calculateSIP(monthly, rate, months);
  const invested = monthly * months;
  const gains = fv - invested;
  const holdingYears = holdingYearsOverride ?? years;
  const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
  const postTax = fv - tax;

  setText('mfSipInvested', formatINR(invested));
  setText('mfSipFV', formatINR(fv));
  setText('mfSipGains', formatINR(gains));
  setText('mfSipCAGR', formatNum(rate, 2) + '% (expected)');
  setText('mfSipTax', formatINR(tax));
  setText('mfSipPostTax', formatINR(postTax));
  showSection('mfSipSection', true);
}

function hideSipResults() {
  ['mfSipInvested', 'mfSipFV', 'mfSipGains', 'mfSipCAGR', 'mfSipTax', 'mfSipPostTax'].forEach(id => setText(id, '-'));
  showSection('mfSipSection', false);
}

function calcLumpsum(holdingYearsOverride) {
  const lumpsum = Number(getEl('mfLumpsum')?.value || '0');
  const rate = Number(getEl('mfLumpRate')?.value || '0');
  const years = Number(getEl('mfLumpYears')?.value || '0');

  if (!(lumpsum > 0 && rate >= 0 && years > 0)) {
    hideLumpResults();
    return;
  }

  const fv = calculateLumpsum(lumpsum, rate, years, 1);
  const gains = fv - lumpsum;
  const holdingYears = holdingYearsOverride ?? years;
  const cagr = (years > 0 && lumpsum > 0) ? calculateCAGR(lumpsum, fv, years) * 100 : 0;
  const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
  const postTax = fv - tax;

  setText('mfLumpInvested', formatINR(lumpsum));
  setText('mfLumpFV', formatINR(fv));
  setText('mfLumpGains', formatINR(gains));
  setText('mfLumpCAGR', formatNum(cagr, 2) + '%');
  setText('mfLumpTax', formatINR(tax));
  setText('mfLumpPostTax', formatINR(postTax));
  showSection('mfLumpSection', true);
}

function hideLumpResults() {
  ['mfLumpInvested', 'mfLumpFV', 'mfLumpGains', 'mfLumpCAGR', 'mfLumpTax', 'mfLumpPostTax'].forEach(id => setText(id, '-'));
  showSection('mfLumpSection', false);
}

function onReset() {
  getEl('mfMonthly').value = '';
  getEl('mfRate').value = '';
  getEl('mfYears').value = '';
  getEl('mfLumpsum').value = '';
  getEl('mfLumpRate').value = '';
  getEl('mfLumpYears').value = '';
  getEl('mfHoldingYears').value = '';
  getEl('mfCalcMode').value = 'both';
  hideSipResults();
  hideLumpResults();
}

getEl('mfCalcBtn')?.addEventListener('click', onCalculate);
getEl('mfResetBtn')?.addEventListener('click', onReset);
