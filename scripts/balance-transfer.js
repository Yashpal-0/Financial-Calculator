import { formatINR } from './util.js';
import { calculateEmi } from './finance.js';

document.getElementById('calcBtn').addEventListener('click', () => {
  const outstanding = Number(document.getElementById('currOutstanding').value || '0');
  const currRate = Number(document.getElementById('currRate').value || '0');
  const currTenure = Number(document.getElementById('currTenure').value || '0');
  const newRate = Number(document.getElementById('newRate').value || '0');
  const processingFee = Number(document.getElementById('processingFee').value || '0');
  const otherCosts = Number(document.getElementById('otherCosts').value || '0');

  if (!(outstanding>0 && currRate>=0 && newRate>=0 && Number.isInteger(currTenure) && currTenure>0)) { alert('Please enter valid values.'); return; }

  const currEmi = calculateEmi(outstanding, currRate, currTenure);
  const newEmi = calculateEmi(outstanding, newRate, currTenure);

  const currTotalInterest = (currEmi * currTenure) - outstanding;
  const newTotalInterest = (newEmi * currTenure) - outstanding;
  const interestSaved = Math.max(0, currTotalInterest - newTotalInterest);
  const netSavings = Math.max(0, interestSaved - (processingFee + otherCosts));

  document.getElementById('currEmi').textContent = formatINR(currEmi);
  document.getElementById('newEmi').textContent = formatINR(newEmi);
  document.getElementById('interestSaved').textContent = formatINR(interestSaved);
  document.getElementById('netSavings').textContent = formatINR(netSavings);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('currOutstanding').value = '';
  document.getElementById('currRate').value = '9';
  document.getElementById('currTenure').value = '180';
  document.getElementById('newRate').value = '8.4';
  document.getElementById('processingFee').value = '10000';
  document.getElementById('otherCosts').value = '0';
  document.getElementById('currEmi').textContent = '-';
  document.getElementById('newEmi').textContent = '-';
  document.getElementById('interestSaved').textContent = '-';
  document.getElementById('netSavings').textContent = '-';
});


