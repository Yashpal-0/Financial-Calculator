import { collectInputs, validateInputs, renderSummary, renderSchedule, addPrepaymentUI, exportCsv } from './ui.js';
import { baselineSchedule, generateSchedule } from './finance.js';

function onCalculate() {
  const { P, rate, tenure, startDate, emiDay, strategy, recalcOnPrepay, prepayInstances } = collectInputs();
  const errors = validateInputs(P, rate, tenure);
  if (errors.length) { alert(errors.join('\n')); return; }

  const base = baselineSchedule(P, rate, tenure, startDate, emiDay);
  const { schedule, totalInterest, strategyEmi } = generateSchedule({
    principal: P,
    annualRatePercent: rate,
    tenureMonths: tenure,
    startDate,
    emiDay,
    prepayments: prepayInstances,
    strategy,
    recalcOnPrepay
  });

  renderSummary(base, { totalInterest, strategyEmi }, tenure, schedule.length);
  renderSchedule(schedule);
  window.__lastSchedule = schedule;
}

function onExportCsv() {
  const sched = window.__lastSchedule || [];
  if (!sched.length) { alert('Please calculate first.'); return; }
  exportCsv(sched);
}

function onPrint() { window.print(); }

// Bind events after DOM ready
document.getElementById('calcBtn').addEventListener('click', onCalculate);
document.getElementById('exportCsvBtn').addEventListener('click', onExportCsv);
document.getElementById('printBtn').addEventListener('click', onPrint);
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('loanAmount').value = '';
  document.getElementById('annualRate').value = '';
  document.getElementById('tenureMonths').value = '';
  document.getElementById('startDate').valueAsDate = new Date();
  document.getElementById('emiDay').value = '15';
  document.getElementById('strategy').value = 'reduce_tenure';
  document.getElementById('recalcOnPrepay').value = 'yes';
  document.getElementById('prepayList').innerHTML = '';
  renderSummary({emi:0,totalInterest:0},{strategyEmi:0,totalInterest:0},0,0);
  renderSchedule([]);
});
document.getElementById('addPrepayBtn').addEventListener('click', () => addPrepaymentUI());
document.getElementById('clearPrepayBtn').addEventListener('click', () => { document.getElementById('prepayList').innerHTML = ''; });

// Defaults
document.getElementById('startDate').valueAsDate = new Date();
document.getElementById('loanAmount').value = '5000000';
document.getElementById('annualRate').value = '8.5';
document.getElementById('tenureMonths').value = '240';


