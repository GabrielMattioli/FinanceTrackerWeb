import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrencyValue } from '../../utils/formatters';
import type { DashboardData } from '../../types/dashboard';

interface TrendInfo {
    pct: number;
    direction: 'up' | 'down' | 'neutral';
    favorable: boolean;
}

function getTrend(current: number, previous: number, invertFavorable = false): TrendInfo | null {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { pct: 100, direction: 'up', favorable: !invertFavorable };

    const pct = ((current - previous) / previous) * 100;
    const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
    const favorable = invertFavorable ? pct <= 0 : pct >= 0;

    return { pct: Math.abs(pct), direction, favorable };
}

function TrendBadge({ trend }: { trend: TrendInfo | null }) {
    if (!trend || trend.direction === 'neutral') return null;

    const color = trend.favorable ? '#10b981' : '#f43f5e';
    const Icon = trend.direction === 'up' ? TrendingUp : TrendingDown;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 600,
            color,
            marginTop: 4,
            padding: '2px 6px',
            borderRadius: 6,
            background: trend.favorable ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
        }}>
            <Icon size={12} />
            {trend.pct.toFixed(1)}%
        </div>
    );
}

function StatCard({ label, value, type, baseCurrency, trend = null, note = null }: {
    label: string;
    value: number;
    type: string;
    baseCurrency: string;
    trend?: TrendInfo | null;
    note?: string | null;
}) {
    const icon = type === 'income' ? '↑' : type === 'expense' ? '↓' : type === 'accumulated' ? '∑' : type === 'saved' ? '★' : '≈';
    return (
        <div className={`stat-card ${type}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{formatCurrencyValue(value, baseCurrency)}</div>
                <TrendBadge trend={trend} />
                {note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{note}</div>}
            </div>
        </div>
    );
}

export default function StatGrid({ data, baseCurrency, year, month }: { data: DashboardData | null; baseCurrency: string; year: number; month: number }) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Show Net Balance only for past months
    const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);

    // Calculate trends vs previous month
    const incomeTrend = getTrend(data?.totalIncome ?? 0, data?.prevMonthIncome ?? 0);
    const expenseTrend = getTrend(data?.totalExpense ?? 0, data?.prevMonthExpense ?? 0, true);
    const savedTrend = getTrend(data?.totalSaved ?? 0, data?.prevMonthSaved ?? 0);

    return (
        <div className="stat-grid">
            <StatCard label="Total de Entradas" value={data?.totalIncome ?? 0} type="income" baseCurrency={baseCurrency} trend={incomeTrend} />
            <StatCard label="Total de Saídas" value={data?.totalExpense ?? 0} type="expense" baseCurrency={baseCurrency} trend={expenseTrend} />
            <StatCard label="Total Poupado" value={data?.totalSaved ?? 0} type="saved" baseCurrency={baseCurrency} trend={savedTrend} />
            {isPastMonth && (
                <StatCard
                    label="Saldo Líquido"
                    value={data?.netBalance ?? 0}
                    type="net"
                    baseCurrency={baseCurrency}
                />
            )}
        </div>
    );
}
