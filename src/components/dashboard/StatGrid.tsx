import { formatCurrencyValue } from '../../utils/formatters';

function StatCard({ label, value, type, baseCurrency, note = null }: any) {
    const icon = type === 'income' ? '↑' : type === 'expense' ? '↓' : type === 'accumulated' ? '∑' : type === 'saved' ? '★' : '≈';
    return (
        <div className={`stat-card ${type}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{formatCurrencyValue(value, baseCurrency)}</div>
            {note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{note}</div>}
        </div>
    );
}

export default function StatGrid({ data, baseCurrency }: any) {
    return (
        <div className="stat-grid">
            <StatCard label="Total de Entradas" value={data?.totalIncome} type="income" baseCurrency={baseCurrency} />
            <StatCard label="Total de Saídas" value={data?.totalExpense} type="expense" baseCurrency={baseCurrency} />
            <StatCard label="Total Poupado" value={data?.totalSaved} type="saved" baseCurrency={baseCurrency} />
            <StatCard
                label="Saldo Líquido"
                value={data?.netBalance}
                type="net"
                baseCurrency={baseCurrency}
            />
            <StatCard
                label="Saldo Acumulado"
                value={data?.accumulatedBalance}
                type="accumulated"
                baseCurrency={baseCurrency}
                note={Number(data?.previousMonthBalance || 0) !== 0
                    ? `Inclui ${formatCurrencyValue(data.previousMonthBalance, baseCurrency)} de meses anteriores`
                    : null}
            />
        </div>
    );
}
