const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Formats rupees with Indian digit grouping, e.g. ₹12,500. */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

/** Compact rent label used on cards and map pins, e.g. ₹8.5k, ₹1.2L. */
export function formatRentCompact(amount: number): string {
  if (amount >= 100_000) return `₹${trim(amount / 100_000)}L`;
  if (amount >= 1_000) return `₹${trim(amount / 1_000)}k`;
  return `₹${amount}`;
}

const trim = (n: number): string => n.toFixed(1).replace(/\.0$/, '');
