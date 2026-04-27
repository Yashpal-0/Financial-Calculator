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
import { formatINR } from './util.js';
import { syncUrlState, getUrlState, debounce } from './state.js';

const html = htm.bind(h);

function inverseEmiToPrincipal(targetEmi, annualRate, tenureMonths) {
  const r = (annualRate / 100) / 12;
  if (r === 0) return targetEmi * tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return targetEmi * (factor - 1) / (r * factor);
}

const AffordabilityCalculator = () => {
  const initialState = getUrlState();
  
  const [netIncome, setNetIncome] = useState(Number(initialState.income) || 100000);
  const [otherEmi, setOtherEmi] = useState(Number(initialState.other) || 0);
  const [foir, setFoir] = useState(Number(initialState.foir) || 40);
  const [annualRate, setAnnualRate] = useState(Number(initialState.rate) || 8.5);
  const [tenureMonths, setTenureMonths] = useState(Number(initialState.tenure) || 240);
  const [downPayment, setDownPayment] = useState(Number(initialState.down) || 500000);

  // Sync state to URL
  useEffect(() => {
    const debouncedSync = debounce(() => {
      syncUrlState({
        income: netIncome,
        other: otherEmi,
        foir: foir,
        rate: annualRate,
        tenure: tenureMonths,
        down: downPayment
      });
    }, 500);
    debouncedSync();
  }, [netIncome, otherEmi, foir, annualRate, tenureMonths, downPayment]);

  const results = useMemo(() => {
    const maxEmi = Math.max(0, (netIncome * (foir / 100)) - otherEmi);
    const eligibleLoan = inverseEmiToPrincipal(maxEmi, annualRate, tenureMonths);
    const propertyBudget = eligibleLoan + downPayment;

    return { maxEmi, eligibleLoan, propertyBudget };
  }, [netIncome, otherEmi, foir, annualRate, tenureMonths, downPayment]);

  const kpiItems = [
    { label: 'Max Affordable EMI', value: results.maxEmi, prefix: '₹' },
    { label: 'Eligible Loan', value: results.eligibleLoan, prefix: '₹' },
    { label: 'Property Budget', value: results.propertyBudget, prefix: '₹' },
    { label: 'FOIR Used', value: foir, suffix: '%' }
  ];

  const chartData = {
    labels: ['Eligible Loan', 'Down Payment'],
    datasets: [{
      data: [results.eligibleLoan, downPayment],
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
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Affordability Engine</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">Estimate your maximum eligible loan amount based on income and liabilities.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <${GlassCard}>
              <${Slider} 
                label="Monthly Net Income" 
                value=${netIncome} 
                min=${10000} 
                max=${1000000} 
                step=${5000} 
                onChange=${setNetIncome} 
                suffix="₹" 
              />
              <${Slider} 
                label="Existing Monthly EMIs" 
                value=${otherEmi} 
                min=${0} 
                max=${500000} 
                step=${1000} 
                onChange=${setOtherEmi} 
                suffix="₹" 
              />
              <${Slider} 
                label="Target FOIR / DTI %" 
                value=${foir} 
                min=${10} 
                max=${70} 
                step=${1} 
                onChange=${setFoir} 
                suffix="%" 
              />
              <${Slider} 
                label="Annual Rate % (APR)" 
                value=${annualRate} 
                min=${5} 
                max=${15} 
                step=${0.1} 
                onChange=${setAnnualRate} 
                suffix="%" 
              />
              <${Slider} 
                label="Tenure (months)" 
                value=${tenureMonths} 
                min=${12} 
                max=${360} 
                step=${12} 
                onChange=${setTenureMonths} 
                suffix="mo" 
              />
              <${Slider} 
                label="Down Payment Funds" 
                value=${downPayment} 
                min=${0} 
                max=${10000000} 
                step=${50000} 
                onChange=${setDownPayment} 
                suffix="₹" 
              />
            <//>
          </div>

          <div class="lg:col-span-2">
            <${ResultSummary} items=${kpiItems} />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <${GlassCard} className="flex flex-col items-center justify-center">
                <h3 class="text-lg font-semibold mb-4">Budget Breakdown</h3>
                <${VisualChart} type="doughnut" data=${chartData} options=${chartOptions} height=${250} />
              <//>
              
              <${GlassCard} className="flex flex-col justify-center">
                <h3 class="text-lg font-semibold mb-4">Eligible Loan Amount</h3>
                <div class="text-5xl font-black text-teal-600 dark:text-teal-400 mb-2">
                  ${formatINR(results.eligibleLoan)}
                </div>
                <p class="text-slate-500 dark:text-slate-400">Based on your income and ${foir}% FOIR.</p>
              <//>
            </div>

            <${GlassCard}>
              <h3 class="text-xl font-bold mb-4">Understanding Affordability</h3>
              <div class="space-y-4 text-slate-600 dark:text-slate-400">
                <p>
                  <strong>FOIR (Fixed Obligation to Income Ratio):</strong> Banks typically allow 40-50% of your net monthly income to be used for all EMI payments (including existing ones).
                </p>
                <p>
                  <strong>Max Affordable EMI:</strong> This is calculated as: <br />
                  <code class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">(Monthly Income × FOIR%) - Existing EMIs</code>
                </p>
                <p>
                  <strong>Property Budget:</strong> Your total buying capacity is the sum of your <strong>Eligible Loan</strong> and your <strong>Down Payment</strong> funds.
                </p>
              </div>
            <//>
          </div>
        </div>
      </div>
    <//>
  `;
};

export const renderAffordabilityApp = (container) => {
  render(html`<${AffordabilityCalculator} />`, container);
};
