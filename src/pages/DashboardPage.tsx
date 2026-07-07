// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, LabelList,
    ReferenceArea
} from 'recharts';
import { ShieldCheck, AlertCircle, Info, TrendingDown, Target } from 'lucide-react';
import { getDashboardSummary, getLatestDashboardMonth } from '../api/dashboard';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { useSettings } from '../context/SettingsContext';
import { formatCurrencyValue } from '../utils/formatters';

const MONTHS = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SEM_CATEGORIA_COLOR = '#6b7280';

function StatCard({ label, value, type, baseCurrency, note = null }) {
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

const DonutTooltip = ({ active = false, payload = null, baseCurrency, totalIncome = 0 }) => {
    if (active && payload && payload.length) {
        const { name, value, color } = payload[0].payload;
        const pct = totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : 0;
        return (
            <div className="custom-tooltip" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', maxWidth: 260 }}>
                <div className="ct-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    {name}
                </div>
                <div className="ct-value">{formatCurrencyValue(value, baseCurrency)}</div>
                {totalIncome > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% da Entrada</div>}
            </div>
        );
    }
    return null;
};

const BarTooltip = ({ active = false, payload = null, baseCurrency }) => {
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
function BarValueLabel({ x = 0, y = 0, width = 0, height = 0, value = 0, pct, baseCurrency }) {
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
    const [data, setData] = useState<any>(null);
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

    // ── Pie chart data ─────────────────────────────────────────────────────────
    const totalIncomeForPie = Number(data?.totalIncome || 0);
    const pieData = [...barData];
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
                <MonthBar year={year} month={month} onMonthChange={setMonth} allowAllMonths={false} />
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

                        {/* Safety Margin Visual Bar - Redesigned for "Financial Health" */}
                        {(() => {
                            const accBal = Number(data?.accumulatedBalance ?? data?.netBalance ?? 0);
                            const pendingIncome = Number(data?.pendingIncome || 0);
                            const effectiveBal = accBal + pendingIncome;
                            const safe = Number(data?.safeMoneyMargin || 0);
                            const expectedTotal = Number(data?.expectedEssentialOutflow || 0);
                            const reserved = Math.max(0, effectiveBal - safe);

                            const safePctCalc = effectiveBal > 0 ? (safe / effectiveBal) * 100 : 0;
                            
                            let statusColor = '#10b981';
                            let statusMsg = '';
                            let StatusIcon = ShieldCheck;
                            
                            if (safe <= 0) {
                                statusColor = '#f43f5e'; // Red (Crítico)
                                statusMsg = "Crítico: Saldo livre esgotado! Foque apenas no essencial.";
                                StatusIcon = AlertCircle;
                            } else if (safePctCalc < 15) {
                                statusColor = '#f97316'; // Orange (Aperto)
                                statusMsg = "Aperto: Quase todo o seu saldo projetado está comprometido.";
                                StatusIcon = AlertCircle;
                            } else if (safePctCalc < 30) {
                                statusColor = '#f59e0b'; // Yellow (Atenção)
                                statusMsg = "Atenção: Sua folga é pequena. Cuidado com gastos não planejados.";
                                StatusIcon = Info;
                            } else if (safePctCalc < 50) {
                                statusColor = '#10b981'; // Green (Saudável)
                                statusMsg = "Saudável: Você tem uma boa margem para lazer e imprevistos.";
                                StatusIcon = ShieldCheck;
                            } else {
                                statusColor = '#3b82f6'; // Blue (Excelente)
                                statusMsg = "Excelente: Grande parte da sua renda está livre! Ótimo momento para investir.";
                                StatusIcon = ShieldCheck;
                            }

                            const statusClass = safe <= 0 ? 'danger' : (safePctCalc < 30 ? 'tight' : 'safe');

                            // Percentage calculation for the bar visual
                            let safePct = 0;
                            let reservedPct = 0;
                            if (effectiveBal > 0) {
                                reservedPct = Math.min(100, (reserved / effectiveBal) * 100);
                                safePct = Math.max(0, 100 - reservedPct);
                            } else {
                                reservedPct = 100;
                            }

                            return (
                                <div className={`card safety-card ${statusClass}`} style={{ marginBottom: 24, padding: '24px' }}>
                                    <div className="safety-status-label" style={{ color: statusColor }}>
                                        <StatusIcon size={18} className={safe <= 0 ? 'danger-icon' : ''} />
                                        <span>Saúde Financeira: Margem de Segurança</span>
                                    </div>

                                    <div style={{ marginTop: 16, marginBottom: 24, textAlign: 'center' }}>
                                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Livre para Gastar</div>
                                        <div style={{ fontSize: 42, fontWeight: 700, color: statusColor, letterSpacing: '-1px' }}>
                                            {formatCurrencyValue(safe, baseCurrency)}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                Total Projetado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrencyValue(effectiveBal, baseCurrency)}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                Contas Fixas: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrencyValue(expectedTotal, baseCurrency)}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--bg-input, var(--bg-secondary))', marginBottom: 12 }}>
                                        {effectiveBal > 0 ? (
                                            <>
                                                <div style={{ width: `${reservedPct}%`, backgroundColor: statusColor, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)', transition: 'width 0.5s ease-in-out' }} title={`Comprometido: ${reservedPct.toFixed(0)}%`} />
                                                <div style={{ width: `${safePct}%`, background: 'var(--text-muted)', opacity: 0.3 }} title={`Folga: ${safePct.toFixed(0)}%`} />
                                            </>
                                        ) : (
                                            <div style={{ width: '100%', backgroundColor: '#f43f5e', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)' }} title="Sem folga" />
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                                            <span>Comprometido ({reservedPct.toFixed(0)}%)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                                            <span>Folga ({safePct.toFixed(0)}%)</span>
                                        </div>
                                    </div>

                                    {safe <= 0 && (
                                        <div style={{ textAlign: 'center', color: '#f43f5e', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
                                            <TrendingDown size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                                            Excedido em {formatCurrencyValue(Math.abs(safe), baseCurrency)}
                                        </div>
                                    )}

                                    <div className="safety-tip">
                                        <Target size={16} />
                                        <span>
                                            <strong>Dica:</strong> {statusMsg} (Despesas Fixas Pendentes: <strong>{formatCurrencyValue(expectedTotal, baseCurrency)}</strong>
                                            {pendingIncome > 0 && <>, Receita Pendente Esperada: <strong>{formatCurrencyValue(pendingIncome, baseCurrency)}</strong></>})
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Fixed Expenses Tracking */}
                        {(() => {
                            const fixedExpenses = data?.fixedExpenses || [];
                            if (fixedExpenses.length === 0) return null;

                            return (
                                <div className="card" style={{ marginBottom: 24 }}>
                                    <div className="card-header" style={{ marginBottom: 20 }}>
                                        <h3 className="card-title">Despesas Fixas (Mês Passado)</h3>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status de pagamento baseado no mês passado</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {fixedExpenses.map((expense: any) => {
                                            const pct = expense.lastMonthAmount > 0 ? Math.min(100, (expense.currentSpent / expense.lastMonthAmount) * 100) : (expense.currentSpent > 0 ? 100 : 0);
                                            const isOverspent = expense.currentSpent > expense.lastMonthAmount && expense.lastMonthAmount > 0;

                                            return (
                                                <div key={expense.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: expense.color }} />
                                                            <span style={{ fontWeight: 600, fontSize: 15 }}>{expense.name}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                            {expense.isPaid ? (
                                                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <ShieldCheck size={16} /> Pago {isOverspent ? `(+${formatCurrencyValue(expense.currentSpent - expense.lastMonthAmount, baseCurrency)})` : ''}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <AlertCircle size={16} /> Pendente: {formatCurrencyValue(expense.pending, baseCurrency)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                                                        <span>Gasto: {formatCurrencyValue(expense.currentSpent, baseCurrency)}</span>
                                                        <span>Mês Passado: {formatCurrencyValue(expense.lastMonthAmount, baseCurrency)} {expense.isFirstMonth ? '(Sem Dados)' : ''}</span>
                                                    </div>
                                                    <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            background: expense.isPaid ? '#10b981' : expense.color,
                                                            width: `${pct}%`,
                                                            transition: 'width 0.5s ease-out',
                                                            borderRadius: 4
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Charts */}
                        <div className="charts-grid">

                            {/* ── Pie Chart — Consumption from Income ── */}
                            <div className="card">
                                <div className="card-header" style={{ marginBottom: 28 }}>
                                    <h3 className="card-title">Consumo da Entrada Principal</h3>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {MONTHS[month]} {year}
                                    </span>
                                </div>
                                {pieData.length === 0 ? (
                                    <div className="table-empty" style={{ padding: '40px 0' }}>
                                        <div className="empty-icon">🥧</div>
                                        <p>Sem dados para este período</p>
                                        <span>Importe transações para ver o consumo</span>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: 'relative', width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {/* Center Text Overlay */}
                                            <div style={{ position: 'absolute', pointerEvents: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Entrada Principal</div>
                                                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {formatCurrencyValue(totalIncomeForPie, baseCurrency)}
                                                </div>
                                            </div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={75}
                                                        outerRadius={100}
                                                        paddingAngle={0}
                                                        cornerRadius={8}
                                                        dataKey="value"
                                                        stroke="var(--bg-card)"
                                                        strokeWidth={4}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<DonutTooltip baseCurrency={baseCurrency} totalIncome={totalIncomeForPie} />} cursor={false} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Custom Legend Below Chart */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 12, padding: '0 8px' }}>
                                            {pieData.map((entry, idx) => {
                                                const pct = totalIncomeForPie > 0 ? ((entry.value / totalIncomeForPie) * 100).toFixed(1) : '0.0';
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                                                        <span style={{ whiteSpace: 'nowrap' }}>{entry.name} <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>({pct}%)</span></span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
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
                                                            ? ((Number(props.value) / totalExpense) * 100).toFixed(1)
                                                            : '0.0';
                                                        return (
                                                            <BarValueLabel
                                                                x={Number(props.x)}
                                                                y={Number(props.y)}
                                                                width={Number(props.width)}
                                                                height={Number(props.height)}
                                                                value={Number(props.value)}
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
