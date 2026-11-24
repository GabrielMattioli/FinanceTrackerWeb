import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { formatCurrencyValue } from '../../utils/formatters';
import { useYearlySummary } from '../../hooks/queries/useDashboardQueries';
import type { DashboardData, CategoryBreakdownItem } from '../../types/dashboard';

const SEM_CATEGORIA_COLOR = '#6b7280';
const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const ABBR_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
  baseCurrency: string;
}

const BarTooltip = ({ active = false, payload, baseCurrency }: BarTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const first = payload[0];
    return (
      <div
        className="custom-tooltip"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <div className="ct-label">{first.name}</div>
        <div className="ct-value">{formatCurrencyValue(first.value ?? 0, baseCurrency)}</div>
      </div>
    );
  }
  return null;
};

interface BarValueLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  pct: string;
  baseCurrency: string;
}

function BarValueLabel({ x, y, width, height, value, pct, baseCurrency }: BarValueLabelProps) {
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

interface MultiSeriesTooltipProps {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
  label?: string | number;
  labelPrefix?: string;
  baseCurrency: string;
}

function MultiSeriesTooltip({
  active = false,
  payload,
  label,
  labelPrefix = '',
  baseCurrency,
}: MultiSeriesTooltipProps) {
  if (active && payload && payload.length > 0) {
    return (
      <div
        className="custom-tooltip"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <div className="ct-label" style={{ marginBottom: 6 }}>
          {labelPrefix}
          {label}
        </div>
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 2 }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
            <strong>{formatCurrencyValue(entry.value ?? 0, baseCurrency)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

interface BurnDownPoint {
  day: number;
  real: number | undefined;
  prevMonth: number;
}

export default function DashboardCharts({
  data,
  baseCurrency,
  year,
  month,
}: {
  data: DashboardData | null;
  baseCurrency: string;
  year: number;
  month: number;
}) {
  const navigate = useNavigate();
  const { data: yearlyData } = useYearlySummary(year, false);

  const barData = useMemo(() => {
    const categorizedItems = (data?.categoryBreakdown ?? []).map((c: CategoryBreakdownItem) => ({
      id: c.id,
      name: c.name,
      value: Number(c.total),
      color: c.color,
    }));

    const uncategorizedVal = Number(data?.uncategorizedTotal ?? 0);
    const barDataUnsorted =
      uncategorizedVal > 0
        ? [
            ...categorizedItems,
            {
              id: '__uncategorized__',
              name: 'Sem Categoria',
              value: uncategorizedVal,
              color: SEM_CATEGORIA_COLOR,
            },
          ]
        : categorizedItems;

    return [...barDataUnsorted].sort((a, b) => b.value - a.value);
  }, [data?.categoryBreakdown, data?.uncategorizedTotal]);

  const totalExpense = Number(data?.totalExpense ?? 0);
  const hasBarData = barData.length > 0;
  const barChartHeight = Math.max(200, barData.length * 44 + 20);

  const burnDownData = useMemo<BurnDownPoint[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyExpenses = data?.dailyExpenses ?? [];
    const prevMonthDailyExpenses = data?.prevMonthDailyExpenses ?? [];

    const result: BurnDownPoint[] = [];
    let cumulative = 0;
    let prevCumulative = 0;
    const dailyMap = new Map(dailyExpenses.map((d) => [d.day, d.total]));
    const prevMonthDailyMap = new Map(prevMonthDailyExpenses.map((d) => [d.day, d.total]));

    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    for (let d = 1; d <= daysInMonth; d++) {
      cumulative += dailyMap.get(d) ?? 0;
      prevCumulative += prevMonthDailyMap.get(d) ?? 0;

      result.push({
        day: d,
        real: isCurrentMonth && d > now.getDate() ? undefined : Math.round(cumulative * 100) / 100,
        prevMonth: Math.round(prevCumulative * 100) / 100,
      });
    }
    return result;
  }, [data?.dailyExpenses, data?.prevMonthDailyExpenses, year, month]);

  const yearlyChartData = useMemo(() => {
    const months = yearlyData?.months ?? [];
    return months.map((m) => ({
      name: ABBR_MONTHS[m.month - 1],
      monthNumber: m.month,
      income: Math.max(0, m.totalIncome),
      expense: Math.max(0, m.totalExpense),
    }));
  }, [yearlyData?.months]);

  const hasBurnDownData =
    (data?.dailyExpenses ?? []).length > 0 || (data?.prevMonthDailyExpenses ?? []).length > 0;
  const hasYearlyData = yearlyChartData.some((m) => m.income > 0 || m.expense > 0);

  const handleCategoryBarClick = (categoryId: string) => {
    if (categoryId === '__uncategorized__') {
      navigate('/pending');
      return;
    }
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      categoryId,
    });
    navigate(`/history?${params.toString()}`);
  };

  return (
    <div className="charts-grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header" style={{ marginBottom: 28 }}>
          <h3 className="card-title">Ritmo de Gastos</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Acumulado diário vs mês passado — {MONTHS[month]} {year}
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
              <Tooltip content={<MultiSeriesTooltip labelPrefix="Dia " baseCurrency={baseCurrency} />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="prevMonth"
                name="Mês Passado"
                stroke="var(--text-muted)"
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="real"
                name="Mês Atual"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header" style={{ marginBottom: 28 }}>
          <h3 className="card-title">Detalhamento por Categoria</h3>
          {hasBarData && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Clique em uma barra para filtrar o Histórico
            </span>
          )}
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
              <XAxis type="number" tick={false} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BarTooltip baseCurrency={baseCurrency} />}
                cursor={{ fill: 'var(--bg-hover)' }}
              />

              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                barSize={14}
                isAnimationActive={false}
                style={{ cursor: 'pointer' }}
                onClick={(_bar, index) => {
                  const item = barData[index];
                  if (item) handleCategoryBarClick(item.id);
                }}
              >
                {barData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  content={(props) => {
                    const numVal = Number(props.value ?? 0);
                    const pct =
                      totalExpense > 0 ? ((numVal / totalExpense) * 100).toFixed(1) : '0.0';
                    return (
                      <BarValueLabel
                        x={Number(props.x ?? 0)}
                        y={Number(props.y ?? 0)}
                        width={Number(props.width ?? 0)}
                        height={Number(props.height ?? 0)}
                        value={numVal}
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

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header" style={{ marginBottom: 28 }}>
          <h3 className="card-title">Evolução Anual — {year}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Entradas vs Saídas nos 12 meses
          </span>
        </div>
        {!hasYearlyData ? (
          <div className="table-empty" style={{ padding: '40px 0' }}>
            <div className="empty-icon">📅</div>
            <p>Sem movimentações registradas em {year}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearlyChartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCurrencyValue(v, baseCurrency)}
                width={90}
              />
              <Tooltip content={<MultiSeriesTooltip baseCurrency={baseCurrency} />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>
                )}
              />
              <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expense" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
