import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    PieChart, Pie, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { formatCurrencyValue } from '../../utils/formatters';

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

export default function DashboardCharts({ data, baseCurrency, year, month }: any) {
    // Bar chart data
    const categorizedItems = (data?.categoryBreakdown || []).map((c: any) => ({
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

    return (
        <div className="charts-grid">
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
