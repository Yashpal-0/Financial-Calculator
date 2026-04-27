import { h, render } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import GSTCalculator from './components/GSTCalculator.js';

const html = htm.bind(h);

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('gst-root');
  if (root) {
    render(html`<${GSTCalculator} />`, root);
  }
});
