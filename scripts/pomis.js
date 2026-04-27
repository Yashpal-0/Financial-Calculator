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
import { calculatePOMIS } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const POMISCalculator = () => {
  const initialState = getUrlState();
  
  const [deposit, setDeposit] = useState(Number(initialState.d) || 450000);
  const [rate, setRate] = useState(Number(initialState.r) || 7.4);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        d: deposit,
        r: rate
      });
    }, 500);
    debouncedSync();
  }, [deposit, rate]);

  const results = useMemo(() => {
    const { monthlyIncome } = calculatePOMIS(deposit, rate);
    const totalInterest = monthlyIncome * 12 * 5; // POMIS has a 5-year tenure
    
    return { 
      monthlyIncome, 
      totalInterest, 
      totalMaturity: deposit + totalInterest,
      tenure: 5
    };
  }, [deposit, rate]);

  const kpiItems = [
    { label: 'Monthly Income', value: results.monthlyIncome, prefix: '₹', decimals: 2 },
    { label: 'Total Interest', value: results.totalInterest, prefix: '₹', decimals: 0 },
    { label: 'Total Maturity', value: results.totalMaturity, prefix: '₹', decimals: 0 },
    { label: 'Tenure', value: results.tenure, suffix: ' Years' }
  ];

  const chartData = {
    labels: ['Principal', 'Total Interest'],
    datasets: [{
      data: [deposit, results.totalInterest],
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
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">POMIS Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Post Office Monthly Income Scheme (POMIS) helps you earn a fixed monthly income on your savings.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Deposit Amount" 
                value=${deposit} 
                min=${1000} 
                max=${1500000} 
                step=${1000} 
                onChange=${setDeposit} 
                suffix="₹" 
              />
              <${Slider} 
                label="Interest Rate" 
                value=${rate} 
                min=${1} 
                max=${15} 
                step=${0.1} 
                onChange=${setRate} 
                suffix="%" 
              />
              
              <div class="mt-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
                <p class="text-sm text-teal-800 dark:text-teal-300">
                  <strong>Note:</strong> The maximum investment limit for POMIS is ₹9 Lakh for a single account and ₹15 Lakh for a joint account.
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
                <h3 class="text-lg font-semibold mb-4">Monthly Income</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.monthlyIncome)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Your guaranteed monthly payout for 5 years.</p>
              <//>
            </div>

            <${GlassCard}>
              <h3 class="text-xl font-bold mb-4">About POMIS</h3>
              <div class="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                <p>The Post Office Monthly Income Scheme (POMIS) is a government-backed small savings scheme that allows investors to set aside a specific amount every month. Subsequently, interest is added to this investment at the applicable rate and paid out to the depositor(s) on a monthly basis.</p>
                <ul class="list-disc pl-5 space-y-2 mt-4">
                  <li><strong>Tenure:</strong> 5 Years</li>
                  <li><strong>Minimum Deposit:</strong> ₹1,000</li>
                  <li><strong>Maximum Deposit:</strong> ₹9 Lakh (Single) / ₹15 Lakh (Joint)</li>
                  <li><strong>Interest Payout:</strong> Monthly</li>
                  <li><strong>Taxability:</strong> Interest is taxable, but no TDS is deducted.</li>
                </ul>
              </div>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderPOMISApp = (container) => {
  render(html`<${POMISCalculator} />`, container);
};
