// Finance.js – Core financial calculation library

/**
 * Calculates future cost due to inflation
 * @param {number} currentValue - Current price/value
 * @param {number} inflationPercent - Annual inflation rate %
 * @param {number} years - Number of years
 * @returns {{ futureCost: number, purchasingPowerLost: number }}
 */
export function calculateInflation(currentValue, inflationPercent, years) {
  const futureCost = currentValue * Math.pow(1 + inflationPercent / 100, years);
  const purchasingPowerLost = futureCost - currentValue;
  return { futureCost, purchasingPowerLost };
}

/**
 * Calculates Step-Up SIP (SIP with annual increment)
 * @param {number} initialMonthly - Starting monthly investment
 * @param {number} stepUpPercent - Annual step-up %
 * @param {number} annualReturn - Expected annual return %
 * @param {number} years - Total years
 * @returns {{ futureValue: number, totalInvested: number, yearlyData: Array }}
 */
export function calculateStepUpSIP(initialMonthly, stepUpPercent, annualReturn, years) {
  const r = annualReturn / 100 / 12;
  let totalFV = 0;
  let totalInvested = 0;
  const yearlyData = [];
  let currentMonthly = initialMonthly;

  for (let y = 0; y < years; y++) {
    // Each year's SIP installments as a lumpsum at start of that year block
    const monthsRemaining = (years - y) * 12;
    // FV of this year's SIP at r for monthsRemaining months
    const yearFV = r === 0
      ? currentMonthly * 12
      : currentMonthly * ((Math.pow(1 + r, monthsRemaining) - 1) / r) * (1 + r);
    totalFV += yearFV;
    totalInvested += currentMonthly * 12;
    yearlyData.push({ year: y + 1, monthly: currentMonthly, cumInvested: totalInvested });
    currentMonthly = currentMonthly * (1 + stepUpPercent / 100);
  }
  return { futureValue: totalFV, totalInvested, yearlyData };
}

/**
 * Calculates required retirement corpus and monthly SIP needed
 * @param {number} currentAge
 * @param {number} retirementAge
 * @param {number} monthlyExpense - Desired monthly expense at retirement (today's value)
 * @param {number} inflationPercent - Inflation rate % p.a.
 * @param {number} returnPercent - Investment return rate % p.a.
 * @param {number} postRetirementYears - Expected years in retirement (default 25)
 */
export function calculateRetirementCorpus(currentAge, retirementAge, monthlyExpense, inflationPercent, returnPercent, postRetirementYears = 25) {
  const yearsToRetire = retirementAge - currentAge;
  const r = inflationPercent / 100;
  const retMonthlyExpense = monthlyExpense * Math.pow(1 + r, yearsToRetire);
  const retAnnualExpense = retMonthlyExpense * 12;

  // Real rate of return in retirement: (1+return)/(1+inflation) - 1
  const realRate = (1 + returnPercent / 100) / (1 + inflationPercent / 100) - 1;
  let corpusNeeded;
  if (Math.abs(realRate) < 0.0001) {
    corpusNeeded = retAnnualExpense * postRetirementYears;
  } else {
    corpusNeeded = retAnnualExpense * (1 - Math.pow(1 + realRate, -postRetirementYears)) / realRate;
  }

  // Monthly SIP to reach corpusNeeded in yearsToRetire at returnPercent
  const monthlyRate = returnPercent / 100 / 12;
  const n = yearsToRetire * 12;
  let monthlySIPNeeded;
  if (monthlyRate === 0) {
    monthlySIPNeeded = corpusNeeded / n;
  } else {
    monthlySIPNeeded = corpusNeeded * monthlyRate / ((Math.pow(1 + monthlyRate, n) - 1) * (1 + monthlyRate));
  }

  return { corpusNeeded, monthlySIPNeeded, retMonthlyExpense, yearsToRetire };
}

/**
 * Calculates India Income Tax for FY 2024-25
 * @param {number} grossIncome - Gross annual salary
 * @param {{ section80C, hra, nps, otherDeductions }} oldRegimeDeductions
 * @returns {{ oldRegimeTax, newRegimeTax, recommendation, oldTaxableIncome, newTaxableIncome }}
 */
export function calculateIncomeTax(grossIncome, oldRegimeDeductions = {}) {
  // ===== OLD REGIME =====
  const standardDeductionOld = 50000;
  const { section80C = 0, hra = 0, nps = 0, otherDeductions = 0 } = oldRegimeDeductions;
  const totalDeductions = Math.min(section80C, 150000) + hra + Math.min(nps, 50000) + otherDeductions + standardDeductionOld;
  const oldTaxableIncome = Math.max(0, grossIncome - totalDeductions);
  const oldRegimeTax = computeOldRegimeTax(oldTaxableIncome);

  // ===== NEW REGIME (FY 2024-25) =====
  const standardDeductionNew = 75000; // Budget 2024 increased to 75,000
  const newTaxableIncome = Math.max(0, grossIncome - standardDeductionNew);
  const newRegimeTax = computeNewRegimeTax(newTaxableIncome);

  const recommendation = newRegimeTax <= oldRegimeTax ? 'new' : 'old';
  const savings = Math.abs(oldRegimeTax - newRegimeTax);

  return { oldRegimeTax, newRegimeTax, recommendation, savings, oldTaxableIncome, newTaxableIncome };
}

function applySlabs(income, slabs) {
  let tax = 0;
  for (const { from, to, rate } of slabs) {
    if (income <= from) break;
    tax += (Math.min(income, to) - from) * rate / 100;
  }
  return tax;
}

function computeOldRegimeTax(income) {
  if (income <= 250000) return 0;
  const slabs = [
    { from: 250000, to: 500000, rate: 5 },
    { from: 500000, to: 1000000, rate: 20 },
    { from: 1000000, to: Infinity, rate: 30 },
  ];
  let tax = applySlabs(income, slabs);
  // Rebate u/s 87A: full rebate up to ₹12,500 if income ≤ ₹5L
  if (income <= 500000) tax = Math.max(0, tax - 12500);
  // Add 4% health & education cess
  return tax + tax * 0.04;
}

function computeNewRegimeTax(income) {
  if (income <= 300000) return 0;
  const slabs = [
    { from: 300000, to: 700000, rate: 5 },
    { from: 700000, to: 1000000, rate: 10 },
    { from: 1000000, to: 1200000, rate: 15 },
    { from: 1200000, to: 1500000, rate: 20 },
    { from: 1500000, to: Infinity, rate: 30 },
  ];
  let tax = applySlabs(income, slabs);
  // Rebate u/s 87A: full rebate up to ₹25,000 if income ≤ ₹7L
  if (income <= 700000) tax = Math.max(0, tax - 25000);
  return tax + tax * 0.04;
}
// No date utilities needed after simplifying to month-based schedule

/**
 * Calculates Future Value of a lumpsum investment (Compound Interest)
 * @param {number} principal - Initial investment
 * @param {number} annualRatePercent - Annual interest rate (e.g., 12 for 12%)
 * @param {number} years - Time in years
 * @param {number} compoundsPerYear - Number of times interest applied per year (default 1)
 */
export function calculateLumpsum(principal, annualRatePercent, years, compoundsPerYear = 1) {
  const r = annualRatePercent / 100;
  const n = compoundsPerYear;
  const t = years;
  return principal * Math.pow(1 + r / n, n * t);
}

/**
 * CAGR (Compound Annual Growth Rate) for lumpsum: (FV/PV)^(1/years) - 1
 * @param {number} startValue - Initial investment
 * @param {number} endValue - Final value
 * @param {number} years - Holding period in years
 * @returns {number} CAGR as decimal (e.g. 0.12 for 12%)
 */
export function calculateCAGR(startValue, endValue, years) {
  if (!startValue || startValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * LTCG tax for equity mutual funds (India): 10% on gains above ₹1L per year.
 * STCG: 15% for equity held < 1 year.
 * @param {number} gain - Capital gains amount
 * @param {number} holdingYears - Years held
 * @param {number} exemptionLimit - Annual exemption (default 1,00,000)
 * @returns {number} Tax amount in INR
 */
export function equityLTCGTax(gain, holdingYears, exemptionLimit = 100000) {
  if (gain <= 0 || holdingYears < 1) return 0;
  const taxableGain = Math.max(0, gain - exemptionLimit);
  return taxableGain * 0.1;
}

/**
 * STCG tax for equity (< 1 year): 15%
 */
export function equitySTCGTax(gain) {
  if (gain <= 0) return 0;
  return gain * 0.15;
}

/**
 * Calculates Future Value of a Systematic Investment Plan (SIP)
 * @param {number} monthlyInvestment - Monthly SIP amount
 * @param {number} annualRatePercent - Annual expected return
 * @param {number} tenureMonths - Total months
 */
export function calculateSIP(monthlyInvestment, annualRatePercent, tenureMonths) {
  if (annualRatePercent === 0) return monthlyInvestment * tenureMonths;
  const r = (annualRatePercent / 100) / 12;
  const n = tenureMonths;
  // Formula for SIP (assuming investment at end/start of month, standard uses start of month: P * ((1+r)^n - 1)/r * (1+r))
  // standard mutual fund SIP calculator uses start of month
  return monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

/**
 * Calculates Future Value of a Recurring Deposit (RD)
 * @param {number} monthlyDeposit - Monthly RD amount
 * @param {number} annualRatePercent - Annual interest rate
 * @param {number} tenureMonths - Total months
 * Compounding usually quarterly in India
 */
export function calculateRD(monthlyDeposit, annualRatePercent, tenureMonths) {
  let maturity = 0;
  const r = annualRatePercent / 100;
  const n = 4; // Quarterly compounding
  // RD formula: M = R * [(1 + r/n)^(n*t) - 1] / [1 - (1+r/n)^(-n/12)] (Complex)
  // Or iteration month by month for accuracy:
  for (let i = 0; i < tenureMonths; i++) {
    // each deposit earns interest for remaining months
    const remainingYears = (tenureMonths - i) / 12;
    maturity += monthlyDeposit * Math.pow(1 + r / n, n * remainingYears);
  }
  return maturity;
}

/**
 * Calculates Fixed Deposit (FD) Maturity
 */
export function calculateFD(principal, annualRatePercent, tenureMonths, compoundingFrequency = 'quarterly') {
  const r = annualRatePercent / 100;
  let n = 4; // default quarterly
  if (compoundingFrequency === 'yearly') n = 1;
  else if (compoundingFrequency === 'half-yearly') n = 2;
  else if (compoundingFrequency === 'monthly') n = 12;

  const t = tenureMonths / 12;
  return principal * Math.pow(1 + r / n, n * t);
}

/**
 * Calculates PPF (Public Provident Fund)
 * PPF interest is calculated monthly on the lowest balance between the 5th and end of the month,
 * but compounded annually.
 * Assuming yearly investment at start of year for simplicity here.
 */
export function calculatePPF(yearlyInvestment, annualRatePercent, tenureYears) {
  let balance = 0;
  const r = annualRatePercent / 100;
  for (let i = 0; i < tenureYears; i++) {
    balance += yearlyInvestment;
    balance += balance * r; // Compounded annually
  }
  return balance;
}

export function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const r = (annualRatePercent / 100) / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

export function computeRemainingMonths(principal, monthlyRate, emi) {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(principal / emi);
  const numerator = 1 - (monthlyRate * principal) / emi;
  if (numerator <= 0) return Infinity; // The loan will never be paid off
  const n = -Math.log(numerator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n));
}

export function baselineSchedule(P, rAnnual, n) {
  const r = (rAnnual / 100) / 12;
  const emi = calculateEmi(P, rAnnual, n);
  let principal = P;
  let totalInterest = 0;
  for (let i = 0; i < n; i++) {
    const interest = principal * r;
    const principalPay = Math.min(emi - interest, principal);
    principal -= principalPay;
    totalInterest += interest;
    if (principal <= 0) break;
  }
  return { emi, totalInterest };
}

export function buildPrepayInstances(prepayConfigList) {
  const instances = [];
  for (const cfg of prepayConfigList) {
    const amount = Number(String(cfg.amount || '').replace(/[,\s]/g, ''));
    if (!amount || amount <= 0) continue;
    const freq = cfg.frequency || 'once';
    if (freq === 'once') {
      instances.push({ monthOffset: 0, amount });
    } else if (freq === 'monthly' || freq === 'yearly') {
      const stepMonths = freq === 'monthly' ? 1 : 12;
      for (let m = 0; m < 1200; m += stepMonths) {
        instances.push({ monthOffset: m, amount });
        if (m > 1000) break;
      }
    }
  }
  instances.sort((a, b) => a.monthOffset - b.monthOffset);
  return instances;
}

export function generateSchedule(params) {
  const {
    principal,
    annualRatePercent,
    tenureMonths,
    prepayments,
    strategy
  } = params;

  const monthlyRate = (annualRatePercent / 100) / 12;
  let remainingPrincipal = principal;
  let remainingMonths = tenureMonths;
  let currentEmi = calculateEmi(remainingPrincipal, annualRatePercent, remainingMonths);
  const schedule = [];
  let totalInterest = 0;
  const prepayQueue = [...prepayments];

  let installmentIndex = 0;
  while (remainingPrincipal > 0 && installmentIndex < 1200 && remainingMonths > 0) {
    installmentIndex += 1;
    let prepaymentApplied = 0;

    // Apply any prepayment configured for this installment index
    while (prepayQueue.length && prepayQueue[0].monthOffset + 1 === installmentIndex) {
      const pp = prepayQueue.shift();
      const amount = Math.min(pp.amount, remainingPrincipal);
      if (amount > 0) {
        prepaymentApplied += amount;
        remainingPrincipal -= amount;
      }
    }

    if (prepaymentApplied > 0) {
      if (strategy === 'reduce_emi') {
        currentEmi = calculateEmi(remainingPrincipal, annualRatePercent, remainingMonths);
      } else if (strategy === 'reduce_tenure') {
        remainingMonths = computeRemainingMonths(remainingPrincipal, monthlyRate, currentEmi);
      }
    }

    const actualInterest = remainingPrincipal * monthlyRate;
    let actualPrincipalPay = Math.min(currentEmi - actualInterest, remainingPrincipal);
    if (actualPrincipalPay < 0) actualPrincipalPay = 0;

    const opening = remainingPrincipal;
    remainingPrincipal = Math.max(0, remainingPrincipal - actualPrincipalPay);
    totalInterest += actualInterest;

    schedule.push({
      index: installmentIndex,
      monthLabel: `Month ${installmentIndex}`,
      opening,
      emi: (remainingPrincipal === 0 ? (actualPrincipalPay + actualInterest) : currentEmi),
      interest: actualInterest,
      principal: actualPrincipalPay,
      prepayment: prepaymentApplied,
      closing: remainingPrincipal
    });

    if (remainingPrincipal <= 0.01) { remainingPrincipal = 0; break; }

    remainingMonths -= 1;
    if (installmentIndex > 2400) break;
  }

  return { schedule, totalInterest, strategyEmi: schedule.length ? schedule[0].emi : 0 };
}

