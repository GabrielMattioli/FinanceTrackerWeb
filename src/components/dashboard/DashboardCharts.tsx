import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    PieChart, Pie, Tooltip, ResponsiveContainer, LabelList,
    LineChart, Line, Legend
} from 'recharts';
import { formatCurrencyValue } from '../../utils/formatters';
import type { DashboardData, CategoryBreakdownItem } from '../../types/dashboard';

const SEM_CATEGORIA_COLOR = '#6b7280';
const MONTHS = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DonutTooltip = ({ active = false, payload = null, baseCurrency, totalIncome = 0 }: any) => {
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

const BarTooltip = ({ active = false, payload = null, baseCurrency }: any) => {
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

function BarValueLabel({ x = 0, y = 0, width = 0, height = 0, value = 0, pct, baseCurrency }: any) {
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

function LineTooltip({ active = false, payload = null, label, baseCurrency }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px' }}>
                <div className="ct-label" style={{ marginBottom: 6 }}>Dia {label}</div>
                {payload.map((entry: any) => (
                    <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
                        <strong>{formatCurrencyValue(entry.value, baseCurrency)}</strong>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

export default function DashboardCharts({ data, baseCurrency, year, month }: { data: DashboardData | null; baseCurrency: string; year: number; month: number }) {
    // Bar chart data
    const categorizedItems = (data?.categoryBreakdown || []).map((c: CategoryBreakdownItem) => ({
        name: c.name,
        value: Number(c.total),
        color: c.color,
    }));

    const uncategorizedVal = Number(data?.uncategorizedTotal || 0);
    const barDataUnsorted = uncategorizedVal > 0
        ? [...categorizedItems, { name: 'Sem Categoria', value: uncategorizedVal, color: SEM_CATEGORIA_COLOR }]
        : categorizedItems;
    
    // Sort from highest spend to lowest
    const barData = [...barDataUnsorted].sort((a, b) => b.value - a.value);

    const totalExpense = Number(data?.totalExpense || 0);
    const hasBarData = barData.length > 0;

    // Pie chart data
    const totalIncomeForPie = Number(data?.totalIncome || 0);
    const pieData = [...barData];
    
    // Dynamic height for bar chart — 44px per item, min 200
    const barChartHeight = Math.max(200, barData.length * 44 + 20);

    // Burn-down chart data — cumulative daily expenses vs ideal pace
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyExpenses: { day: number; total: number }[] = data?.dailyExpenses || [];
    const prevMonthExpense = Number(data?.prevMonthExpense || 0);
    const idealTotal = prevMonthExpense > 0 ? prevMonthExpense : totalExpense;

    const burnDownData: { day: number; real: number; ideal: number }[] = [];
    let cumulative = 0;
    const dailyMap = new Map(dailyExpenses.map(d => [d.day, d.total]));

    for (let d = 1; d <= daysInMonth; d++) {
        cumulative += dailyMap.get(d) || 0;
        const idealValue = idealTotal > 0 ? (idealTotal / daysInMonth) * d : 0;

        // For the current month, only include days up to today
        const now = new Date();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
        if (isCurrentMonth && d > now.getDate()) {
            burnDownData.push({ day: d, real: undefined as any, ideal: Math.round(idealValue * 100) / 100 });
        } else {
            burnDownData.push({ day: d, real: Math.round(cumulative * 100) / 100, ideal: Math.round(idealValue * 100) / 100 });
        }
    }

    const hasBurnDownData = dailyExpenses.length > 0;

    return (
        <div className="charts-grid">
            {/* Burn-down Chart — Cumulative Daily Spending */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-header" style={{ marginBottom: 28 }}>
                    <h3 className="card-title">Ritmo de Gastos</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Acumulado diário vs ritmo ideal — {MONTHS[month]} {year}
                    </span>
                </div>
                {!hasBurnDownData ? (
                    <div className="table-empty" style={{ padding: '40px 0' }}>
                        <div className="empty-icon">📈</div>
                        <p>Sem dados de gastos diários</p>
                        <span>Importe transações para ver o ritmo</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={burnDownData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-color)' }}
                                tickLine={false}
                                interval={2}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: number) => formatCurrencyValue(v, baseCurrency)}
                                width={90}
                            />
                            <Tooltip content={<LineTooltip baseCurrency={baseCurrency} />} />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                            />
                            <Line
                                type="monotone"
                                dataKey="ideal"
                                name="Ritmo Ideal"
                                stroke="var(--text-muted)"
                                strokeDasharray="6 4"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="real"
                                name="Gasto Real"
                                stroke="#f43f5e"
                                strokeWidth={2.5}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
            {/* Pie Chart — Consumption from Income */}
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
                                        isAnimationActive={false}
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

            {/* Horizontal Bar Chart — Category Breakdown */}
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

                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
                                {barData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    content={(props: any) => {
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
    );
}
