/**
 * Integer-cent monetary helpers to avoid IEEE 754 floating-point drift
 * in financial sums, comparisons, and balance projections.
 */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

export function sumAmounts(amounts: readonly number[]): number {
  let totalCents = 0;
  for (const amount of amounts) {
    totalCents += toCents(amount);
  }
  return fromCents(totalCents);
}
