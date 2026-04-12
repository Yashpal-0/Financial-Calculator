import fs from 'fs';

const pages = [
  'step-up-sip.js', 'mutual-fund.js', 'lumpsum.js',
  'fd.js', 'rd.js', 'ppf.js', 'pomis.js', 'ssy.js', 'cagr.js'
];

for (const page of pages) {
  const filePath = `scripts/${page}`;
  if (!fs.existsSync(filePath)) continue;

  let js = fs.readFileSync(filePath, 'utf8');

  // Skip if already called
  if (js.match(/updateDonutChart\s*\(/g).length > 1) {
      console.log('Already injected in', page);
      continue;
  }

  let label1 = "'Invested Amount'";
  let label2 = "'Estimated Returns'";
  let val1 = "invested";
  let val2 = "gained";

  if (page === 'fd.js' || page === 'ssy.js' || page === 'ppf.js') {
      label1 = "'Principal Amount'";
      label2 = "'Total Interest'";
      val1 = "P";
      if (page === 'ppf.js' || page === 'ssy.js') val1 = "invested";
      val2 = "interest";
  } else if (page === 'rd.js') {
      label1 = "'Total Deposits'";
      label2 = "'Total Interest'";
      val1 = "deposits";
      val2 = "interest";
  } else if (page === 'pomis.js') {
      label1 = "'Invested Amount'";
      label2 = "'Total Income'";
      val1 = "P";
      val2 = "totalIncome";
  } else if (page === 'cagr.js') {
      label1 = "'Initial Value'";
      label2 = "'Absolute Return'";
      val1 = "Vbegin";
      val2 = "absReturn";
  } else if (page === 'mutual-fund.js') {
      val1 = "totalInvested";
      val2 = "estReturns";
  }

  const injectCode = `\n    document.getElementById('resultsSection').classList.remove('hidden');\n    updateDonutChart(${label1}, ${val1}, ${label2}, ${val2});\n`;

  if (page === 'mutual-fund.js') {
      // In mutual fund, there is `onCalculate` function. Let's find end of onCalculate
      js = js.replace(/(document\.getElementById\('totalValueOut'\)\.textContent\s*=\s*.*?;)/, `$1${injectCode}`);
  } else {
      // The rest have standard calcBtn listener
      js = js.replace(/(\}\);[\s\S]*?(document\.getElementById\('resetBtn'\)|document\.getElementById\('mfResetBtn'\)))/, `${injectCode}$1`);
  }

  fs.writeFileSync(filePath, js, 'utf8');
  console.log('Fixed', page);
}