import puppeteer from 'puppeteer-core';

const base = 'http://127.0.0.1:8080/pages';

async function setValue(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.$eval(
    selector,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function click(page, selector) {
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.click(selector);
}

function nonDash(text) {
  return typeof text === 'string' && text.trim() !== '' && text.trim() !== '-' && text.trim() !== '–';
}

const tests = [
  {
    name: 'FD',
    path: 'fd.html',
    run: async (page) => {
      await setValue(page, '#fdAmount', 100000);
      await setValue(page, '#annualRate', 7.5);
      await setValue(page, '#tenureMonths', 12);
      await page.select('#compoundFreq', 'quarterly');
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 250));
      return page.evaluate(() => ({
        maturityOut: document.querySelector('#maturityOut')?.textContent?.trim(),
        shown: !document.querySelector('#resultsSection')?.classList.contains('hidden')
      }));
    },
    check: (r) => r.shown && nonDash(r.maturityOut)
  },
  {
    name: 'CAGR',
    path: 'cagr.html',
    run: async (page) => {
      await setValue(page, '#startValue', 100000);
      await setValue(page, '#endValue', 200000);
      await setValue(page, '#years', 5);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 200));
      return page.evaluate(() => ({
        resultOut: document.querySelector('#resultOut')?.textContent?.trim(),
        shown: !document.querySelector('#resultsSection')?.classList.contains('hidden')
      }));
    },
    check: (r) => r.shown && nonDash(r.resultOut) && r.resultOut.includes('%')
  },
  {
    name: 'SSY',
    path: 'ssy.html',
    run: async (page) => {
      await setValue(page, '#deposit', 150000);
      await setValue(page, '#tenure', 15);
      await setValue(page, '#rate', 8.2);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 200));
      return page.evaluate(() => ({
        resultOut: document.querySelector('#resultOut')?.textContent?.trim(),
        shown: !document.querySelector('#resultsSection')?.classList.contains('hidden')
      }));
    },
    check: (r) => r.shown && nonDash(r.resultOut)
  },
  {
    name: 'POMIS',
    path: 'pomis.html',
    run: async (page) => {
      await setValue(page, '#deposit', 900000);
      await setValue(page, '#rate', 7.4);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 200));
      return page.evaluate(() => ({
        resultOut: document.querySelector('#resultOut')?.textContent?.trim(),
        shown: !document.querySelector('#resultsSection')?.classList.contains('hidden')
      }));
    },
    check: (r) => r.shown && nonDash(r.resultOut)
  },
  {
    name: 'Income Tax',
    path: 'income-tax.html',
    run: async (page) => {
      await setValue(page, '#grossIncome', 1200000);
      await setValue(page, '#sec80C', 150000);
      await setValue(page, '#hra', 60000);
      await setValue(page, '#nps', 50000);
      await setValue(page, '#otherDed', 25000);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 300));
      return page.evaluate(() => {
        const recomm = document.querySelector('#recommSection');
        const chart = document.querySelector('#chartSection');
        const rows = document.querySelectorAll('#compareTableBody tr').length;
        return {
          recommDisplay: recomm ? getComputedStyle(recomm).display : null,
          chartDisplay: chart ? getComputedStyle(chart).display : null,
          rows
        };
      });
    },
    check: (r) => r.rows > 0 && r.recommDisplay !== 'none' && r.chartDisplay !== 'none'
  },
  {
    name: 'Inflation',
    path: 'inflation.html',
    run: async (page) => {
      await setValue(page, '#currentValue', 100000);
      await setValue(page, '#inflationRate', 6);
      await setValue(page, '#inflationYears', 10);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 300));
      return page.evaluate(() => {
        const chart = document.querySelector('#chartSection');
        return {
          futureCostOut: document.querySelector('#futureCostOut')?.textContent?.trim(),
          chartDisplay: chart ? getComputedStyle(chart).display : null
        };
      });
    },
    check: (r) => nonDash(r.futureCostOut) && r.chartDisplay !== 'none'
  },
  {
    name: 'Prepayment',
    path: 'prepayment.html',
    run: async (page) => {
      await setValue(page, '#loanAmount', 5000000);
      await setValue(page, '#annualRate', 8.5);
      await setValue(page, '#tenureMonths', 240);
      await click(page, '#addPrepayBtn');
      await page.waitForSelector('.prepay-item [data-prepay="amount"]', { timeout: 10000 });
      await page.$eval('.prepay-item [data-prepay="amount"]', (el) => {
        el.value = '50000';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 350));
      return page.evaluate(() => ({
        interestSaved: document.querySelector('#interestSaved')?.textContent?.trim(),
        prepaid: document.querySelector('#prepayTotalPrepaid')?.textContent?.trim(),
        mfProjected: document.querySelector('#prepayMfProjected')?.textContent?.trim(),
        note: document.querySelector('#prepayVsInvestNote')?.textContent?.trim()
      }));
    },
    check: (r) => nonDash(r.interestSaved) && nonDash(r.prepaid) && nonDash(r.mfProjected) && (r.note || '').length > 5
  },
  {
    name: 'Education Loan',
    path: 'education.html',
    run: async (page) => {
      await setValue(page, '#loanAmount', 1000000);
      await setValue(page, '#annualRate', 8.5);
      await setValue(page, '#moratoriumMonths', 24);
      await setValue(page, '#repaymentMonths', 120);
      await click(page, '#calcBtn');
      await new Promise(r => setTimeout(r, 350));
      return page.evaluate(() => ({
        emiOut: document.querySelector('#emiOut')?.textContent?.trim(),
        rows: document.querySelectorAll('#scheduleBody tr').length
      }));
    },
    check: (r) => nonDash(r.emiOut) && r.rows > 0
  }
];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

const results = [];

for (const t of tests) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

  let status = 'FAIL';
  let detail = null;
  let errMsg = null;

  try {
    await page.goto(`${base}/${t.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 250));
    detail = await t.run(page);
    status = t.check(detail) ? 'PASS' : 'FAIL';
  } catch (e) {
    errMsg = String(e?.message || e);
    status = 'FAIL';
  }

  results.push({
    name: t.name,
    page: t.path,
    status,
    detail,
    pageErrors,
    consoleErrors,
    error: errMsg
  });

  await page.close();
}

await browser.close();

console.log(JSON.stringify({ results }, null, 2));
