import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { formatINR } from '../util.js';
import { calculateGST } from '../finance.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './UI.js';
import { Layout } from './Layout.js';
import { syncUrlState, getUrlState } from '../state.js';

const html = htm.bind(h);

const GSTCalculator = () => {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(18);
  const [type, setType] = useState('exclusive');

  useEffect(() => {
    const state = getUrlState();
    if (state.a) setAmount(Number(state.a));
    if (state.r) setRate(Number(state.r));
    if (state.t) setType(state.t);
  }, []);

  useEffect(() => {
    syncUrlState({
      a: amount,
      r: rate,
      t: type
    });
  }, [amount, rate, type]);

  const results = useMemo(() => {
    return calculateGST(amount, rate, type);
  }, [amount, rate, type]);

  const chartData = useMemo(() => {
    return {
      labels: ['Net Amount', 'GST Amount'],
      datasets: [{
        data: [results.netAmount, results.gstAmount],
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

  const kpiItems = [
    { label: 'Net Amount', value: results.netAmount, suffix: ' ₹' },
    { label: 'GST Amount', value: results.gstAmount, suffix: ' ₹' },
    { label: 'Total Amount', value: results.totalAmount, suffix: ' ₹' }
  ];

  const gstRates = [5, 12, 18, 28];

  return html`
    <${Layout}>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">GST Calculator</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Quickly calculate GST inclusive or exclusive amounts with standardized tax slabs.</p>
        </header>

        <${GlassCard} className="mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <${Slider}
                label="Amount"
                value=${amount}
                min=${100}
                max=${1000000}
                step=${100}
                suffix="₹"
                onChange=${setAmount}
              />
              
              <div class="mb-6">
                <label class="label-text mb-2 block">GST Type</label>
                <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button 
                    class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${type === 'exclusive' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                    onClick=${() => setType('exclusive')}
                  >
                    GST Exclusive
                  </button>
                  <button 
                    class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${type === 'inclusive' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                    onClick=${() => setType('inclusive')}
                  >
                    GST Inclusive
                  </button>
                </div>
              </div>
            </div>

            <div>
              <${Slider}
                label="GST Rate"
                value=${rate}
                min=${0.1}
                max=${50}
                step=${0.1}
                suffix="%"
                onChange=${setRate}
              />
              
              <div class="flex flex-wrap gap-2 mt-2">
                ${gstRates.map(r => html`
                  <button 
                    class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${rate === r ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}"
                    onClick=${() => setRate(r)}
                  >
                    ${r}%
                  </button>
                `)}
              </div>
            </div>
          </div>
        <//>

        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 class="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 text-center md:text-left">GST Breakdown</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div class="flex flex-col justify-center">
              <${ResultSummary} items=${kpiItems} />
              
              <div class="card p-6 bg-teal-50/50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/50">
                <p class="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">
                  ${type === 'exclusive' 
                    ? html`For a base amount of <strong>${formatINR(amount)}</strong> with <strong>${rate}% GST</strong>, the tax amount is <strong>${formatINR(results.gstAmount)}</strong>, making the total <strong>${formatINR(results.totalAmount)}</strong>.`
                    : html`For a total amount of <strong>${formatINR(amount)}</strong> (inclusive of <strong>${rate}% GST</strong>), the base price is <strong>${formatINR(results.netAmount)}</strong> and the GST component is <strong>${formatINR(results.gstAmount)}</strong>.`
                  }
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
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Net Amount</span>
                </div>
                <div class="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">GST Amount</span>
                </div>
              </div>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export default GSTCalculator;
