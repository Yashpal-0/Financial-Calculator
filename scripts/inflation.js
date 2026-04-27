import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { formatINR } from './util.js';
import { calculateInflation } from './finance.js';
import { Layout } from './components/Layout.js';
import { initApp } from './app.js';

const html = htm.bind(h);

const InflationCalculator = () => {
  // Initialize state from URL or defaults
  const getParam = (key, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const val = new URLSearchParams(window.location.search).get(key);
    return val ? Number(val) : fallback;
  };

  const [amount, setAmount] = useState(getParam('amount', 100000));
  const [rate, setRate] = useState(getParam('rate', 6));
  const [years, setYears] = useState(getParam('years', 10));

  // Instant-Update: Re-calculate on every state change
  const results = useMemo(() => {
    return calculateInflation(amount, rate, years);
  }, [amount, rate, years]);

  // Purchasing Power calculation
  const purchasingPower = useMemo(() => {
    const futureValue = amount / Math.pow(1 + rate / 100, years);
    const loss = amount - futureValue;
    const lossPercentage = (loss / amount) * 100;
    return { futureValue, loss, lossPercentage };
  }, [amount, rate, years]);

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('amount', amount);
    params.set('rate', rate);
    params.set('years', years);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [amount, rate, years]);

  // Chart Logic
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const labels = [];
    const data = [];
    for (let y = 0; y <= Math.min(years, 50); y++) {
      labels.push(`Yr ${y}`);
      data.push(amount * Math.pow(1 + rate / 100, y));
    }

    const ctx = chartRef.current.getContext('2d');
    const isDark = document.documentElement.dataset.theme === 'dark';

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (typeof Chart !== 'undefined') {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Future Cost',
            data,
            fill: true,
            backgroundColor: 'rgba(13,148,136,0.12)',
            borderColor: 'rgba(13,148,136,0.9)',
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: labels.length > 20 ? 0 : 3,
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` Future Cost: ${formatINR(c.raw)}`
              }
            }
          },
          scales: {
            x: {
              ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 12 } },
              grid: { display: false }
            },
            y: {
              ticks: {
                color: isDark ? '#a8a29e' : '#57534e',
                font: { size: 12 },
                callback: (v) => v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${Math.round(v)}`
              },
              grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
            }
          },
          animation: { duration: 600 }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [amount, rate, years]);

  // Initialize App (Theme/Install)
  useEffect(() => {
    initApp();
  }, []);

  const handleReset = () => {
    setAmount(100000);
    setRate(6);
    setYears(10);
  };

  return html`
    <${Layout}>
      <header class="py-12 md:py-16 text-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Inflation Calculator
          </h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Understand how inflation silently erodes the purchasing power of your money over time.
          </p>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <section class="card p-6 md:p-8 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Amount Input -->
            <div>
              <label class="label-text flex items-center mb-1">
                Current Value / Cost (₹)
                <div class="group relative ml-2 cursor-help">
                  <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">?</span>
                  <div class="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full">
                    Today's price or value of goods/service
                  </div>
                </div>
              </label>
              <input 
                type="number" 
                value=${amount} 
                onInput=${(e) => setAmount(Number(e.target.value))}
                class="input-field mb-4 w-full" 
              />
              <div class="flex items-center space-x-4">
                <input 
                  type="range" 
                  min="1000" 
                  max="10000000" 
                  step="1000" 
                  value=${amount}
                  onInput=${(e) => setAmount(Number(e.target.value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600" 
                />
                <span class="text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right">
                  ${amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${(amount / 1000).toFixed(0)}K`}
                </span>
              </div>
            </div>

            <!-- Rate Input -->
            <div>
              <label class="label-text flex items-center mb-1">
                Annual Inflation Rate (%)
                <div class="group relative ml-2 cursor-help">
                  <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">?</span>
                  <div class="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full">
                    India's average CPI inflation is ~5-6%
                  </div>
                </div>
              </label>
              <input 
                type="number" 
                step="0.1"
                value=${rate} 
                onInput=${(e) => setRate(Number(e.target.value))}
                class="input-field mb-4 w-full" 
              />
              <div class="flex items-center space-x-4">
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="0.1" 
                  value=${rate}
                  onInput=${(e) => setRate(Number(e.target.value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600" 
                />
                <span class="text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right">
                  ${rate.toFixed(1)}%
                </span>
              </div>
            </div>

            <!-- Years Input -->
            <div>
              <label class="label-text flex items-center mb-1">
                Time Period (Years)
                <div class="group relative ml-2 cursor-help">
                  <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">?</span>
                  <div class="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full">
                    How many years into the future
                  </div>
                </div>
              </label>
              <input 
                type="number" 
                value=${years} 
                onInput=${(e) => setYears(Number(e.target.value))}
                class="input-field mb-4 w-full" 
              />
              <div class="flex items-center space-x-4">
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  step="1" 
                  value=${years}
                  onInput=${(e) => setYears(Number(e.target.value))}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600" 
                />
                <span class="text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right">
                  ${years} yrs
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button onClick=${handleReset} class="ghost">Reset</button>
          </div>
        </section>

        <section class="mt-8">
          <h2 class="section-heading">Inflation Impact</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 mb-10">
            <div class="flex flex-col space-y-1">
              <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Value</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">${formatINR(amount)}</div>
            </div>
            <div class="flex flex-col space-y-1">
              <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Future Cost</div>
              <div class="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">${formatINR(results.futureCost)}</div>
            </div>
            <div class="flex flex-col space-y-1">
              <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Purchasing Power Lost</div>
              <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">${formatINR(results.purchasingPowerLost)}</div>
            </div>
          </div>

          <!-- Purchasing Power Lost Visualization -->
          <div class="card p-6 mb-10">
            <h3 class="font-bold text-lg mb-4">Purchasing Power Erosion</h3>
            <div class="flex items-center gap-4 mb-2">
              <div class="flex-grow h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-rose-500 transition-all duration-500" 
                  style=${{ width: `${purchasingPower.lossPercentage}%` }}
                ></div>
              </div>
              <span class="font-bold text-rose-600">${purchasingPower.lossPercentage.toFixed(1)}% Lost</span>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              ₹${amount.toLocaleString('en-IN')} today will be worth only 
              <span class="font-bold text-teal-600 dark:text-teal-400"> ${formatINR(purchasingPower.futureValue)} </span> 
              in ${years} years at ${rate}% inflation.
            </p>
          </div>
        </section>

        <section class="chart-section">
          <div class="chart-container">
            <div class="chart-title">Year-by-Year Cost Growth</div>
            <div class="chart-wrap">
              <canvas ref=${chartRef} height="280"></canvas>
            </div>
          </div>
          
          <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl p-5 mb-10 flex items-start gap-4">
            <div class="text-2xl">🔥</div>
            <div>
              <h4 class="font-bold text-teal-800 dark:text-teal-300 mb-1">Beat Inflation with Investments</h4>
              <p class="text-sm text-teal-700 dark:text-teal-400/80">
                At ${rate}% inflation, money halves in purchasing power every ~${Math.round(72 / rate)} years. Equity mutual funds have historically returned 12–14% annually, well above inflation. A simple SIP can help you stay ahead — try our <a href="./sip.html" class="font-bold underline">SIP Calculator</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    <//>
  `;
};

render(html`<${InflationCalculator} />`, document.getElementById('app'));
