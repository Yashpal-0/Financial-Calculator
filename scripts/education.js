import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { 
  GlassCard, 
  Slider, 
  ResultSummary, 
  VisualChart 
} from './components/UI.js';
import { Layout } from './components/Layout.js';
import { generateEducationLoanSchedule, buildPrepayInstances, calculateSIPNeeded } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const EducationCalculator = () => {
  const initialState = getUrlState();
  
  const [loanAmount, setLoanAmount] = useState(Number(initialState.p) || 1000000);
  const [annualRate, setAnnualRate] = useState(Number(initialState.r) || 8.5);
  const [moratoriumMonths, setMoratoriumMonths] = useState(Number(initialState.m) || 24);
  const [repaymentMonths, setRepaymentMonths] = useState(Number(initialState.n) || 120);
  const [moratoriumInterest, setMoratoriumInterest] = useState(initialState.mi || 'capitalize');
  const [moratoriumPayment, setMoratoriumPayment] = useState(Number(initialState.mp) || 0);
  const [prepayments, setPrepayments] = useState(initialState.pp ? JSON.parse(initialState.pp) : []);
  const [planningYears, setPlanningYears] = useState(Number(initialState.py) || 5);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        p: loanAmount,
        r: annualRate,
        m: moratoriumMonths,
        n: repaymentMonths,
        mi: moratoriumInterest,
        mp: moratoriumPayment,
        pp: JSON.stringify(prepayments),
        py: planningYears
      });
    }, 500);
    debouncedSync();
  }, [loanAmount, annualRate, moratoriumMonths, repaymentMonths, moratoriumInterest, moratoriumPayment, prepayments, planningYears]);

  const results = useMemo(() => {
    const prepayInstances = buildPrepayInstances(prepayments);
    return generateEducationLoanSchedule({
      principal: loanAmount,
      annualRatePercent: annualRate,
      moratoriumMonths,
      repaymentMonths,
      moratoriumInterest,
      moratoriumPayment,
      prepayments: prepayInstances
    });
  }, [loanAmount, annualRate, moratoriumMonths, repaymentMonths, moratoriumInterest, moratoriumPayment, prepayments]);

  const sipNeeded = useMemo(() => {
    return calculateSIPNeeded(loanAmount, 12, planningYears * 12);
  }, [loanAmount, planningYears]);

  const kpiItems = [
    { label: 'EMI (Post-Moratorium)', value: results.emi, suffix: '' },
    { label: 'Total Paid', value: results.totalInterest + loanAmount, suffix: '' },
    { label: 'Total Interest', value: results.totalInterest, suffix: '' },
    { label: 'Moratorium Interest', value: results.moratoriumInterestAccrued, suffix: '' }
  ];

  const chartData = {
    labels: ['Principal', 'Interest'],
    datasets: [{
      data: [loanAmount, results.totalInterest],
      backgroundColor: ['#0d9488', '#0891b2'],
      borderWidth: 0
    }]
  };

  const addPrepayment = () => {
    setPrepayments([...prepayments, { amount: 50000, frequency: 'once' }]);
  };

  const updatePrepayment = (index, field, value) => {
    const updated = [...prepayments];
    updated[index][field] = value;
    setPrepayments(updated);
  };

  const removePrepayment = (index) => {
    setPrepayments(prepayments.filter((_, i) => i !== index));
  };

  const handleExportCSV = () => {
    const header = ['Index','Period','Opening','Payment','Interest','Principal','Prepayment','Closing'];
    const lines = [header.join(',')];
    results.schedule.forEach(r => {
      lines.push([
        r.index,
        r.periodLabel,
        r.opening.toFixed(2),
        r.payment.toFixed(2),
        r.interest.toFixed(2),
        r.principal.toFixed(2),
        (r.prepayment||0).toFixed(2),
        r.closing.toFixed(2)
      ].join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'education_loan_schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return html`
    <${Layout}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">🎓 Education Loan</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Calculate education loan EMI with moratorium periods and study payments.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Loan Amount" 
                value=${loanAmount} 
                min=${100000} 
                max=${10000000} 
                step=${50000} 
                onChange=${setLoanAmount} 
                suffix="₹" 
              />
              <${Slider} 
                label="Interest Rate" 
                value=${annualRate} 
                min=${5} 
                max=${20} 
                step=${0.1} 
                onChange=${setAnnualRate} 
                suffix="%" 
              />
              <${Slider} 
                label="Moratorium (months)" 
                value=${moratoriumMonths} 
                min=${0} 
                max=${72} 
                step=${1} 
                onChange=${setMoratoriumMonths} 
                suffix="mo" 
              />
              <${Slider} 
                label="Repayment (months)" 
                value=${repaymentMonths} 
                min=${12} 
                max=${180} 
                step=${12} 
                onChange=${setRepaymentMonths} 
                suffix="mo" 
              />

              <div class="mb-6">
                <label class="label-text mb-2 block">Interest during moratorium</label>
                <select 
                  class="input-field w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                  value=${moratoriumInterest} 
                  onChange=${(e) => setMoratoriumInterest(e.target.value)}
                >
                  <option value="capitalize">Capitalize (add to principal)</option>
                  <option value="pay">Pay monthly</option>
                  <option value="partial">Pay partial (50%)</option>
                </select>
              </div>

              ${(moratoriumInterest === 'pay' || moratoriumInterest === 'partial') && html`
                <${Slider} 
                  label="Monthly payment" 
                  value=${moratoriumPayment} 
                  min=${0} 
                  max=${50000} 
                  step=${500} 
                  onChange=${setMoratoriumPayment} 
                  suffix="₹" 
                />
              `}

              <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="font-bold text-slate-900 dark:text-white">Prepayments</h3>
                  <button onClick=${addPrepayment} class="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">+ Add</button>
                </div>
                ${prepayments.map((pp, index) => html`
                  <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 relative group">
                    <button onClick=${() => removePrepayment(index)} class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Amount</label>
                        <input 
                          type="number"
                          class="w-full bg-transparent border-b border-slate-200 dark:border-slate-600 focus:border-teal-500 outline-none text-sm font-semibold py-1"
                          value=${pp.amount}
                          onInput=${(e) => updatePrepayment(index, 'amount', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label class="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Freq</label>
                        <select 
                          class="w-full bg-transparent border-b border-slate-200 dark:border-slate-600 focus:border-teal-500 outline-none text-sm font-semibold py-1"
                          value=${pp.frequency}
                          onChange=${(e) => updatePrepayment(index, 'frequency', e.target.value)}
                        >
                          <option value="once">Once</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4">Breakdown</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${{ plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col justify-center">
                <h3 class="text-lg font-semibold mb-4">Monthly EMI</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.emi)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Estimated monthly installment after moratorium.</p>
                <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Principal at Start:</span>
                    <span class="font-semibold text-slate-900 dark:text-white">${formatINR(results.principalAtStart)}</span>
                  </div>
                  <div class="flex justify-between text-sm mt-1">
                    <span class="text-slate-500">Total Tenure:</span>
                    <span class="font-semibold text-slate-900 dark:text-white">${results.totalTenure} months</span>
                  </div>
                </div>
              <//>
            </div>

            <${GlassCard} className="mb-8 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-100 dark:border-teal-800/30">
              <h3 class="text-xl font-bold text-teal-800 dark:text-teal-300 mb-4 flex items-center gap-2">
                <span>💡</span> Savings Alternative
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p class="text-slate-600 dark:text-slate-400 mb-4">
                    Instead of a loan, if you saved for the same amount over a few years at 12% return:
                  </p>
                  <${Slider} 
                    label="Planning Period" 
                    value=${planningYears} 
                    min=${1} 
                    max=${15} 
                    step=${1} 
                    onChange=${setPlanningYears} 
                    suffix="years" 
                  />
                </div>
                <div class="text-center p-6 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-sm border border-teal-100 dark:border-teal-800/30">
                  <p class="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Monthly SIP Needed</p>
                  <div class="text-4xl font-black text-teal-600 dark:text-teal-400 mb-2">
                    ${formatINR(sipNeeded)}
                  </div>
                  <p class="text-xs text-slate-400">To reach ₹${loanAmount.toLocaleString('en-IN')} in ${planningYears} years @ 12%</p>
                </div>
              </div>
            <//>

            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Payment Schedule</h2>
              <button 
                onClick=${handleExportCSV}
                class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>Export CSV</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </button>
            </div>
            
            <div class="table-container mt-8 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table class="data-table w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-900/50">
                    <th class="text-left p-3">#</th>
                    <th class="text-left p-3">Period</th>
                    <th class="text-right p-3">Opening</th>
                    <th class="text-right p-3">Payment</th>
                    <th class="text-right p-3">Interest</th>
                    <th class="text-right p-3">Principal</th>
                    <th class="text-right p-3">Prepaid</th>
                    <th class="text-right p-3">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  ${results.schedule.slice(0, 120).map((row) => html`
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800">
                      <td class="text-left p-3 text-xs text-slate-400">${row.index}</td>
                      <td class="text-left p-3 font-medium">${row.periodLabel}</td>
                      <td class="text-right p-3">${row.opening.toLocaleString('en-IN')}</td>
                      <td class="text-right p-3">${row.payment.toLocaleString('en-IN')}</td>
                      <td class="text-right p-3">${row.interest.toLocaleString('en-IN')}</td>
                      <td class="text-right p-3">${row.principal.toLocaleString('en-IN')}</td>
                      <td class="text-right p-3">${row.prepayment ? row.prepayment.toLocaleString('en-IN') : '-'}</td>
                      <td class="text-right p-3 font-bold text-teal-600 dark:text-teal-400">${row.closing.toLocaleString('en-IN')}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
            ${results.schedule.length > 120 && html`
              <p class="text-center text-slate-500 mt-4 text-sm">Showing first 120 months of the schedule.</p>
            `}
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderEducationApp = (container) => {
  render(html`<${EducationCalculator} />`, container);
};
