import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { formatINR, formatNum } from './util.js';
import { baselineSchedule, generateSchedule, buildPrepayInstances } from './finance.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './components/UI.js';
import { Layout } from './components/Layout.js';

const html = htm.bind(h);

const PrepaymentApp = () => {
  // --- State ---
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [annualRate, setAnnualRate] = useState(8.5);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [strategy, setStrategy] = useState('reduce_tenure');
  const [prepayments, setPrepayments] = useState([]);
  const [mfReturnRate, setMfReturnRate] = useState(12);

  // --- URL Sync ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('p')) setLoanAmount(Number(params.get('p')));
    if (params.has('r')) setAnnualRate(Number(params.get('r')));
    if (params.has('t')) setTenureMonths(Number(params.get('t')));
    if (params.has('s')) setStrategy(params.get('s'));
    if (params.has('mfr')) setMfReturnRate(Number(params.get('mfr')));
    if (params.has('pp')) {
      try {
        setPrepayments(JSON.parse(params.get('pp')));
      } catch (e) {
        console.error('Failed to parse prepayments from URL', e);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('p', loanAmount);
    params.set('r', annualRate);
    params.set('t', tenureMonths);
    params.set('s', strategy);
    params.set('mfr', mfReturnRate);
    if (prepayments.length > 0) {
      params.set('pp', JSON.stringify(prepayments));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [loanAmount, annualRate, tenureMonths, strategy, prepayments, mfReturnRate]);

  // --- Calculations ---
  const results = useMemo(() => {
    const prepayInstances = buildPrepayInstances(prepayments);
    const base = baselineSchedule(loanAmount, annualRate, tenureMonths);
    const { schedule, totalInterest, strategyEmi, strategyTenureMonths } = generateSchedule({
      principal: loanAmount,
      annualRatePercent: annualRate,
      tenureMonths: tenureMonths,
      prepayments: prepayInstances,
      strategy
    });

    const interestSaved = Math.max(0, base.totalInterest - totalInterest);
    const monthsSaved = Math.max(0, tenureMonths - strategyTenureMonths);
    const totalPaidBase = base.emi * tenureMonths;
    const totalPaidStrat = loanAmount + totalInterest;

    // Prepay vs Invest logic
    const prepayRows = schedule.filter(r => (r.prepayment || 0) > 0);
    const totalPrepaid = prepayRows.reduce((sum, r) => sum + (r.prepayment || 0), 0);
    const monthlyMfRate = mfReturnRate / 100 / 12;
    const lastMonth = schedule.length;

    const mfFV = totalPrepaid > 0
      ? prepayRows.reduce((sum, row) => {
          const monthsToGrow = Math.max(0, lastMonth - row.index + 1);
          return sum + row.prepayment * Math.pow(1 + monthlyMfRate, monthsToGrow);
        }, 0)
      : 0;

    return {
      base,
      schedule,
      totalInterest,
      strategyEmi,
      strategyTenureMonths,
      interestSaved,
      monthsSaved,
      totalPaidBase,
      totalPaidStrat,
      totalPrepaid,
      mfFV
    };
  }, [loanAmount, annualRate, tenureMonths, strategy, prepayments, mfReturnRate]);

  // --- Handlers ---
  const addPrepayment = () => {
    setPrepayments([...prepayments, { amount: 100000, frequency: 'once' }]);
  };

  const updatePrepayment = (index, field, value) => {
    const next = [...prepayments];
    next[index] = { ...next[index], [field]: value };
    setPrepayments(next);
  };

  const removePrepayment = (index) => {
    setPrepayments(prepayments.filter((_, i) => i !== index));
  };

  const exportCsv = () => {
    const header = ['Index', 'Month', 'Opening', 'EMI', 'Interest', 'Principal', 'Prepayment', 'Closing'];
    const lines = [header.join(',')];
    for (const r of results.schedule) {
      const row = [
        r.index,
        (r.monthLabel || `Month ${r.index}`),
        r.opening.toFixed(2),
        r.emi.toFixed(2),
        r.interest.toFixed(2),
        r.principal.toFixed(2),
        (r.prepayment || 0).toFixed(2),
        r.closing.toFixed(2)
      ];
      lines.push(row.join(','));
    }
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prepayment_schedule.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  };

  // --- Render Helpers ---
  const summaryItems = [
    { label: 'Interest Saved', value: results.interestSaved, suffix: '' },
    { label: 'Months Saved', value: results.monthsSaved, suffix: ' mo' },
    { label: 'New EMI', value: results.strategyEmi, suffix: '' },
    { label: 'Total Interest', value: results.totalInterest, suffix: '' }
  ];

  const chartData = {
    labels: ['Interest Paid', 'Interest Saved'],
    datasets: [{
      data: [results.totalInterest, results.interestSaved],
      backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
      hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
      borderWidth: 0
    }]
  };

  return html`
    <${Layout}>
      <header class="py-12 text-center px-4">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Prepayment Strategy</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Model one-time or recurring prepayments to save massive interest.</p>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 pb-24">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <${GlassCard}>
            <h2 class="text-xl font-bold mb-6">Loan Inputs</h2>
            <${Slider} label="Loan Amount" value=${loanAmount} min=${100000} max=${100000000} step=${100000} suffix="₹" onChange=${setLoanAmount} />
            <${Slider} label="Interest Rate" value=${annualRate} min=${1} max=${20} step=${0.1} suffix="%" onChange=${setAnnualRate} />
            <${Slider} label="Tenure" value=${tenureMonths} min=${12} max=${360} step=${1} suffix="mo" onChange=${setTenureMonths} />
          <//>

          <${GlassCard}>
            <h2 class="text-xl font-bold mb-6">Prepayment Options</h2>
            <div class="mb-6">
              <label class="label-text block mb-2">Strategy</label>
              <select class="input-field w-full" value=${strategy} onChange=${(e) => setStrategy(e.target.value)}>
                <option value="reduce_tenure">Reduce Tenure (Saves More)</option>
                <option value="reduce_emi">Reduce EMI (Better Cashflow)</option>
              </select>
            </div>
            
            <div class="space-y-4 mb-6">
              ${prepayments.map((pp, i) => html`
                <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                      <input type="number" class="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-teal-500 outline-none py-1" 
                        value=${pp.amount} onInput=${(e) => updatePrepayment(i, 'amount', Number(e.target.value))} />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Frequency</label>
                      <select class="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-teal-500 outline-none py-1"
                        value=${pp.frequency} onChange=${(e) => updatePrepayment(i, 'frequency', e.target.value)}>
                        <option value="once">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                  <button class="text-xs text-red-500 font-bold hover:underline" onClick=${() => removePrepayment(i)}>Remove</button>
                </div>
              `)}
            </div>
            
            <button class="btn-secondary w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-teal-500 hover:text-teal-500 transition-all" 
              onClick=${addPrepayment}>
              + Add Prepayment
            </button>
          <//>
        </div>

        <${ResultSummary} items=${summaryItems} />

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <${GlassCard} className="flex flex-col items-center justify-center">
            <h3 class="text-lg font-bold mb-4">Interest Distribution</h3>
            <${VisualChart} type="doughnut" data=${chartData} options=${{ cutout: '70%', plugins: { legend: { display: true, position: 'bottom' } } }} />
          <//>

          <${GlassCard}>
            <h3 class="text-lg font-bold mb-4">Prepay vs Invest</h3>
            <div class="mb-6">
              <${Slider} label="Assumed MF Return" value=${mfReturnRate} min=${1} max=${25} step=${0.5} suffix="%" onChange=${setMfReturnRate} />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                <p class="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase mb-1">Interest Saved</p>
                <p class="text-xl font-bold text-teal-700 dark:text-teal-300">${formatINR(results.interestSaved)}</p>
              </div>
              <div class="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800">
                <p class="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase mb-1">MF Projected Value</p>
                <p class="text-xl font-bold text-cyan-700 dark:text-cyan-300">${formatINR(results.mfFV)}</p>
              </div>
            </div>
            <p class="mt-4 text-xs text-slate-500 italic">
              ${results.totalPrepaid > 0 
                ? `Prepaying ₹${formatNum(results.totalPrepaid)} saves guaranteed interest. MF at ${mfReturnRate}% has market risk.`
                : 'Add prepayments to see comparison.'}
            </p>
          <//>
        </div>

        <${GlassCard}>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">Amortization Schedule</h2>
            <button class="btn-secondary text-sm px-4 py-2" onClick=${exportCsv}>Download CSV</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead>
                <tr class="text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th class="px-4 py-3">Month</th>
                  <th class="px-4 py-3 text-right">Opening</th>
                  <th class="px-4 py-3 text-right">EMI</th>
                  <th class="px-4 py-3 text-right">Interest</th>
                  <th class="px-4 py-3 text-right">Principal</th>
                  <th class="px-4 py-3 text-right">Prepaid</th>
                  <th class="px-4 py-3 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                ${results.schedule.slice(0, 120).map((row) => html`
                  <tr class="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td class="px-4 py-3 font-medium">${row.monthLabel || `Month ${row.index}`}</td>
                    <td class="px-4 py-3 text-right">${formatINR(row.opening)}</td>
                    <td class="px-4 py-3 text-right">${formatINR(row.emi)}</td>
                    <td class="px-4 py-3 text-right">${formatINR(row.interest)}</td>
                    <td class="px-4 py-3 text-right">${formatINR(row.principal)}</td>
                    <td class="px-4 py-3 text-right text-teal-600 dark:text-teal-400 font-bold">${row.prepayment > 0 ? formatINR(row.prepayment) : '-'}</td>
                    <td class="px-4 py-3 text-right font-semibold">${formatINR(row.closing)}</td>
                  </tr>
                `)}
                ${results.schedule.length > 120 && html`
                  <tr>
                    <td colspan="7" class="px-4 py-4 text-center text-slate-400 italic">... showing first 120 months ...</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        <//>
      </main>
    <//>
  `;
};

export const renderPrepaymentApp = (container) => {
  render(html`<${PrepaymentApp} />`, container);
};
