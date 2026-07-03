import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatAmount, formatCurrencyValue, formatDate } from './formatters';

describe('formatters', () => {
    describe('formatAmount', () => {
        it('formats an EXPENSE correctly', () => {
            render(formatAmount(1500.5, 'EXPENSE', 'EUR'));
            const span = screen.getByText('- € 1.500,50');
            expect(span).toBeInTheDocument();
            expect(span).toHaveClass('amount-expense');
        });

        it('formats an INCOME correctly', () => {
            render(formatAmount(2000, 'INCOME', 'BRL'));
            const span = screen.getByText('+ R$ 2.000,00');
            expect(span).toBeInTheDocument();
            expect(span).toHaveClass('amount-income');
        });
        
        it('defaults to EUR when no currency is provided', () => {
            render(formatAmount(10, 'INCOME'));
            const span = screen.getByText('+ € 10,00');
            expect(span).toBeInTheDocument();
        });
    });

    describe('formatCurrencyValue', () => {
        it('formats currency correctly without span', () => {
            expect(formatCurrencyValue(1500.5, 'EUR')).toBe('€ 1.500,50');
            expect(formatCurrencyValue(2000, 'BRL')).toBe('R$ 2.000,00');
            expect(formatCurrencyValue(99.99, 'USD')).toBe('$ 99,99');
        });

        it('defaults to EUR when no currency is provided', () => {
            expect(formatCurrencyValue(1500.5)).toBe('€ 1.500,50');
        });
    });

    describe('formatDate', () => {
        it('converts yyyy-MM-dd to dd/MM/yyyy', () => {
            expect(formatDate('2023-10-25')).toBe('25/10/2023');
            expect(formatDate('2024-01-05')).toBe('05/01/2024');
        });
    });
});
