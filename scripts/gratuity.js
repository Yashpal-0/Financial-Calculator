import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { 
  GlassCard, 
  Slider, 
  ResultSummary 
} from './components/UI.js';
import { Layout } from './components/Layout.js';
import { calculateGratuity } from './finance.js';
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const GratuityCalculator = () => {
  const initialState = getUrlState();
  
  const [salary, setSalary] = useState(Number(initialState.s) || 50000);
  const [tenure, setTenure] = useState(Number(initialState.t) || 5);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        s: salary,
        t: tenure
      });
    }, 500);
    debouncedSync();
  }, [salary, tenure]);

  const results = useMemo(() => {
    return calculateGratuity(salary, tenure);
  }, [salary, tenure]);

  const kpiItems = [
    { label: 'Gratuity Amount', value: results.gratuity, prefix: '₹', decimals: 0 },
    { label: 'Monthly Salary', value: salary, prefix: '₹', decimals: 0 },
    { label: 'Tenure', value: tenure, suffix: ' Years', decimals: 0 }
  ];

  return html`
    <${Layout}>
      <div class="max-w-4xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Gratuity Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Estimate the gratuity amount you are eligible for based on your salary and years of service.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Last Drawn Salary (Basic + DA)" 
                value=${salary} 
                min=${10000} 
                max=${1000000} 
                step=${5000} 
                onChange=${setSalary} 
                suffix="₹" 
              />
              <${Slider} 
                label="Tenure (Years)" 
                value=${tenure} 
                min=${1} 
                max=${50} 
                step=${1} 
                onChange=${setTenure} 
                suffix="Y" 
              />
              
              <div class="mt-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
                <p class="text-sm text-teal-800 dark:text-teal-300">
                  <strong>Note:</strong> Gratuity is usually payable after 5 years of continuous service. The formula used is (15/26) * Last Drawn Salary * Tenure.
                </p>
              </div>
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <${GlassCard} className="flex flex-col justify-center text-center py-12">
              <h3 class="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Estimated Gratuity Amount</h3>
              <div class="text-6xl font-black text-teal-600 dark:text-teal-400 mb-4">
                ${formatINR(results.gratuity, 0)}
              </div>
              <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                This is the approximate amount you would receive at the end of your tenure.
              </p>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderGratuityApp = (container) => {
  render(html`<${GratuityCalculator} />`, container);
};
