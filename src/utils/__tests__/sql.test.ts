import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from '../sql';

describe('escapeLikePattern', () => {
  it('escapes PostgreSQL LIKE wildcards and backslashes', () => {
    expect(escapeLikePattern('100% Cashback')).toBe('100\\% Cashback');
    expect(escapeLikePattern('UBER_TRIP')).toBe('UBER\\_TRIP');
    expect(escapeLikePattern('A\\B%C_D')).toBe('A\\\\B\\%C\\_D');
  });

  it('leaves normal keywords unchanged', () => {
    expect(escapeLikePattern('Netflix')).toBe('Netflix');
    expect(escapeLikePattern('Mercado Livre')).toBe('Mercado Livre');
  });
});
