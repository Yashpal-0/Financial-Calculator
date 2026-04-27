import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { formatINR } from '../util.js';
import { calculateSSY } from '../finance.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './UI.js';
import { syncUrlState, getUrlState } from '../state.js';

const html = htm.bind(h);

const SSYCalculator = () => {
  // State for inputs
  const [yearlyDeposit, setYearlyDeposit] = useState(150000);
  const [depositTenure, setDepositTenure] = useState(15);
  const [annualRate, setAnnualRate] = useState(8.2);

  // Load from URL on mount
  useEffect(() => {
    const state = getUrlState();
    if (state.p) setYearlyDeposit(Number(state.p));
    if (state.t) setDepositTenure(Number(state.t));
    if (state.r) setAnnualRate(Number(state.r));
  }, []);

  // Sync to URL
  useEffect(() => {
    syncUrlState({
      p: yearlyDeposit,
      t: depositTenure,
      r: annualRate
    });
  }, [yearlyDeposit, depositTenure, annualRate]);

  // Calculations
  const results = useMemo(() => {
    if (yearlyDeposit <= 0 || annualRate < 0 || depositTenure <= 0) {
      return null;
    }
    return calculateSSY(yearlyDeposit, depositTenure, annualRate);
  }, [yearlyDeposit, depositTenure, annualRate]);

  const handleReset = () => {
    setYearlyDeposit(150000);
    setDepositTenure(15);
    setAnnualRate(8.2);
  };

  const donutData = useMemo(() => {
    if (!results) return null;
    return {
      labels: ['Total Investment', 'Total Interest'],
      datasets: [{
        data: [results.totalInvested, results.totalInterest],
        backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
        hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
        borderWidth: 0
      }]
    };
  }, [results]);

  const barData = useMemo(() => {
    if (!results) return null;
    return {
      labels: results.yearlyData.map(d => `Year ${d.year}`),
      datasets: [
        {
          label: 'Investment',
          data: results.yearlyData.map(d => d.cumInvested),
          backgroundColor: 'rgba(13,148,136,0.6)',
          borderColor: 'rgb(13,148,136)',
          borderWidth: 1
        },
        {
          label: 'Balance',
          data: results.yearlyData.map(d => d.balance),
          backgroundColor: 'rgba(8,145,178,0.6)',
          borderColor: 'rgb(8,145,178)',
          borderWidth: 1
        }
      ]
    };
  }, [results]);

  const donutOptions = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatINR(ctx.raw)}`
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatINR(value, 0)
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(ctx.raw)}`
        }
      }
    }
  };

  const kpiItems = results ? [
    { label: 'Total Investment', value: results.totalInvested, prefix: '₹' },
    { label: 'Total Interest', value: results.totalInterest, prefix: '₹' },
    { label: 'Maturity Value', value: results.maturity, prefix: '₹' }
  ] : [];

  return html`
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <${GlassCard} className="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <${Slider}
            label="Yearly Deposit"
            value=${yearlyDeposit}
            min=${250}
            max=${150000}
            step=${250}
            suffix="₹"
            onChange=${setYearlyDeposit}
          />
          <${Slider}
            label="Deposit Tenure"
            value=${depositTenure}
            min=${1}
            max=${15}
            step=${1}
            suffix="Yrs"
            onChange=${setDepositTenure}
          />
          <${Slider}
            label="Interest Rate"
            value=${annualRate}
            min=${1}
            max=${15}
            step=${0.1}
            suffix="%"
            onChange=${setAnnualRate}
          />
        </div>
        <div class="flex justify-end mt-4">
          <button class="text-sm text-slate-500 hover:text-teal-600 transition-colors" onClick=${handleReset}>
            Reset to Default
          </button>
        </div>
      <//>

      ${results && html`
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 class="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 text-center md:text-left">Maturity Overview</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div class="flex flex-col justify-center">
              <${ResultSummary} items=${kpiItems} />
              
              <div class="card p-6 bg-teal-50/50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/50">
                <p class="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">
                  By investing <strong>${formatINR(yearlyDeposit)}</strong> every year for <strong>${depositTenure} years</strong> at <strong>${annualRate}%</strong> interest, 
                  your total investment of <strong>${formatINR(results.totalInvested)}</strong> will grow to <strong>${formatINR(results.maturity)}</strong> after 21 years.
                </p>
              </div>
            </div>

            <${GlassCard} className="flex flex-col items-center justify-center">
              <div class="w-full max-w-[280px] mx-auto">
                <${VisualChart} 
                  type="doughnut" 
                  data=${donutData} 
                  options=${donutOptions} 
                  height=${280} 
                />
              </div>
              <div class="grid grid-cols-2 gap-4 w-full mt-6">
                <div class="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="w-3 h-3 rounded-full bg-teal-600 mr-2"></div>
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Investment</span>
                </div>
                <div class="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Interest</span>
                </div>
              </div>
            <//>
          </div>

          <${GlassCard} className="mb-10">
            <h3 class="text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100">Growth Projection (21 Years)</h3>
            <div class="h-[350px] w-full">
              <${VisualChart} 
                type="bar" 
                data=${barData} 
                options=${barOptions} 
              />
            </div>
          <//>
        </div>
      `}
    </div>
  `;
};

export default SSYCalculator;
