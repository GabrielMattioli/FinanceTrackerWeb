import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, startTransition } from 'react';
import { getYearlySummary } from '../api/dashboard';

const ABBR_MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

interface YearSelectorProps {
    year: number;
    onYearChange: (year: number) => void;
}

export function YearSelector({ year, onYearChange }: YearSelectorProps) {
    return (
        <div className="year-selector">
            <button className="btn-icon" onClick={() => startTransition(() => onYearChange(year - 1))}>
                <ChevronLeft size={16} />
            </button>
            <span className="current-year">{year}</span>
            <button className="btn-icon" onClick={() => startTransition(() => onYearChange(year + 1))}>
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

interface MonthBarProps {
    year: number;
    month?: number | string | null;
    onMonthChange: (month: number | string) => void;
    allowAllMonths?: boolean;
    categorizedOnly?: boolean;
}

export function MonthBar({ year, month = null, onMonthChange, allowAllMonths = false, categorizedOnly = false }: MonthBarProps) {
    const [yearlyData, setYearlyData] = useState<any[]>([]);
    const now = new Date();
    const currentRealMonth = now.getMonth() + 1;
    const currentRealYear = now.getFullYear();

    useEffect(() => {
        let isMounted = true;
        getYearlySummary(year, categorizedOnly)
            .then(res => {
                if (isMounted) setYearlyData(res.months || []);
            })
            .catch(() => {
                if (isMounted) setYearlyData([]);
            });
            
        return () => {
            isMounted = false;
        };
    }, [year]);

    return (
        <div className="month-bar">
            {allowAllMonths && (
                <button
                    className={`month-tab ${month === '' || month === null ? 'active' : ''}`}
                    onClick={() => startTransition(() => onMonthChange(''))}
                >
                    Todos
                </button>
            )}

            {yearlyData.length > 0 ? yearlyData.map(m => {
                const isActive = m.month === month;
                const isPositive = m.netBalance >= 0;
                const isCurrentRealMonth = m.month === currentRealMonth && year === currentRealYear;

                let tabClass = 'month-tab';
                if (isActive) tabClass += ' active';

                if (!m.hasData) tabClass += ' no-data';
                else if (isPositive) tabClass += ' income-style';
                else tabClass += ' expense-style';

                return (
                    <button
                        key={m.month}
                        className={tabClass}
                        disabled={!m.hasData}
                        onClick={() => startTransition(() => onMonthChange(m.month))}
                        style={{ position: 'relative' }}
                    >
                        {ABBR_MONTHS[m.month - 1]}
                        {isCurrentRealMonth && (
                            <span className="month-tab-today-dot" title="Mês atual" />
                        )}
                    </button>
                );
            }) : ABBR_MONTHS.map((name, i) => (
                <button key={i} className="month-tab no-data" disabled>
                    {name}
                </button>
            ))}
        </div>
    );
}


