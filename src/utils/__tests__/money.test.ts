import { describe, expect, it } from 'vitest';
import { fromCents, roundCurrency, sumAmounts, toCents } from '../money';

describe('money utilities', () => {
  it('converts decimal currency to integer cents without IEEE 754 drift', () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(fromCents(toCents(0.1) + toCents(0.2))).toBe(0.3);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(-1234.56)).toBe(-123456);
  });

  it('guards against NaN and Infinity', () => {
    expect(toCents(Number.NaN)).toBe(0);
    expect(toCents(Number.POSITIVE_INFINITY)).toBe(0);
    expect(roundCurrency(Number.NaN)).toBe(0);
  });

  it('sums floating-point arrays accurately', () => {
    expect(sumAmounts([0.1, 0.2, 0.3, -0.1])).toBe(0.5);
    expect(sumAmounts([100.15, 200.25, 300.6])).toBe(601);
  });
});
