import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { calculateSIP } from './finance.js';
import { formatINR, saveCalculation } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';
import { GlassCard, Slider, ResultSummary, VisualChart } from './components/UI.js';
import { Layout } from './components/Layout.js';

const html = htm.bind(h);

const SIPApp = () => {
  const initialState = getUrlState();
  
  const [monthlyInv, setMonthlyInv] = useState(Number(initialState.monthlyInv) || 5000);
  const [annualRate, setAnnualRate] = useState(Number(initialState.annualRate) || 12);
  const [tenureYears, setTenureYears] = useState(Number(initialState.tenureYears) || 10);

  // Sync to URL and localStorage
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({ monthlyInv, annualRate, tenureYears });
      
      const months = tenureYears * 12;
      const fv = calculateSIP(monthlyInv, annualRate, months);
      saveCalculation({
        id: 'sip',
        name: 'SIP Calculator',
        summary: `Maturity: ${formatINR(fv)} for ${formatINR(monthlyInv)}/mo`,
        link: window.location.href
      });
    }, 1000);
    debouncedSync();
  }, [monthlyInv, annualRate, tenureYears]);

  const results = useMemo(() => {
    const months = tenureYears * 12;
    const fv = calculateSIP(monthlyInv, annualRate, months);
    const invested = monthlyInv * months;
    const gained = fv - invested;
    
    // Generate yearly data for the table
    const yearlyData = [];
    for (let y = 1; y <= tenureYears; y++) {
      const currentMonths = y * 12;
      const currentFV = calculateSIP(monthlyInv, annualRate, currentMonths);
      const currentInvested = monthlyInv * currentMonths;
      const currentGained = currentFV - currentInvested;
      yearlyData.push({
        year: y,
        invested: currentInvested,
        gained: currentGained,
        total: currentFV
      });
    }

    return { invested, gained, fv, yearlyData };
  }, [monthlyInv, annualRate, tenureYears]);

  const chartData = {
    labels: ['Invested Amount', 'Estimated Returns'],
    datasets: [{
      data: [results.invested, results.gained],
      backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
      hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
      borderWidth: 0,
    }]
  };

  return html`
    <${Layout}>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <header class="py-12 text-center">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            SIP Calculator
          </h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Estimate wealth creation through regular monthly investments.
          </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Monthly Investment" 
                value=${monthlyInv} 
                min=${500} 
                max=${100000} 
                step=${500} 
                suffix="₹"
                onChange=${setMonthlyInv} 
              />
              <${Slider} 
                label="Expected Return (p.a)" 
                value=${annualRate} 
                min=${1} 
                max=${30} 
                step=${0.5} 
                suffix="%"
                onChange=${setAnnualRate} 
              />
              <${Slider} 
                label="Time Period" 
                value=${tenureYears} 
                min=${1} 
                max=${40} 
                step=${1} 
                suffix="Yrs"
                onChange=${setTenureYears} 
              />
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} 
              items=${[
                { label: 'Invested', value: results.invested, suffix: '' },
                { label: 'Returns', value: results.gained, suffix: '' },
                { label: 'Total Value', value: results.fv, suffix: '' }
              ]} 
            />

            <${GlassCard} className="mb-8">
              <div class="flex flex-col md:flex-row items-center gap-8">
                <div class="w-full md:w-1/2">
                  <${VisualChart} 
                    type="doughnut" 
                    data=${chartData} 
                    options=${{
                      cutout: '70%',
                      plugins: {
                        legend: { display: false }
                      }
                    }} 
                  />
                </div>
                <div class="w-full md:w-1/2 space-y-4">
                  <div class="flex justify-between items-center">
                    <div class="flex items-center">
                      <div class="w-3 h-3 rounded-full bg-teal-600 mr-2"></div>
                      <span class="text-sm text-slate-600 dark:text-slate-400">Invested Amount</span>
                    </div>
                    <span class="font-bold">${formatINR(results.invested)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center">
                      <div class="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
                      <span class="text-sm text-slate-600 dark:text-slate-400">Estimated Returns</span>
                    </div>
                    <span class="font-bold">${formatINR(results.gained)}</span>
                  </div>
                  <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span class="font-bold text-slate-900 dark:text-white">Total Value</span>
                    <span class="text-xl font-extrabold text-teal-600 dark:text-teal-400">${formatINR(results.fv)}</span>
                  </div>
                </div>
              </div>
            <//>

            <${GlassCard}>
              <h3 class="text-lg font-bold mb-4">Yearly Growth</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th class="text-left py-3 font-medium">Year</th>
                      <th class="text-right py-3 font-medium">Invested</th>
                      <th class="text-right py-3 font-medium">Returns</th>
                      <th class="text-right py-3 font-medium">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${results.yearlyData.map(row => html`
                      <tr class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="py-3 text-slate-600 dark:text-slate-400">Year ${row.year}</td>
                        <td class="text-right py-3">${formatINR(row.invested, 0)}</td>
                        <td class="text-right py-3 text-teal-600 dark:text-teal-400">+${formatINR(row.gained, 0)}</td>
                        <td class="text-right py-3 font-semibold">${formatINR(row.total, 0)}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

render(html`<${SIPApp} />`, document.getElementById('app'));
