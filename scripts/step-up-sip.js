import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { Layout } from './components/Layout.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './components/UI.js';
import { calculateStepUpSIP, calculateSIP } from './finance.js';
import { formatINR } from './util.js';

const html = htm.bind(h);

export default function StepUpSIPCalculator() {
  // State for inputs
  const [initSIP, setInitSIP] = useState(5000);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [returnRate, setReturnRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // URL State Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('init')) setInitSIP(Number(params.get('init')));
    if (params.has('step')) setStepUpPct(Number(params.get('step')));
    if (params.has('rate')) setReturnRate(Number(params.get('rate')));
    if (params.has('years')) setSipYears(Number(params.get('years')));
  }, []);

  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('init', initSIP);
    url.searchParams.set('step', stepUpPct);
    url.searchParams.set('rate', returnRate);
    url.searchParams.set('years', sipYears);
    window.history.replaceState({}, '', url);
  }, [initSIP, stepUpPct, returnRate, sipYears]);

  // Calculations
  const results = useMemo(() => {
    const { futureValue, totalInvested, yearlyData } = calculateStepUpSIP(initSIP, stepUpPct, returnRate, sipYears);
    const wealthGained = futureValue - totalInvested;

    // Chart Data
    const labels = [];
    const stepUpData = [];
    const flatData = [];
    const investedData = [];
    
    for (let y = 1; y <= sipYears; y++) {
      const { futureValue: fvSU, totalInvested: tiSU } = calculateStepUpSIP(initSIP, stepUpPct, returnRate, y);
      const fvFlat = calculateSIP(initSIP, returnRate, y * 12);
      
      labels.push(`Yr ${y}`);
      stepUpData.push(Math.round(fvSU));
      flatData.push(Math.round(fvFlat));
      investedData.push(Math.round(tiSU));
    }

    return {
      futureValue,
      totalInvested,
      wealthGained,
      yearlyData,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Step-Up SIP Corpus',
            data: stepUpData,
            borderColor: 'rgba(13,148,136,0.9)',
            backgroundColor: 'rgba(13,148,136,0.12)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Flat SIP Corpus',
            data: flatData,
            borderColor: 'rgba(8,145,178,0.8)',
            backgroundColor: 'rgba(8,145,178,0.06)',
            fill: true,
            tension: 0.4,
            borderDash: [6, 3],
          },
          {
            label: 'Total Invested',
            data: investedData,
            borderColor: 'rgba(100, 116, 139, 0.5)',
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      donutData: {
        labels: ['Invested Amount', 'Estimated Returns'],
        datasets: [{
          data: [totalInvested, wealthGained],
          backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
          hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
          borderWidth: 0,
        }]
      }
    };
  }, [initSIP, stepUpPct, returnRate, sipYears]);

  const summaryItems = [
    { label: 'Total Invested', value: results.totalInvested, suffix: '' },
    { label: 'Wealth Gained', value: results.wealthGained, suffix: '' },
    { label: 'Future Value', value: results.futureValue, suffix: '' },
    { label: 'Maturity Year', value: new Date().getFullYear() + sipYears, suffix: '' }
  ];

  return html`
    <${Layout}>
      <header class="py-12 md:py-16 text-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Step-Up SIP Calculator
          </h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Increase your SIP amount every year and watch your wealth grow dramatically faster.
          </p>
        </div>
      </header>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Inputs -->
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider}
                label="Initial Monthly SIP"
                value=${initSIP}
                min=${500}
                max=${100000}
                step=${500}
                suffix="₹"
                onChange=${setInitSIP}
              />
              <${Slider}
                label="Annual Step-Up"
                value=${stepUpPct}
                min=${1}
                max=${50}
                step=${1}
                suffix="%"
                onChange=${setStepUpPct}
              />
              <${Slider}
                label="Expected Return (p.a)"
                value=${returnRate}
                min=${1}
                max=${30}
                step=${0.5}
                suffix="%"
                onChange=${setReturnRate}
              />
              <${Slider}
                label="Investment Period"
                value=${sipYears}
                min=${1}
                max=${40}
                step=${1}
                suffix="Yrs"
                onChange=${setSipYears}
              />
            <//>
          </div>

          <!-- Results -->
          <div class="lg:col-span-2">
            <${ResultSummary} items=${summaryItems} />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-sm font-medium text-slate-500 uppercase mb-4">Investment Breakdown</h3>
                <${VisualChart}
                  type="doughnut"
                  data=${results.donutData}
                  options=${{
                    cutout: '70%',
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => ` ${ctx.label}: ${formatINR(ctx.raw)}`
                        }
                      }
                    }
                  }}
                  height=${250}
                />
              <//>

              <${GlassCard}>
                <h3 class="text-sm font-medium text-slate-500 uppercase mb-4">Growth Projection</h3>
                <${VisualChart}
                  type="line"
                  data=${results.chartData}
                  options=${{
                    plugins: {
                      legend: { display: true, position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (c) => ` ${c.dataset.label}: ${formatINR(c.raw)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (v) => v >= 1e7 ? '₹' + (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? '₹' + (v / 1e5).toFixed(0) + 'L' : '₹' + v
                        }
                      }
                    }
                  }}
                  height=${250}
                />
              <//>
            </div>

            <!-- Yearly Table -->
            <${GlassCard}>
              <h3 class="text-lg font-bold mb-4">Yearly Growth Table</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                  <thead class="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th class="px-4 py-3">Year</th>
                      <th class="px-4 py-3">Monthly SIP</th>
                      <th class="px-4 py-3 text-right">Total Invested</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    ${results.yearlyData.map((row) => html`
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="px-4 py-3 font-medium">Year ${Math.round(row.year)}</td>
                        <td class="px-4 py-3">${formatINR(row.monthly)}</td>
                        <td class="px-4 py-3 text-right font-semibold">${formatINR(row.cumInvested)}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            <//>

            <!-- Tip Card -->
            <div class="mt-8 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl p-5 flex items-start gap-4">
              <div class="text-2xl">🚀</div>
              <div>
                <h4 class="font-bold text-teal-800 dark:text-teal-300 mb-1">Accelerate Wealth with Step-Ups</h4>
                <p class="text-sm text-teal-700 dark:text-teal-400/80">
                  A 10% annual step-up on a ₹5,000 SIP over 20 years can generate <strong>3–4 times more wealth</strong> than a flat SIP. As your salary grows, increasing your SIP proportionally is the most powerful wealth-building habit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    <//>
  `;
}
