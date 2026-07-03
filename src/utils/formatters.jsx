/**
 * Shared formatting utilities for transaction values and dates.
 * Centralizes logic that was duplicated across PendingPage and HistoryPage.
 */

export function formatAmount(amount, currencyCode = 'EUR') {
    const numAmount = Number(amount);
    const isExpense = numAmount < 0;
    const sign = isExpense ? '-' : '+';
    const cls = isExpense ? 'amount-expense' : 'amount-income';
    
    const formattedNum = Math.abs(numAmount).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const currencySymbols = { 'EUR': '€', 'BRL': 'R$', 'USD': '$' };
    const symbol = currencySymbols[currencyCode] || '€';

    return (
        <span className={cls}>
            {sign} {symbol} {formattedNum}
        </span>
    );
}

export function formatCurrencyValue(amount, currencyCode = 'EUR') {
    const formattedNum = Number(amount).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const currencySymbols = { 'EUR': '€', 'BRL': 'R$', 'USD': '$' };
    const symbol = currencySymbols[currencyCode] || '€';
    return `${symbol} ${formattedNum}`;
}

/**
 * Converts an ISO date string (yyyy-MM-dd) to Portuguese display format (dd/MM/yyyy).
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
