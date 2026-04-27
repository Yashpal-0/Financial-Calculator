import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { formatINR } from '../util.js';
import { calculateRD } from '../finance.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './UI.js';
import { syncUrlState, getUrlState } from '../state.js';

const html = htm.bind(h);

const RDCalculator = () => {
  // State for inputs
  const [monthlyDeposit, setMonthlyDeposit] = useState(5000);
  const [annualRate, setAnnualRate] = useState(6.5);
  const [tenureMonths, setTenureMonths] = useState(60);

  // Load from URL on mount
  useEffect(() => {
    const state = getUrlState();
    if (state.p) setMonthlyDeposit(Number(state.p));
    if (state.r) setAnnualRate(Number(state.r));
    if (state.t) setTenureMonths(Number(state.t));
  }, []);

  // Sync to URL
  useEffect(() => {
    syncUrlState({
      p: monthlyDeposit,
      r: annualRate,
      t: tenureMonths
    });
  }, [monthlyDeposit, annualRate, tenureMonths]);

  // Calculations
  const results = useMemo(() => {
    if (monthlyDeposit <= 0 || annualRate < 0 || tenureMonths <= 0) {
      return null;
    }
    const maturity = calculateRD(monthlyDeposit, annualRate, tenureMonths);
    const invested = monthlyDeposit * tenureMonths;
    const interest = maturity - invested;
    return { maturity, invested, interest };
  }, [monthlyDeposit, annualRate, tenureMonths]);

  const handleReset = () => {
    setMonthlyDeposit(5000);
    setAnnualRate(6.5);
    setTenureMonths(60);
  };

  const chartData = useMemo(() => {
    if (!results) return null;
    return {
      labels: ['Total Deposits', 'Total Interest'],
      datasets: [{
        data: [results.invested, results.interest],
        backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
        hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
        borderWidth: 0
      }]
    };
  }, [results]);

  const chartOptions = {
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

  const kpiItems = results ? [
    { label: 'Total Deposited', value: results.invested },
    { label: 'Interest Earned', value: results.interest },
    { label: 'Maturity Value', value: results.maturity }
  ] : [];

  return html`
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <${GlassCard} className="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <${Slider}
            label="Monthly Deposit"
            value=${monthlyDeposit}
            min=${500}
            max=${100000}
            step=${500}
            suffix="₹"
            onChange=${setMonthlyDeposit}
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
          <${Slider}
            label="Tenure (Months)"
            value=${tenureMonths}
            min=${6}
            max=${120}
            step=${1}
            suffix="Mo"
            onChange=${setTenureMonths}
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
                  By investing <strong>${formatINR(monthlyDeposit)}</strong> every month for <strong>${tenureMonths} months</strong> at <strong>${annualRate}%</strong> interest, 
                  your total investment of <strong>${formatINR(results.invested)}</strong> will grow to <strong>${formatINR(results.maturity)}</strong>.
                </p>
              </div>
            </div>

            <${GlassCard} className="flex flex-col items-center justify-center">
              <div class="w-full max-w-[280px] mx-auto">
                <${VisualChart} 
                  type="doughnut" 
                  data=${chartData} 
                  options=${chartOptions} 
                  height=${280} 
                />
              </div>
              <div class="grid grid-cols-2 gap-4 w-full mt-6">
                <div class="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="w-3 h-3 rounded-full bg-teal-600 mr-2"></div>
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Deposits</span>
                </div>
                <div class="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Interest</span>
                </div>
              </div>
            <//>
          </div>
        </div>
      `}
    </div>
  `;
};

export default RDCalculator;
