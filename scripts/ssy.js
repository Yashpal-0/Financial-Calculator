import { h, render } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import { Layout } from './components/Layout.js';
import SSYCalculator from './components/SSYCalculator.js';

const html = htm.bind(h);

const SSYApp = () => {
  return html`
    <${Layout}>
      <header class="py-12 md:py-16 text-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Sukanya Samriddhi Yojana Calculator
          </h1>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Plan for your daughter's future with the SSY calculator. See how your savings grow over 21 years.
          </p>
        </div>
      </header>

      <main>
        <${SSYCalculator} />
      </main>
    <//>
  `;
};

export const renderSSYApp = (container) => {
  render(html`<${SSYApp} />`, container);
};
