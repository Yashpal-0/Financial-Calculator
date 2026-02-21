import { collectInputs, validateInputs, renderSummary, renderSchedule, addPrepaymentUI, exportCsv, renderPrepayVsInvest } from './ui.js';
import { baselineSchedule, generateSchedule } from './finance.js';

function onCalculate() {
  const { P, rate, tenure, startDate, emiDay, strategy, prepayInstances } = collectInputs();
  const errors = validateInputs(P, rate, tenure);
  if (errors.length) { alert(errors.join('\n')); return; }

  const base = baselineSchedule(P, rate, tenure);
  const { schedule, totalInterest, strategyEmi } = generateSchedule({
    principal: P,
    annualRatePercent: rate,
    tenureMonths: tenure,
    prepayments: prepayInstances,
    strategy
  });

  const interestSaved = base.totalInterest - totalInterest;
  renderSummary(P, base, { totalInterest, strategyEmi }, tenure, schedule.length);
  renderSchedule(schedule);
  renderPrepayVsInvest(schedule, interestSaved, rate, tenure - schedule.length);
  window.__lastSchedule = schedule;
  window.__lastInterestSaved = interestSaved;
  window.__lastLoanRate = rate;
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
  document.getElementById('strategy').value = 'reduce_tenure';
  document.getElementById('prepayList').innerHTML = '';
  if (document.getElementById('prepayVsInvestRate')) document.getElementById('prepayVsInvestRate').value = '12';
  renderSummary(0, { emi: 0, totalInterest: 0 }, { strategyEmi: 0, totalInterest: 0 }, 0, 0);
  renderSchedule([]);
  if (typeof renderPrepayVsInvest === 'function') renderPrepayVsInvest([], 0, 0, 0);
});
document.getElementById('addPrepayBtn').addEventListener('click', () => addPrepaymentUI());
document.getElementById('clearPrepayBtn').addEventListener('click', () => { document.getElementById('prepayList').innerHTML = ''; });

const mfRateInput = document.getElementById('prepayVsInvestRate');
if (mfRateInput) {
  mfRateInput.addEventListener('input', () => {
    const sched = window.__lastSchedule || [];
    if (sched.length && typeof renderPrepayVsInvest === 'function') {
      const tenure = parseInt(document.getElementById('tenureMonths').value, 10) || 0;
      renderPrepayVsInvest(sched, window.__lastInterestSaved ?? 0, window.__lastLoanRate ?? 0, tenure - sched.length);
    }
  });
}

// Defaults
document.getElementById('loanAmount').value = '5000000';
document.getElementById('annualRate').value = '8.5';
document.getElementById('tenureMonths').value = '240';


