import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { GlassCard } from './components/UI.js';
import { Layout } from './components/Layout.js';

const html = htm.bind(h);

const calculators = [
  {
    id: 'emi',
    name: 'EMI Calculator',
    icon: '🏠',
    description: 'Calculate monthly EMI with interactive sliders, amortization schedule, and visual interest breakdown chart.',
    link: 'pages/emi.html',
    category: 'Loans'
  },
  {
    id: 'prepayment',
    name: 'Prepayment',
    icon: '⚡',
    description: 'Optimize your loan with reduced tenure or EMI strategies using one-time or recurring prepayments.',
    link: 'pages/prepayment.html',
    category: 'Loans'
  },
  {
    id: 'affordability',
    name: 'Affordability',
    icon: '📊',
    description: 'Determine maximum eligible loan based on income, existing EMIs, and FOIR ratios.',
    link: 'pages/affordability.html',
    category: 'Loans'
  },
  {
    id: 'balance-transfer',
    name: 'Balance Transfer',
    icon: '🔄',
    description: 'Compare current loan vs new lender to find savings and break-even points.',
    link: 'pages/balance-transfer.html',
    category: 'Loans'
  },
  {
    id: 'education',
    name: 'Education Loan',
    icon: '🎓',
    description: 'Plan education loan EMIs with moratorium period and grace period calculations.',
    link: 'pages/education.html',
    category: 'Loans'
  },
  {
    id: 'sip',
    name: 'SIP Calculator',
    icon: '📈',
    description: 'Calculate SIP future value with year-by-year bar chart and wealth gained vs invested breakdown.',
    link: 'pages/sip.html',
    category: 'Investments'
  },
  {
    id: 'step-up-sip',
    name: 'Step-Up SIP',
    icon: '🚀',
    description: 'Model SIP with annual step-up increments. Compare vs flat SIP and see exponential wealth growth.',
    link: 'pages/step-up-sip.html',
    category: 'Investments'
  },
  {
    id: 'mutual-fund',
    name: 'Mutual Fund',
    icon: '💼',
    description: 'SIP & lumpsum returns with CAGR, LTCG/STCG tax estimates, and post-tax wealth projection.',
    link: 'pages/mutual-fund.html',
    category: 'Investments'
  },
  {
    id: 'lumpsum',
    name: 'Lumpsum',
    icon: '💰',
    description: 'Project the compound growth of a one-time investment over your chosen time horizon.',
    link: 'pages/lumpsum.html',
    category: 'Investments'
  },
  {
    id: 'fd',
    name: 'Fixed Deposit',
    icon: '🏦',
    description: 'Plan secure investments with various compounding frequencies (monthly, quarterly, yearly).',
    link: 'pages/fd.html',
    category: 'Investments'
  },
  {
    id: 'rd',
    name: 'Recurring Deposit',
    icon: '📅',
    description: 'Calculate maturity value for regular monthly deposits with quarterly compounding.',
    link: 'pages/rd.html',
    category: 'Investments'
  },
  {
    id: 'ppf',
    name: 'PPF Calculator',
    icon: '🏛️',
    description: 'Estimate tax-free returns on Public Provident Fund with yearly compounding over 15+ years.',
    link: 'pages/ppf.html',
    category: 'Investments'
  },
  {
    id: 'cagr',
    name: 'CAGR Calculator',
    icon: '📈',
    description: 'Calculate the Compound Annual Growth Rate for your investments over a specific period.',
    link: 'pages/cagr.html',
    category: 'Investments'
  },
  {
    id: 'ssy',
    name: 'SSY Calculator',
    icon: '👧',
    description: 'Estimate maturity amount for Sukanya Samriddhi Yojana with annual compounding.',
    link: 'pages/ssy.html',
    category: 'Investments'
  },
  {
    id: 'pomis',
    name: 'POMIS Calculator',
    icon: '📮',
    description: 'Calculate your guaranteed monthly income from the Post Office Monthly Income Scheme.',
    link: 'pages/pomis.html',
    category: 'Investments'
  },
  {
    id: 'retirement',
    name: 'Retirement Planner',
    icon: '🏖️',
    description: 'Calculate the corpus needed to retire and the exact monthly SIP required to get there, inflation-adjusted.',
    link: 'pages/retirement.html',
    category: 'Planning'
  },
  {
    id: 'inflation',
    name: 'Inflation',
    icon: '📉',
    description: 'See how inflation erodes purchasing power and what goods/services will cost in the future.',
    link: 'pages/inflation.html',
    category: 'Planning'
  },
  {
    id: 'income-tax',
    name: 'Income Tax',
    icon: '🧾',
    description: 'Compare Old vs New Regime with all deductions. Instantly see which tax regime saves you more.',
    link: 'pages/income-tax.html',
    category: 'Planning'
  },
  {
    id: 'gst',
    name: 'GST Calculator',
    icon: '🛍️',
    description: 'Calculate exclusive and inclusive Goods and Services Tax amounts instantly.',
    link: 'pages/gst.html',
    category: 'Planning'
  },
  {
    id: 'gratuity',
    name: 'Gratuity Calculator',
    icon: '🎁',
    description: 'Determine your gratuity amount based on last drawn salary and years of service.',
    link: 'pages/gratuity.html',
    category: 'Planning'
  }
];

const CalculatorCard = ({ calc }) => {
  return html`
    <a href="${calc.link}" class="card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform hover:shadow-lg group">
      <div class="text-4xl mb-4">${calc.icon}</div>
      <h3 class="text-xl font-bold mb-2 group-hover:text-teal-600 transition-colors">${calc.name}</h3>
      <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 flex-grow">${calc.description}</p>
      <div class="text-teal-600 dark:text-teal-400 font-semibold text-sm mt-auto">Explore &rarr;</div>
    </a>
  `;
};

const Dashboard = () => {
  const [recentCalcs, setRecentCalcs] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_calculations');
    if (saved) {
      try {
        setRecentCalcs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent calculations', e);
      }
    }
  }, []);

  const categories = ['Loans', 'Investments', 'Planning'];

  return html`
    <${Layout}>
      <header class="py-16 md:py-24 text-center relative z-10 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Master Your Finances</h1>
          <p class="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto">
            A beautiful, precision-engineered suite of tools for EMIs, investments, tax planning, and retirement.
            Completely free. Works offline.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <span class="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium">
              <span class="mr-2 text-lg">🧮</span> <span class="font-bold mr-1 text-teal-600 dark:text-teal-400">20</span> Calculators
            </span>
            <span class="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium">
              <span class="mr-2 text-lg">📶</span> Works <span class="font-bold ml-1 text-teal-600 dark:text-teal-400">Offline</span>
            </span>
            <span class="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium">
              <span class="mr-2 text-lg">🔒</span> <span class="font-bold mr-1 text-teal-600 dark:text-teal-400">Zero</span> Data Collection
            </span>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        ${recentCalcs.length > 0 && html`
          <section class="mb-16">
            <div class="flex justify-between items-end mb-8">
              <div>
                <div class="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">Continue where you left off</div>
                <h2 class="text-3xl font-bold">Recent Calculations</h2>
              </div>
              <button 
                onClick=${() => { localStorage.removeItem('recent_calculations'); setRecentCalcs([]); }}
                class="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${recentCalcs.map(calc => html`
                <${GlassCard} className="flex flex-col">
                  <div class="flex justify-between items-start mb-4">
                    <div class="text-3xl">${calculators.find(c => c.id === calc.id)?.icon || '📊'}</div>
                    <span class="text-xs font-medium text-slate-400">${new Date(calc.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h3 class="text-lg font-bold mb-1">${calc.name}</h3>
                  <p class="text-sm text-slate-500 mb-4">${calc.summary}</p>
                  <a href="${calc.link}" class="text-teal-600 dark:text-teal-400 font-semibold text-sm mt-auto hover:underline">View Details &rarr;</a>
                <//>
              `)}
            </div>
          </section>
        `}

        ${categories.map(category => html`
          <section class="mb-16">
            <div class="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">${category}</div>
            <h2 class="text-3xl font-bold mb-8">${category === 'Planning' ? 'Financial Planning' : category + ' Calculators'}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              ${calculators.filter(c => c.category === category).map(calc => html`
                <${CalculatorCard} calc=${calc} />
              `)}
            </div>
          </section>
        `)}

        <!-- FAQ Section -->
        <section class="max-w-4xl mx-auto mt-20">
          <div class="text-center mb-10">
            <div class="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">Got Questions?</div>
            <h2 class="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div class="space-y-4">
            <${FaqItem} 
              question="What is compound interest and how does the EMI calculator use it?"
              answer="Compound interest is interest calculated on both the principal and accumulated interest. The EMI calculator uses the standard reducing-balance formula: EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1), where P = principal, r = monthly rate, n = tenure in months."
            />
            <${FaqItem} 
              question="Is a Step-Up SIP really better than a regular SIP?"
              answer="Yes, significantly! With a 10% annual step-up on a ₹5,000/month SIP at 12% return over 20 years, you accumulate ₹2.6 Cr vs ₹1.0 Cr with a flat SIP — nearly 2.6× more wealth!"
            />
            <${FaqItem} 
              question="Which tax regime should I choose — Old or New?"
              answer="It depends on your deductions. If you have large 80C investments (₹1.5L), HRA, and NPS (₹50K), the Old Regime is usually better. If you have minimal deductions, the New Regime makes sense."
            />
            <${FaqItem} 
              question="Does this app store any of my data?"
              answer="Absolutely not. All calculations happen 100% in your browser. We store only your theme preference and recent calculation snapshots in your own browser's localStorage."
            />
          </div>
        </section>
      </main>
    <//>
  `;
};

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return html`
    <div class="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group">
      <button class="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none" onClick=${() => setIsOpen(!isOpen)}>
        <span class="font-bold text-lg group-hover:text-teal-600 transition-colors">${question}</span>
        <span class="text-slate-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </span>
      </button>
      <div class="px-6 pb-4 ${isOpen ? '' : 'hidden'} text-slate-600 dark:text-slate-400">
        <p>${answer}</p>
      </div>
    </div>
  `;
};

export const renderDashboard = (container) => {
  render(html`<${Dashboard} />`, container);
};
