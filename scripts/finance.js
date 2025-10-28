// No date utilities needed after simplifying to month-based schedule

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
  if (numerator <= 0) return 0;
  const n = -Math.log(numerator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n));
}

export function baselineSchedule(P, rAnnual, n) {
  const r = (rAnnual/100)/12;
  const emi = calculateEmi(P, rAnnual, n);
  let principal = P;
  let totalInterest = 0;
  for (let i=0;i<n;i++) {
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
    const amount = Number(String(cfg.amount||'').replace(/[,\s]/g, ''));
    if (!amount || amount <= 0) continue;
    const freq = cfg.frequency || 'once';
    if (freq === 'once') {
      instances.push({ monthOffset: 0, amount });
    } else if (freq === 'monthly' || freq === 'yearly') {
      const stepMonths = freq === 'monthly' ? 1 : 12;
      for (let m=0; m<1200; m+=stepMonths) {
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

