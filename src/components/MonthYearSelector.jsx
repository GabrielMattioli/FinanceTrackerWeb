import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getYearlySummary } from '../api/api';

const ABBR_MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function YearSelector({ year, onYearChange }) {
    return (
        <div className="year-selector">
            <button className="btn-icon" onClick={() => onYearChange(year - 1)}>
                <ChevronLeft size={16} />
            </button>
            <span className="current-year">{year}</span>
            <button className="btn-icon" onClick={() => onYearChange(year + 1)}>
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

YearSelector.propTypes = {
    year: PropTypes.number.isRequired,
    onYearChange: PropTypes.func.isRequired,
};

export function MonthBar({ year, month, onMonthChange, allowAllMonths }) {
    const [yearlyData, setYearlyData] = useState([]);
    const now = new Date();
    const currentRealMonth = now.getMonth() + 1;
    const currentRealYear = now.getFullYear();

    useEffect(() => {
        let isMounted = true;
        getYearlySummary(year)
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
                    onClick={() => onMonthChange('')}
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
                        onClick={() => onMonthChange(m.month)}
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

MonthBar.propTypes = {
    year: PropTypes.number.isRequired,
    month: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onMonthChange: PropTypes.func.isRequired,
    allowAllMonths: PropTypes.bool,
};

MonthBar.defaultProps = {
    month: null,
    allowAllMonths: false,
};
