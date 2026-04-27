import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { 
  GlassCard, 
  Slider, 
  VisualChart 
} from './components/UI.js';
import { Layout } from './components/Layout.js';
import { calculateSIP, calculateLumpsum, calculateCAGR, equityLTCGTax, equitySTCGTax } from './finance.js';
import { formatINR, formatNum } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

const MutualFundCalculator = () => {
  const initialState = getUrlState();
  
  const [calcMode, setCalcMode] = useState(initialState.mode || 'both');
  const [holdingYears, setHoldingYears] = useState(Number(initialState.hy) || 3);
  
  // SIP Inputs
  const [sipMonthly, setSipMonthly] = useState(Number(initialState.sm) || 5000);
  const [sipRate, setSipRate] = useState(Number(initialState.sr) || 12);
  const [sipYears, setSipYears] = useState(Number(initialState.sy) || 10);

  // Lumpsum Inputs
  const [lumpAmount, setLumpAmount] = useState(Number(initialState.la) || 100000);
  const [lumpRate, setLumpRate] = useState(Number(initialState.lr) || 12);
  const [lumpYears, setLumpYears] = useState(Number(initialState.ly) || 10);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        mode: calcMode,
        hy: holdingYears,
        sm: sipMonthly,
        sr: sipRate,
        sy: sipYears,
        la: lumpAmount,
        lr: lumpRate,
        ly: lumpYears
      });
    }, 500);
    debouncedSync();
  }, [calcMode, holdingYears, sipMonthly, sipRate, sipYears, lumpAmount, lumpRate, lumpYears]);

  const results = useMemo(() => {
    let sipRes = null;
    let lumpRes = null;
    let totalInvested = 0;
    let totalFV = 0;

    if (calcMode === 'sip' || calcMode === 'both') {
      const months = sipYears * 12;
      const fv = calculateSIP(sipMonthly, sipRate, months);
      const invested = sipMonthly * months;
      const gains = fv - invested;
      const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
      const postTax = fv - tax;
      const cagr = invested > 0 && sipYears > 0 ? calculateCAGR(invested, fv, sipYears) * 100 : 0;

      sipRes = { invested, fv, gains, tax, postTax, cagr };
      totalInvested += invested;
      totalFV += fv;
    }

    if (calcMode === 'lumpsum' || calcMode === 'both') {
      const fv = calculateLumpsum(lumpAmount, lumpRate, lumpYears, 1);
      const invested = lumpAmount;
      const gains = fv - invested;
      const tax = holdingYears >= 1 ? equityLTCGTax(gains, holdingYears) : equitySTCGTax(gains);
      const postTax = fv - tax;
      const cagr = invested > 0 && lumpYears > 0 ? calculateCAGR(invested, fv, lumpYears) * 100 : 0;

      lumpRes = { invested, fv, gains, tax, postTax, cagr };
      totalInvested += invested;
      totalFV += fv;
    }

    return { sipRes, lumpRes, totalInvested, totalFV };
  }, [calcMode, holdingYears, sipMonthly, sipRate, sipYears, lumpAmount, lumpRate, lumpYears]);

  const chartData = {
    labels: ['Invested Amount', 'Estimated Returns'],
    datasets: [{
      data: [results.totalInvested, results.totalFV - results.totalInvested],
      backgroundColor: ['#0d9488', '#0891b2'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${formatINR(context.raw)}`
        }
      }
    },
    cutout: '70%'
  };

  return html`
    <${Layout}>
      <div class="max-w-6xl mx-auto px-4 py-8">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Mutual Fund Returns</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Project SIP & lumpsum returns with CAGR and post-tax analysis for equity funds.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <div class="mb-6">
                <label class="label-text">Calculation Mode</label>
                <select 
                  class="input-field" 
                  value=${calcMode} 
                  onChange=${(e) => setCalcMode(e.target.value)}
                >
                  <option value="both">SIP + Lumpsum</option>
                  <option value="sip">SIP Only</option>
                  <option value="lumpsum">Lumpsum Only</option>
                </select>
              </div>

              <${Slider} 
                label="Holding Period for Tax (Years)" 
                value=${holdingYears} 
                min=${0} 
                max=${40} 
                step=${0.5} 
                onChange=${setHoldingYears} 
                suffix="yr" 
              />

              ${(calcMode === 'sip' || calcMode === 'both') && html`
                <div class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <h3 class="text-sm font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-6">SIP Details</h3>
                  <${Slider} 
                    label="Monthly SIP" 
                    value=${sipMonthly} 
                    min=${500} 
                    max=${1000000} 
                    step=${500} 
                    onChange=${setSipMonthly} 
                    suffix="₹" 
                  />
                  <${Slider} 
                    label="Expected Return" 
                    value=${sipRate} 
                    min=${1} 
                    max=${30} 
                    step=${0.5} 
                    onChange=${setSipRate} 
                    suffix="%" 
                  />
                  <${Slider} 
                    label="Time Period" 
                    value=${sipYears} 
                    min=${1} 
                    max=${40} 
                    step=${1} 
                    onChange=${setSipYears} 
                    suffix="yr" 
                  />
                </div>
              `}

              ${(calcMode === 'lumpsum' || calcMode === 'both') && html`
                <div class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <h3 class="text-sm font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-6">Lumpsum Details</h3>
                  <${Slider} 
                    label="Lumpsum Investment" 
                    value=${lumpAmount} 
                    min=${500} 
                    max=${10000000} 
                    step=${500} 
                    onChange=${setLumpAmount} 
                    suffix="₹" 
                  />
                  <${Slider} 
                    label="Expected Return" 
                    value=${lumpRate} 
                    min=${1} 
                    max=${30} 
                    step=${0.5} 
                    onChange=${setLumpRate} 
                    suffix="%" 
                  />
                  <${Slider} 
                    label="Time Period" 
                    value=${lumpYears} 
                    min=${1} 
                    max=${40} 
                    step=${1} 
                    onChange=${setLumpYears} 
                    suffix="yr" 
                  />
                </div>
              `}
            <//>
          </div>

          <div class="lg:col-span-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4">Wealth Projection</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${chartOptions} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col justify-center">
                <h3 class="text-lg font-semibold mb-4">Total Future Value</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.totalFV)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Estimated value of your investments after the specified period.</p>
                <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-slate-500">Total Invested</span>
                    <span class="font-semibold">${formatINR(results.totalInvested)}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Total Gains</span>
                    <span class="font-semibold text-teal-600 dark:text-teal-400">${formatINR(results.totalFV - results.totalInvested)}</span>
                  </div>
                </div>
              <//>
            </div>

            <div class="space-y-8">
              ${results.sipRes && html`
                <${GlassCard}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">SIP Summary</h3>
                    <span class="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-full uppercase tracking-widest">Equity SIP</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Invested</p>
                      <p class="text-lg font-bold">${formatINR(results.sipRes.invested)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Future Value</p>
                      <p class="text-lg font-bold text-teal-600">${formatINR(results.sipRes.fv)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">CAGR</p>
                      <p class="text-lg font-bold">${formatNum(results.sipRes.cagr, 2)}%</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Est. Tax</p>
                      <p class="text-lg font-bold text-red-500">${formatINR(results.sipRes.tax)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Post-Tax Value</p>
                      <p class="text-lg font-bold text-teal-700 dark:text-teal-300">${formatINR(results.sipRes.postTax)}</p>
                    </div>
                  </div>
                <//>
              `}

              ${results.lumpRes && html`
                <${GlassCard}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">Lumpsum Summary</h3>
                    <span class="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold rounded-full uppercase tracking-widest">Equity Lumpsum</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Invested</p>
                      <p class="text-lg font-bold">${formatINR(results.lumpRes.invested)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Future Value</p>
                      <p class="text-lg font-bold text-teal-600">${formatINR(results.lumpRes.fv)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">CAGR</p>
                      <p class="text-lg font-bold">${formatNum(results.lumpRes.cagr, 2)}%</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Est. Tax</p>
                      <p class="text-lg font-bold text-red-500">${formatINR(results.lumpRes.tax)}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase mb-1">Post-Tax Value</p>
                      <p class="text-lg font-bold text-teal-700 dark:text-teal-300">${formatINR(results.lumpRes.postTax)}</p>
                    </div>
                  </div>
                <//>
              `}
            </div>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderMutualFundApp = (container) => {
  render(html`<${MutualFundCalculator} />`, container);
};

// Auto-render if container exists
const container = document.getElementById('mf-app');
if (container) {
  renderMutualFundApp(container);
}
