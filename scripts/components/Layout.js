import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export const Layout = ({ children }) => {
  const currentPath = window.location.pathname;
  const isIndex = currentPath.endsWith('index.html') || currentPath.endsWith('/') || !currentPath.includes('.html');
  
  const base = isIndex ? './' : '../';
  const pageBase = isIndex ? './pages/' : './';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: `${base}index.html`, active: isIndex },
    { name: 'EMI', href: `${pageBase}emi.html`, active: currentPath.endsWith('emi.html') },
    { name: 'Prepay', href: `${pageBase}prepayment.html`, active: currentPath.endsWith('prepayment.html') },
    { name: 'SIP', href: `${pageBase}sip.html`, active: currentPath.endsWith('sip.html') },
    { name: 'Step-Up SIP', href: `${pageBase}step-up-sip.html`, active: currentPath.endsWith('step-up-sip.html') },
    { name: 'Mutual Fund', href: `${pageBase}mutual-fund.html`, active: currentPath.endsWith('mutual-fund.html') },
    { name: 'FD', href: `${pageBase}fd.html`, active: currentPath.endsWith('fd.html') },
  ];

  const moreItems = [
    { name: 'Affordability', href: `${pageBase}affordability.html` },
    { name: 'Balance Transfer', href: `${pageBase}balance-transfer.html` },
    { name: 'Education Loan', href: `${pageBase}education.html` },
    { name: 'Lumpsum', href: `${pageBase}lumpsum.html` },
    { name: 'CAGR', href: `${pageBase}cagr.html` },
    { name: 'RD', href: `${pageBase}rd.html` },
    { name: 'PPF', href: `${pageBase}ppf.html` },
    { name: 'SSY', href: `${pageBase}ssy.html` },
    { name: 'POMIS', href: `${pageBase}pomis.html` },
    { name: 'Retirement', href: `${pageBase}retirement.html` },
    { name: 'Inflation', href: `${pageBase}inflation.html` },
    { name: 'Income Tax', href: `${pageBase}income-tax.html` },
    { name: 'GST', href: `${pageBase}gst.html` },
    { name: 'Gratuity', href: `${pageBase}gratuity.html` },
  ];

  const activeClass = "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white";
  const inactiveClass = "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800";

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = () => {
      setIsMoreOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return html`
    <div class="min-h-screen flex flex-col">
      <!-- Controls -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-3 pt-3 relative z-50 w-full">
        <button id="installBtn" class="hidden px-3 py-1.5 text-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Install App</button>
        <button id="themeToggle" class="px-3 py-1.5 text-base rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Toggle dark mode">🌓</button>
      </div>

      <nav class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <a href="${base}index.html" class="flex-shrink-0 flex items-center font-bold text-xl tracking-tight text-teal-700 dark:text-teal-400">
              <span class="mr-2 text-2xl">💹</span> FinCalc Suite
            </a>
            
            <div class="hidden md:flex items-center space-x-1">
              ${navItems.map(item => html`
                <a 
                  href=${item.href} 
                  class="px-3 py-2 rounded-md text-sm font-medium ${item.active ? activeClass : inactiveClass}"
                  aria-current=${item.active ? 'page' : undefined}
                >
                  ${item.name}
                </a>
              `)}
              
              <div class="relative">
                <button 
                  onClick=${(e) => { e.stopPropagation(); setIsMoreOpen(!isMoreOpen); }}
                  class="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${moreItems.some(i => currentPath.endsWith(i.href.split('/').pop())) ? activeClass : inactiveClass}"
                >
                  More
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                ${isMoreOpen && html`
                  <div class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-50 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div class="py-1" role="menu" aria-orientation="vertical">
                      ${moreItems.map(item => html`
                        <a 
                          href=${item.href} 
                          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ${currentPath.endsWith(item.href.split('/').pop()) ? 'bg-slate-50 dark:bg-slate-700 font-bold' : ''}"
                          role="menuitem"
                        >
                          ${item.name}
                        </a>
                      `)}
                    </div>
                  </div>
                `}
              </div>
            </div>

            <div class="flex md:hidden items-center">
              <button 
                onClick=${() => setIsMenuOpen(!isMenuOpen)}
                class="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none" 
                aria-label="Toggle menu"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d=${isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile menu -->
        <div class="${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" id="mobile-menu">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            ${[...navItems, ...moreItems].map(item => html`
              <a 
                href=${item.href} 
                class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.endsWith(item.href.split('/').pop()) ? activeClass : inactiveClass}"
              >
                ${item.name}
              </a>
            `)}
          </div>
        </div>
      </nav>

      <main class="flex-grow">
        ${children}
      </main>

      <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <div class="mb-2">✨ Built for everyone. Works offline. No data collection, tracking, or ads.</div>
          <div>Crafted with passion. Connect on <a
              href="https://www.linkedin.com/in/yashpal-yadav-990278221/" target="_blank" rel="me noopener" class="text-teal-600 dark:text-teal-400 font-medium hover:underline">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  `;
};
