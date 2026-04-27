import fs from 'fs';
import path from 'path';

const themeScript = `
  <script>
    (function() {
      const saved = localStorage.getItem('theme');
      if (saved) document.documentElement.dataset.theme = saved;
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.dataset.theme = 'dark';
      }
    })();
  </script>`;

const files = [
  { path: 'index.html', title: 'FinCalc Suite – Premium Financial Calculators', desc: '20 premium financial calculators: EMI, SIP, Step-Up SIP, FD, RD, PPF, Inflation, Retirement Planner, Income Tax, and more. Mobile-friendly, works offline, no ads.' },
  { path: 'pages/affordability.html', title: 'Home Loan Affordability Calculator', desc: 'Estimate your eligible home loan amount based on income, existing EMIs, and FOIR/DTI ratios.' },
  { path: 'pages/balance-transfer.html', title: 'Loan Balance Transfer Calculator', desc: 'Compare your current loan with a new lender offer to calculate total interest savings and break-even period.' },
  { path: 'pages/cagr.html', title: 'CAGR Calculator', desc: 'Calculate Compound Annual Growth Rate (CAGR) for your investments over any time period.' },
  { path: 'pages/education.html', title: 'Education Loan Calculator', desc: 'Calculate education loan EMI with moratorium periods, study-period interest, and prepayment options.' },
  { path: 'pages/emi.html', title: 'EMI Calculator', desc: 'Calculate home loan or car loan EMI with interactive sliders, amortization schedules, and visual charts.' },
  { path: 'pages/fd.html', title: 'Fixed Deposit (FD) Calculator', desc: 'Calculate maturity amount and interest earned on Fixed Deposits with monthly, quarterly, or yearly compounding.' },
  { path: 'pages/gratuity.html', title: 'Gratuity Calculator', desc: 'Estimate your gratuity amount based on the latest salary and total years of service under the Gratuity Act.' },
  { path: 'pages/gst.html', title: 'GST Calculator', desc: 'Quickly calculate GST inclusive or exclusive amounts with standardized tax slabs (5%, 12%, 18%, 28%).' },
  { path: 'pages/income-tax.html', title: 'Income Tax Calculator (FY 2025-26)', desc: 'Compare Old vs New Tax Regime for FY 2025-26 (AY 2026-27) with deductions like 80C, HRA, and NPS.' },
  { path: 'pages/inflation.html', title: 'Inflation Calculator', desc: 'See how inflation erodes your purchasing power and calculate the future cost of goods and services.' },
  { path: 'pages/lumpsum.html', title: 'Lumpsum Investment Calculator', desc: 'Project the future value of your one-time mutual fund or stock market investments.' },
  { path: 'pages/mutual-fund.html', title: 'Mutual Fund Returns Calculator', desc: 'Calculate SIP and Lumpsum returns with CAGR, wealth projection, and tax implications.' },
  { path: 'pages/pomis.html', title: 'Post Office Monthly Income Scheme (POMIS) Calculator', desc: 'Calculate monthly interest income from Post Office Monthly Income Scheme (POMIS) investments.' },
  { path: 'pages/ppf.html', title: 'PPF Calculator', desc: 'Calculate Public Provident Fund (PPF) maturity amount with yearly compounding and tax-free interest.' },
  { path: 'pages/prepayment.html', title: 'Loan Prepayment Calculator', desc: 'See how much interest you can save by making one-time or recurring prepayments on your loan.' },
  { path: 'pages/rd.html', title: 'Recurring Deposit (RD) Calculator', desc: 'Calculate the maturity value of your regular monthly deposits in a Recurring Deposit account.' },
  { path: 'pages/retirement.html', title: 'Retirement Planner', desc: 'Find out how much corpus you need to retire comfortably and the monthly SIP required to reach that goal.' },
  { path: 'pages/sip.html', title: 'SIP Calculator', desc: 'Calculate the future value of your Systematic Investment Plan (SIP) with visual wealth gain charts.' },
  { path: 'pages/ssy.html', title: 'Sukanya Samriddhi Yojana (SSY) Calculator', desc: 'Calculate SSY maturity amount for your daughter with 21-year growth projection and interactive charts.' },
  { path: 'pages/step-up-sip.html', title: 'Step-Up SIP Calculator', desc: 'Calculate wealth from a SIP with annual increments. See the power of increasing your investment each year.' }
];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file.path);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file.path}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update Title
  const fullTitle = `${file.title} | FinCalc Suite`;
  content = content.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`);

  // 2. Update Meta Description
  if (content.includes('<meta name="description"')) {
    content = content.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${file.desc}">`);
  } else {
    content = content.replace('</title>', `</title>\n  <meta name="description" content="${file.desc}">`);
  }

  // 3. Update Theme Color
  if (!content.includes('<meta name="theme-color"')) {
    content = content.replace('</title>', `</title>\n  <meta name="theme-color" content="#0d9488">`);
  }

  // 4. Update Favicon
  const base = file.path === 'index.html' ? '' : '../';
  if (!content.includes('<link rel="icon"')) {
    content = content.replace('</title>', `</title>\n  <link rel="icon" href="${base}favicon.svg" type="image/svg+xml">`);
  }

  // 5. Update Canonical
  const url = `https://yashpal-0.github.io/Financial-Calculator/${file.path === 'index.html' ? '' : file.path}`;
  if (content.includes('<link rel="canonical"')) {
    content = content.replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${url}">`);
  } else {
    content = content.replace('</title>', `</title>\n  <link rel="canonical" href="${url}">`);
  }

  // 6. Update OG Tags
  const ogTags = `
  <meta property="og:type" content="website">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${file.desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://yashpal-0.github.io/Financial-Calculator/favicon.svg">`;

  if (content.includes('property="og:title"')) {
    content = content.replace(/<meta property="og:type" content=".*?">/, '<meta property="og:type" content="website">');
    content = content.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${fullTitle}">`);
    content = content.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${file.desc}">`);
    content = content.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`);
    if (!content.includes('property="og:image"')) {
        content = content.replace('</head>', `  <meta property="og:image" content="https://yashpal-0.github.io/Financial-Calculator/favicon.svg">\n</head>`);
    } else {
        content = content.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="https://yashpal-0.github.io/Financial-Calculator/favicon.svg">`);
    }
  } else {
    content = content.replace('</head>', `${ogTags}\n</head>`);
  }

  // 7. Add Theme Script if missing
  if (!content.includes('localStorage.getItem(\'theme\')')) {
    content = content.replace('</head>', `${themeScript}\n</head>`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file.path}`);
});
