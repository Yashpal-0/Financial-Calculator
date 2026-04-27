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
import { calculateCAGR } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const CAGRCalculator = () => {
  const initialState = getUrlState();
  
  const [startValue, setStartValue] = useState(Number(initialState.sv) || 100000);
  const [endValue, setEndValue] = useState(Number(initialState.ev) || 200000);
  const [years, setYears] = useState(Number(initialState.y) || 5);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        sv: startValue,
        ev: endValue,
        y: years
      });
    }, 500);
    debouncedSync();
  }, [startValue, endValue, years]);

  const results = useMemo(() => {
    const cagr = calculateCAGR(startValue, endValue, years);
    const absoluteReturn = endValue - startValue;
    const absoluteReturnPercent = startValue > 0 ? (absoluteReturn / startValue) * 100 : 0;
    
    return { 
      cagr: cagr * 100, 
      absoluteReturn, 
      absoluteReturnPercent 
    };
  }, [startValue, endValue, years]);

  const kpiItems = [
    { label: 'CAGR', value: results.cagr, suffix: '%', decimals: 2 },
    { label: 'Absolute Return', value: results.absoluteReturnPercent, suffix: '%', decimals: 2 },
    { label: 'Total Gain', value: results.absoluteReturn, prefix: '₹', decimals: 0 },
    { label: 'Period', value: years, suffix: ' yr', decimals: 1 }
  ];

  const chartData = {
    labels: ['Start Value', 'Total Gain'],
    datasets: [{
      data: [startValue, Math.max(0, results.absoluteReturn)],
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
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">CAGR Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Compound Annual Growth Rate helps you understand the smoothed annual return of an investment over time.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Initial Investment" 
                value=${startValue} 
                min=${1000} 
                max=${10000000} 
                step=${1000} 
                onChange=${setStartValue} 
                suffix="₹" 
              />
              <${Slider} 
                label="Final Value" 
                value=${endValue} 
                min=${1000} 
                max=${20000000} 
                step=${1000} 
                onChange=${setEndValue} 
                suffix="₹" 
              />
              <${Slider} 
                label="Duration (Years)" 
                value=${years} 
                min=${1} 
                max=${40} 
                step=${0.5} 
                onChange=${setYears} 
                suffix="yr" 
              />
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
                <h3 class="text-lg font-semibold mb-4">Annualized Return</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${results.cagr.toFixed(2)}%
                </div>
                <p class="text-slate-500 dark:text-slate-400">This is your Compound Annual Growth Rate (CAGR).</p>
              <//>
            </div>

            <${GlassCard}>
              <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">What is CAGR?</h3>
              <p class="text-slate-600 dark:text-slate-400 mb-4">
                CAGR is the rate of return that would be required for an investment to grow from its beginning balance to its ending balance, assuming the profits were reinvested at the end of each year of the investment's lifespan.
              </p>
              <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p class="text-sm font-mono text-slate-700 dark:text-slate-300">
                  Formula: [(End Value / Start Value) ^ (1 / Years)] - 1
                </p>
              </div>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderCAGRApp = (container) => {
  render(html`<${CAGRCalculator} />`, container);
};
