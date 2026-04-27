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
import { calculateEmi, baselineSchedule } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const BalanceTransferCalculator = () => {
  const initialState = getUrlState();
  
  const [outstanding, setOutstanding] = useState(Number(initialState.p) || 5000000);
  const [currRate, setCurrRate] = useState(Number(initialState.cr) || 9.0);
  const [currTenure, setCurrTenure] = useState(Number(initialState.n) || 180);
  const [newRate, setNewRate] = useState(Number(initialState.nr) || 8.4);
  const [processingFee, setProcessingFee] = useState(Number(initialState.pf) || 10000);
  const [otherCosts, setOtherCosts] = useState(Number(initialState.oc) || 0);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        p: outstanding,
        cr: currRate,
        n: currTenure,
        nr: newRate,
        pf: processingFee,
        oc: otherCosts
      });
    }, 500);
    debouncedSync();
  }, [outstanding, currRate, currTenure, newRate, processingFee, otherCosts]);

  const results = useMemo(() => {
    const currEmi = calculateEmi(outstanding, currRate, currTenure);
    const newEmi = calculateEmi(outstanding, newRate, currTenure);

    const { totalInterest: currTotalInterest } = baselineSchedule(outstanding, currRate, currTenure);
    const { totalInterest: newTotalInterest } = baselineSchedule(outstanding, newRate, currTenure);
    
    const interestSaved = Math.max(0, currTotalInterest - newTotalInterest);
    const totalCosts = processingFee + otherCosts;
    const netSavings = Math.max(0, interestSaved - totalCosts);

    return { 
      currEmi, 
      newEmi, 
      interestSaved, 
      totalCosts, 
      netSavings,
      currTotalInterest,
      newTotalInterest
    };
  }, [outstanding, currRate, currTenure, newRate, processingFee, otherCosts]);

  const kpiItems = [
    { label: 'Net Savings', value: results.netSavings, prefix: '₹', decimals: 0 },
    { label: 'Interest Saved', value: results.interestSaved, prefix: '₹', decimals: 0 },
    { label: 'Current EMI', value: results.currEmi, prefix: '₹', decimals: 0 },
    { label: 'New EMI', value: results.newEmi, prefix: '₹', decimals: 0 }
  ];

  const chartData = {
    labels: ['Net Savings', 'Total Costs'],
    datasets: [{
      data: [results.netSavings, results.totalCosts],
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

  const savingsBarData = {
    labels: ['Current Loan', 'New Loan'],
    datasets: [
      {
        label: 'Total Interest',
        data: [results.currTotalInterest, results.newTotalInterest],
        backgroundColor: ['#64748b', '#0d9488'],
        borderRadius: 8,
      }
    ]
  };

  const savingsBarOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Total Interest: ${formatINR(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '₹' + (value / 100000).toFixed(1) + 'L'
        }
      }
    }
  };

  return html`
    <${Layout}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Balance Transfer Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Compare your current loan with a new offer to see how much you can save.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1 space-y-6">
            <${GlassCard}>
              <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
                <span>🏦</span> Current Loan
              </h2>
              <${Slider} 
                label="Outstanding Principal" 
                value=${outstanding} 
                min=${100000} 
                max=${20000000} 
                step=${50000} 
                onChange=${setOutstanding} 
                suffix="₹" 
              />
              <${Slider} 
                label="Current Rate %" 
                value=${currRate} 
                min=${5} 
                max=${20} 
                step=${0.1} 
                onChange=${setCurrRate} 
                suffix="%" 
              />
              <${Slider} 
                label="Remaining Tenure" 
                value=${currTenure} 
                min=${12} 
                max=${360} 
                step=${1} 
                onChange=${setCurrTenure} 
                suffix="mo" 
              />
            <//>

            <${GlassCard}>
              <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
                <span>✨</span> New Offer
              </h2>
              <${Slider} 
                label="New Rate %" 
                value=${newRate} 
                min=${5} 
                max=${20} 
                step=${0.1} 
                onChange=${setNewRate} 
                suffix="%" 
              />
              <${Slider} 
                label="Processing Fee" 
                value=${processingFee} 
                min=${0} 
                max=${100000} 
                step=${500} 
                onChange=${setProcessingFee} 
                suffix="₹" 
              />
              <${Slider} 
                label="Other Costs" 
                value=${otherCosts} 
                min=${0} 
                max=${50000} 
                step=${500} 
                onChange=${setOtherCosts} 
                suffix="₹" 
              />
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4 text-center">Savings vs Costs</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${chartOptions} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4 text-center">Interest Comparison</h3>
                <${VisualChart} type="bar" data=${savingsBarData} options=${savingsBarOptions} height=${250} />
              <//>
            </div>

            <${GlassCard} className="bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/30">
              <h3 class="text-xl font-bold text-teal-900 dark:text-teal-300 mb-4">Net Savings Analysis</h3>
              <p class="text-slate-700 dark:text-slate-300 mb-4">
                By transferring your loan to a new lender at <strong>${newRate}%</strong>, you save 
                <span class="font-bold text-teal-600 dark:text-teal-400"> ${formatINR(results.interestSaved)}</span> in interest over the remaining 
                <strong> ${currTenure} months</strong>.
              </p>
              <p class="text-slate-700 dark:text-slate-300">
                After accounting for processing fees and other costs totaling <strong>${formatINR(results.totalCosts)}</strong>, 
                your net benefit is <span class="font-bold text-teal-600 dark:text-teal-400">${formatINR(results.netSavings)}</span>.
              </p>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderBalanceTransferApp = (container) => {
  render(html`<${BalanceTransferCalculator} />`, container);
};

// Auto-render if container exists
const container = document.getElementById('balance-transfer-app');
if (container) {
  renderBalanceTransferApp(container);
}
