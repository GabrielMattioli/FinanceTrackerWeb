import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    LineChart, Line, Tooltip, ResponsiveContainer, LabelList,
    ReferenceLine, ReferenceArea
} from 'recharts';
import { ShieldCheck, AlertCircle, Info, TrendingDown, Target } from 'lucide-react';
import { getDashboardSummary, getLatestDashboardMonth } from '../api/api';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { useSettings } from '../context/SettingsContext';
import { formatCurrencyValue } from '../utils/formatters';

const MONTHS = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SEM_CATEGORIA_COLOR = '#6b7280';

function StatCard({ label, value, type, baseCurrency, note }) {
    const icon = type === 'income' ? '↑' : type === 'expense' ? '↓' : type === 'accumulated' ? '∑' : '≈';
    return (
        <div className={`stat-card ${type}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{formatCurrencyValue(value, baseCurrency)}</div>
            {note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{note}</div>}
        </div>
    );
}

const LineTooltip = ({ active, payload, label, baseCurrency }) => {
    if (active && payload && payload.length) {
        const transactions = payload[0]?.payload?.transactions || [];
        return (
            <div className="custom-tooltip" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', maxWidth: 260 }}>
                <div className="ct-label" style={{ marginBottom: 4 }}>Dia {label}</div>
                <div className="ct-value" style={{ marginBottom: transactions.length ? 8 : 0 }}>
                    {formatCurrencyValue(payload[0].value, baseCurrency)}
                </div>
                {transactions.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {transactions.map((tx, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{tx.description || '—'}</span>
                                <span style={{ whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 500 }}>{formatCurrencyValue(tx.amount, baseCurrency)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const BarTooltip = ({ active, payload, baseCurrency }) => {
    if (active && payload && payload.length) {
        const { name, value } = payload[0];
        return (
            <div className="custom-tooltip" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px' }}>
                <div className="ct-label">{name}</div>
                <div className="ct-value">{formatCurrencyValue(value, baseCurrency)}</div>
            </div>
        );
    }
    return null;
};

// Custom label rendered at the tip of each bar
function BarValueLabel({ x, y, width, height, value, pct, baseCurrency }) {
    if (!value) return null;
    return (
        <text
            x={x + width + 8}
            y={y + height / 2}
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--text-secondary)"
        >
            {formatCurrencyValue(value, baseCurrency)} ({pct}%)
        </text>
    );
}

export default function DashboardPage() {
    const { baseCurrency } = useSettings();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slideClass, setSlideClass] = useState('');
    const [initialised, setInitialised] = useState(false);

    // On first mount, jump to the latest month that has transaction data
    useEffect(() => {
        getLatestDashboardMonth()
            .then(({ year: y, month: m }) => {
                setYear(y);
                setMonth(m);
            })
            .catch(() => { /* keep current month defaults */ })
            .finally(() => setInitialised(true));
    }, []);

    const load = async (y, m) => {
        setLoading(true);
        try {
            const res = await getDashboardSummary(y, m);
            setData(res);
        } catch {
            toast.error('Erro ao carregar dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (initialised) load(year, month); }, [year, month, initialised]);

    const handleYearChange = (newYear) => {
        const direction = newYear > year ? 'left' : 'right';
        setSlideClass(`slide-out-${direction}`);
        setTimeout(() => {
            setYear(newYear);
            setSlideClass(`slide-in-${direction}`);
            setTimeout(() => setSlideClass(''), 350);
        }, 200);
    };

    // ── Bar chart data ─────────────────────────────────────────────────────────
    const categorizedItems = (data?.categoryBreakdown || []).map(c => ({
        name: c.name,
        value: Number(c.total),
        color: c.color,
    }));

    const uncategorizedVal = Number(data?.uncategorizedTotal || 0);
    const barDataUnsorted = uncategorizedVal > 0
        ? [...categorizedItems, { name: 'Sem Categoria', value: uncategorizedVal, color: SEM_CATEGORIA_COLOR }]
        : categorizedItems;
    // Sort from highest spend to lowest so the most impactful categories appear first
    const barData = [...barDataUnsorted].sort((a, b) => b.value - a.value);

    const totalExpense = Number(data?.totalExpense || 0);
    const hasBarData = barData.length > 0;

    // ── Line chart data ────────────────────────────────────────────────────────
    const lineData = (data?.dailyExpenses || []).map(d => ({
        day: d.day,
        total: Number(d.total),
        transactions: d.transactions || [],
    }));
    const hasLineData = lineData.length > 0;

    // Determine weekend day numbers for the selected month/year so we can highlight them
    const weekendDays = (() => {
        if (!hasLineData) return [];
        const daysInMonth = new Date(year, month, 0).getDate();
        const pairs = [];
        let i = 1;
        while (i <= daysInMonth) {
            const dow = new Date(year, month - 1, i).getDay(); // 0=Sun, 6=Sat
            if (dow === 6) { // Saturday — weekend starts here
                const sat = i;
                const sun = i + 1 <= daysInMonth ? i + 1 : i;
                pairs.push({ x1: sat - 0.5, x2: sun + 0.5 });
                i += 2;
            } else if (dow === 0) { // Sunday only (month starts on Sunday)
                pairs.push({ x1: i - 0.5, x2: i + 0.5 });
                i++;
            } else {
                i++;
            }
        }
        return pairs;
    })();

    // Dynamic height for bar chart — 44px per item, min 200
    const barChartHeight = Math.max(200, barData.length * 44 + 20);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Dashboard Financeiro</h2>
                    <p>Visão geral das suas finanças</p>
                </div>
                <YearSelector year={year} onYearChange={handleYearChange} />
            </div>

            <div style={{ marginBottom: 24 }}>
                <MonthBar year={year} month={month} onMonthChange={setMonth} />
            </div>

            <div className={`dashboard-slide-wrapper ${slideClass}`}>

            {loading ? (
                <div className="loading-page"><span className="spinner" /> Carregando...</div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stat-grid">
                        <StatCard label="Total de Entradas" value={data?.totalIncome} type="income" baseCurrency={baseCurrency} />
                        <StatCard label="Total de Saídas" value={data?.totalExpense} type="expense" baseCurrency={baseCurrency} />
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

                    {/* Safety Margin Visual Bar - Redesigned for "Financial Health" */}
                    {(() => {
                        const accBal = Number(data?.accumulatedBalance ?? data?.netBalance ?? 0);
                        const safe = Number(data?.safeMoneyMargin || 0);
                        const expectedTotal = Number(data?.expectedEssentialOutflow || 0);
                        const reserved = Math.max(0, accBal - safe);
                        const netBal = accBal; // alias so the rest of the block is unchanged
                        
                        const safePctCalc = netBal > 0 ? (safe / netBal) * 100 : 0;
                        const isNegative = safe <= 0;
                        const isTight = safe > 0 && safePctCalc < 20; // Less than 20% safe
                        
                        const statusClass = isNegative ? 'danger' : (isTight ? 'tight' : 'safe');
                        const StatusIcon = isNegative ? AlertCircle : (isTight ? Info : ShieldCheck);
                        
                        // Percentage calculation for the bar visual
                        let safePct = 0;
                        let reservedPct = 0;
                        if (netBal > 0) {
                            reservedPct = Math.min(100, (reserved / netBal) * 100);
                            safePct = Math.max(0, 100 - reservedPct);
                        } else {
                            reservedPct = 100;
                        }
                        
                        let statusMsg = "Tudo certo! Sua margem está saudável. Que tal poupar ou investir o excedente?";
                        if (isNegative) statusMsg = "Alerta: Saldo livre esgotado! Foque apenas em despesas essenciais.";
                        else if (isTight) statusMsg = "Atenção: Sua margem de segurança está baixa. Cuidado com gastos extras!";

                        return (
                            <div className={`card safety-card ${statusClass}`} style={{ marginBottom: 24, padding: '24px' }}>
                                <div className="safety-status-label" style={{ 
                                    color: isNegative ? '#f43f5e' : (isTight ? '#f59e0b' : 'var(--text-primary)') 
                                }}>
                                    <StatusIcon size={18} className={isNegative ? 'danger-icon' : ''} />
                                    <span>Saúde Financeira: Margem de Segurança</span>
                                </div>
                                    
                                <div className="safety-stats-row">
                                    <div className="safety-stat">
                                        <div className="label">Margem Livre</div>
                                        <div className="value" style={{ color: isNegative ? '#f43f5e' : 'var(--accent)' }}>
                                            {formatCurrencyValue(safe, baseCurrency)}
                                        </div>
                                    </div>
                                    
                                    <div className="safety-divider" />
                                    
                                    <div className="safety-stat">
                                        <div className="label">Reservado (Fixos)</div>
                                        <div className="value" style={{ color: 'var(--text-secondary)' }}>
                                            {formatCurrencyValue(reserved, baseCurrency)}
                                        </div>
                                    </div>

                                    <div className="safety-divider" />
                                    
                                    <div className="safety-stat">
                                        <div className="label">Saldo Líquido Total</div>
                                        <div className="value" style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrencyValue(netBal, baseCurrency)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="safety-bar-container">
                                    {netBal > 0 ? (
                                        <>
                                            <div className="safety-segment safe" style={{ width: `${safePct}%` }} title={`Margem Livre: ${formatCurrencyValue(safe, baseCurrency)}`} />
                                            <div className="safety-segment reserved" style={{ width: `${reservedPct}%` }} title={`Reservado (Fixos): ${formatCurrencyValue(reserved, baseCurrency)}`} />
                                        </>
                                    ) : (
                                        <div className="safety-segment danger" style={{ width: '100%' }} title="Sem saldo positivo" />
                                    )}
                                </div>

                                <div className="safety-legend" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <div className="legend-item">
                                            <div className="legend-dot" style={{ background: 'var(--accent)' }} />
                                            <span>Margem Livre: {safePct.toFixed(0)}%</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-dot" style={{ background: 'var(--text-muted)' }} />
                                            <span>Reservado (Fixos): {reservedPct.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    {isNegative && safe < 0 && (
                                        <div className="legend-item" style={{ color: '#f43f5e' }}>
                                            <TrendingDown size={14} />
                                            <span>Excedido em {formatCurrencyValue(Math.abs(safe), baseCurrency)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="safety-tip">
                                    <Target size={16} />
                                    <span>
                                        <strong>Dica:</strong> {statusMsg} (Previsão de essenciais: <strong>{formatCurrencyValue(expectedTotal, baseCurrency)}</strong>)
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Charts */}
                    <div className="charts-grid">

                        {/* ── Line Chart — Daily Expense Evolution ── */}
                        <div className="card">
                            <div className="card-header" style={{ marginBottom: 28 }}>
                                <h3 className="card-title">Evolução Diária de Gastos</h3>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {MONTHS[month]} {year}
                                </span>
                            </div>
                            {!hasLineData ? (
                                <div className="table-empty" style={{ padding: '40px 0' }}>
                                    <div className="empty-icon">📈</div>
                                    <p>Sem dados para este período</p>
                                    <span>Importe transações para ver a evolução diária</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={lineData} margin={{ left: 10, right: 30, top: 8, bottom: 15 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />

                                        {/* Weekend highlight bands */}
                                        {weekendDays.map((wd, i) => (
                                            <ReferenceArea
                                                key={i}
                                                x1={wd.x1}
                                                x2={wd.x2}
                                                fill="var(--weekend-band-fill, rgba(99,102,241,0.06))"
                                                strokeOpacity={0}
                                            />
                                        ))}

                                        <XAxis
                                            dataKey="day"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={v => `${v}`}
                                            label={{ value: 'Dia', position: 'insideBottomRight', offset: -10, fill: 'var(--text-muted)', fontSize: 11 }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={v => {
                                                const sym = ({ 'EUR': '€', 'BRL': 'R$', 'USD': '$' })[baseCurrency] || '€';
                                                if (v === 0) return `${sym}0`;
                                                if (v >= 1000) return `${sym}${(v / 1000).toFixed(1).replace('.0', '')}k`;
                                                return `${sym}${v}`;
                                            }}
                                            width={52}
                                        />
                                        <Tooltip content={<LineTooltip baseCurrency={baseCurrency} />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />

                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="var(--accent)"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: 'var(--accent-hover)', strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* ── Horizontal Bar Chart — Category Breakdown ── */}
                        <div className="card">
                            <div className="card-header" style={{ marginBottom: 28 }}>
                                <h3 className="card-title">Detalhamento por Categoria</h3>
                            </div>
                            {!hasBarData ? (
                                <div className="table-empty" style={{ padding: '40px 0' }}>
                                    <div className="empty-icon">📊</div>
                                    <p>Sem dados para este período</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={barChartHeight}>
                                    <BarChart
                                        data={barData}
                                        layout="vertical"
                                        margin={{ left: 0, right: 120, top: 4, bottom: 4 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={false}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                            width={110}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<BarTooltip baseCurrency={baseCurrency} />} cursor={{ fill: 'var(--bg-hover)' }} />

                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                                            {barData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                            <LabelList
                                                dataKey="value"
                                                position="right"
                                                content={(props) => {
                                                    const pct = totalExpense > 0
                                                        ? ((props.value / totalExpense) * 100).toFixed(1)
                                                        : '0.0';
                                                    return (
                                                        <BarValueLabel
                                                            {...props}
                                                            pct={pct}
                                                            baseCurrency={baseCurrency}
                                                        />
                                                    );
                                                }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                    </div>
                </>
            )}
            </div>
        </div>
    );
}
