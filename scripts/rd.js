import { h, render } from 'https://esm.sh/preact';
import RDCalculator from './components/RDCalculator.js';

const container = document.getElementById('rd-app');
if (container) {
  render(h(RDCalculator), container);
}
