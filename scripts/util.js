export function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  return Number(String(value).replace(/[,\s]/g, ""));
}

export function clamp(num, min, max) { return Math.min(Math.max(num, min), max); }

export function daysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }

export function addMonths(date, months, dayOfMonth) {
  const base = new Date(date.getTime());
  const targetYear = base.getFullYear();
  const targetMonthIndex = base.getMonth() + months;
  const normalized = new Date(targetYear, targetMonthIndex, 1);

  const requestedDay = typeof dayOfMonth === "number" ? dayOfMonth : base.getDate();
  normalized.setDate(Math.min(requestedDay, daysInMonth(normalized.getFullYear(), normalized.getMonth())));
  return normalized;
}

export function alignToEmiDay(date, emiDay) {
  const d = new Date(date);
  d.setDate(Math.min(emiDay, daysInMonth(d.getFullYear(), d.getMonth())));
  return d;
}

export function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatINR(n, fractionDigits = 2) {
  if (!isFinite(n)) return "-";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(n);
  } catch (_) {
    return ("₹" + Number(n).toFixed(fractionDigits));
  }
}

export function formatNum(n, fractionDigits = 2) {
  if (!isFinite(n)) return "-";
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: fractionDigits, minimumFractionDigits: 0 }).format(n);
  } catch (_) {
    return String(n);
  }
}

export function formatDate(d) {
  try {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  } catch (_) {
    return d.toISOString().slice(0,10);
  }
}

