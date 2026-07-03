/**
 * Shared formatting utilities for transaction values and dates.
 * Centralizes logic that was duplicated across PendingPage and HistoryPage.
 */

const CURRENCY_SYMBOLS = { 'EUR': '€', 'BRL': 'R$', 'USD': '$' };

/**
 * Formats a transaction amount with its currency symbol and applies CSS classes based on income/expense.
 * @param {number|string} amount - The amount to format.
 * @param {string} [currencyCode='EUR'] - The 3-letter currency code.
 * @returns {import('react').ReactNode} The formatted amount wrapped in a span.
 */
export function formatAmount(amount, currencyCode = 'EUR') {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
        return <span className="amount-neutral">-</span>; // safe fallback
    }

    const isExpense = numAmount < 0;
    const sign = isExpense ? '-' : '+';
    const cls = isExpense ? 'amount-expense' : 'amount-income';
    
    const formattedNum = Math.abs(numAmount).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const symbol = CURRENCY_SYMBOLS[currencyCode] || '€';

    return (
        <span className={cls}>
            {sign} {symbol} {formattedNum}
        </span>
    );
}

/**
 * Formats a currency value to string without CSS classes.
 * @param {number|string} amount - The amount to format.
 * @param {string} [currencyCode='EUR'] - The 3-letter currency code.
 * @returns {string} The formatted string.
 */
export function formatCurrencyValue(amount, currencyCode = 'EUR') {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
        return '-'; // safe fallback
    }

    const formattedNum = numAmount.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const symbol = CURRENCY_SYMBOLS[currencyCode] || '€';
    
    return `${symbol} ${formattedNum}`;
}

/**
 * Converts an ISO date string (yyyy-MM-dd) to Portuguese display format (dd/MM/yyyy).
 * @param {string} dateStr - The ISO date string.
 * @returns {string} The formatted date string.
 */
export function formatDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
