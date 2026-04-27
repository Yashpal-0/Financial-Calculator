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
import { calculateFD } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const FDCalculator = () => {
  const initialState = getUrlState();
  
  const [fdAmount, setFdAmount] = useState(Number(initialState.p) || 100000);
  const [annualRate, setAnnualRate] = useState(Number(initialState.r) || 7.5);
  const [tenureMonths, setTenureMonths] = useState(Number(initialState.n) || 12);
  const [compoundFreq, setCompoundFreq] = useState(initialState.f || 'quarterly');

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        p: fdAmount,
        r: annualRate,
        n: tenureMonths,
        f: compoundFreq
      });
    }, 500);
    debouncedSync();
  }, [fdAmount, annualRate, tenureMonths, compoundFreq]);

  const results = useMemo(() => {
    const maturity = calculateFD(fdAmount, annualRate, tenureMonths, compoundFreq);
    const interest = maturity - fdAmount;
    return { maturity, interest };
  }, [fdAmount, annualRate, tenureMonths, compoundFreq]);

  const kpiItems = [
    { label: 'Principal Amount', value: fdAmount, suffix: '' },
    { label: 'Interest Earned', value: results.interest, suffix: '' },
    { label: 'Maturity Value', value: results.maturity, suffix: '' },
    { label: 'Tenure', value: tenureMonths, suffix: ' mo' }
  ];

  const chartData = {
    labels: ['Principal', 'Interest'],
    datasets: [{
      data: [fdAmount, results.interest],
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

  return html`
    <${Layout}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Fixed Deposit (FD)</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Plan secure investments with compounded interest calculations.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Total Deposit" 
                value=${fdAmount} 
                min=${1000} 
                max=${10000000} 
                step=${1000} 
                onChange=${setFdAmount} 
                suffix="₹" 
              />
              <${Slider} 
                label="Interest Rate (p.a)" 
                value=${annualRate} 
                min=${1} 
                max=${15} 
                step=${0.1} 
                onChange=${setAnnualRate} 
                suffix="%" 
              />
              <${Slider} 
                label="Tenure (Months)" 
                value=${tenureMonths} 
                min=${1} 
                max=${120} 
                step=${1} 
                onChange=${setTenureMonths} 
                suffix="mo" 
              />
              
              <div class="mb-6">
                <label class="label-text">Compounding Frequency</label>
                <select 
                  class="input-field" 
                  value=${compoundFreq} 
                  onChange=${(e) => setCompoundFreq(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div class="mt-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
                <p class="text-sm text-teal-800 dark:text-teal-300">
                  <strong>Note:</strong> Most banks in India compound interest quarterly for Fixed Deposits.
                </p>
              </div>
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4">Investment Breakdown</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${chartOptions} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col justify-center">
                <h3 class="text-lg font-semibold mb-4">Maturity Value</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.maturity)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Total amount you will receive at the end of the tenure.</p>
              <//>
            </div>

            <${GlassCard}>
              <h3 class="text-lg font-semibold mb-4">Why Fixed Deposits?</h3>
              <ul class="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-teal-500">✔</span>
                  <span><strong>Guaranteed Returns:</strong> Unlike market-linked investments, FD returns are fixed at the time of deposit.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-500">✔</span>
                  <span><strong>Flexible Tenure:</strong> Choose from 7 days to 10 years based on your goals.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-500">✔</span>
                  <span><span><strong>Liquidity:</strong> Most FDs allow premature withdrawal (with a small penalty).</span></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-500">✔</span>
                  <span><strong>Tax Benefits:</strong> 5-year Tax Saving FDs offer deductions under Section 80C.</span>
                </li>
              </ul>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderFDApp = (container) => {
  render(html`<${FDCalculator} />`, container);
};
