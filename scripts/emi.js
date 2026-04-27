import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { 
  GlassCard, 
  Slider, 
  ResultSummary, 
  AmortizationTable, 
  VisualChart 
} from './components/UI.js';
import { Layout } from './components/Layout.js';
import { calculateEmi, baselineSchedule } from './finance.js';
import { formatINR, saveCalculation } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const EMICalculator = () => {
  const initialState = getUrlState();
  
  const [loanAmount, setLoanAmount] = useState(Number(initialState.p) || 5000000);
  const [annualRate, setAnnualRate] = useState(Number(initialState.r) || 8.5);
  const [tenureMonths, setTenureMonths] = useState(Number(initialState.n) || 240);

  // Sync state to URL and localStorage
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        p: loanAmount,
        r: annualRate,
        n: tenureMonths
      });

      const emi = calculateEmi(loanAmount, annualRate, tenureMonths);
      saveCalculation({
        id: 'emi',
        name: 'EMI Calculator',
        summary: `EMI: ${formatINR(emi)} for ${loanAmount.toLocaleString('en-IN')}`,
        link: window.location.href
      });
    }, 1000);
    debouncedSync();
  }, [loanAmount, annualRate, tenureMonths]);

  const results = useMemo(() => {
    const emi = calculateEmi(loanAmount, annualRate, tenureMonths);
    const { totalInterest } = baselineSchedule(loanAmount, annualRate, tenureMonths);
    
    // Build detailed schedule for the table
    const r = (annualRate / 100) / 12;
    let principal = loanAmount;
    const schedule = [];
    for (let i = 1; i <= tenureMonths && principal > 0; i++) {
      const interest = principal * r;
      let principalPay = Math.min(emi - interest, principal);
      if (principalPay < 0) principalPay = 0;
      const opening = principal;
      principal = Math.max(0, principal - principalPay);
      schedule.push({ 
        month: `Month ${i}`, 
        principal: principalPay, 
        interest, 
        total: emi, 
        balance: principal 
      });
    }

    return { emi, totalInterest, totalPayment: loanAmount + totalInterest, schedule };
  }, [loanAmount, annualRate, tenureMonths]);

  const kpiItems = [
    { label: 'Monthly EMI', value: results.emi, suffix: '' },
    { label: 'Total Interest', value: results.totalInterest, suffix: '' },
    { label: 'Total Payment', value: results.totalPayment, suffix: '' },
    { label: 'Tenure', value: tenureMonths, suffix: ' mo' }
  ];

  const chartData = {
    labels: ['Principal', 'Interest'],
    datasets: [{
      data: [loanAmount, results.totalInterest],
      backgroundColor: ['#0d9488', '#0891b2'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    plugins: {
      legend: { position: 'bottom' }
    },
    cutout: '70%'
  };

  const handleExportCSV = () => {
    const header = ['Month', 'Principal', 'Interest', 'Total', 'Balance'];
    const lines = [header.join(',')];
    results.schedule.forEach(r => {
      lines.push([r.month, r.principal.toFixed(2), r.interest.toFixed(2), r.total.toFixed(2), r.balance.toFixed(2)].join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emi_schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return html`
    <${Layout}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">EMI Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Calculate your monthly loan repayments and see the total interest cost.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Loan Amount" 
                value=${loanAmount} 
                min=${100000} 
                max=${20000000} 
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
                label="Tenure" 
                value=${tenureMonths} 
                min=${12} 
                max=${360} 
                step=${12} 
                onChange=${setTenureMonths} 
                suffix="mo" 
              />
              
              <div class="mt-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
                <p class="text-sm text-teal-800 dark:text-teal-300">
                  <strong>Tip:</strong> Increasing your EMI by just 5% every year can reduce your tenure by several years!
                </p>
              </div>
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4">Breakdown</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${chartOptions} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col justify-center">
                <h3 class="text-lg font-semibold mb-4">Monthly Payment</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.emi)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Your estimated monthly installment for this loan.</p>
              <//>
            </div>

            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Amortization Schedule</h2>
              <button 
                onClick=${handleExportCSV}
                class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>Export CSV</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </button>
            </div>
            
            <${AmortizationTable} data=${results.schedule.slice(0, 120)} />
            ${results.schedule.length > 120 && html`
              <p class="text-center text-slate-500 mt-4 text-sm">Showing first 120 months of the schedule.</p>
            `}
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderEmiApp = (container) => {
  render(html`<${EMICalculator} />`, container);
};
