/**
 * Shared formatting utilities for transaction values and dates.
 * Centralizes logic that was duplicated across PendingPage and HistoryPage.
 */

const CURRENCY_SYMBOLS: Record<string, string> = { 'EUR': '€', 'BRL': 'R$', 'USD': '$' };

export function formatAmount(amount: number | string, currencyCode: string = 'EUR') {
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

export function formatCurrencyValue(amount: number | string, currencyCode: string = 'EUR') {
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

export function formatDate(dateStr: string | undefined | null) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
