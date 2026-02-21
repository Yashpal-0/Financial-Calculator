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

