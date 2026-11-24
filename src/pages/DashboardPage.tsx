import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { useSettings } from '../context/SettingsContext';
import { useDashboardSummary } from '../hooks/queries/useDashboardQueries';

import StatGrid from '../components/dashboard/StatGrid';
import SafetyMarginCard from '../components/dashboard/SafetyMarginCard';
import FixedExpensesCard from '../components/dashboard/FixedExpensesCard';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';

export default function DashboardPage() {
  const { baseCurrency } = useSettings();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [slideClass, setSlideClass] = useState('');
  const timersRef = useRef<number[]>([]);

  const { data, isPending, isError } = useDashboardSummary(year, month);

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar dashboard.');
    }
  }, [isError]);

  useEffect(() => {
    return () => {
      for (const timerId of timersRef.current) {
        window.clearTimeout(timerId);
      }
      timersRef.current = [];
    };
  }, []);

  const clearScheduledAnimations = () => {
    for (const timerId of timersRef.current) {
      window.clearTimeout(timerId);
    }
    timersRef.current = [];
  };

  const handleYearChange = (newYear: number) => {
    clearScheduledAnimations();
    const direction = newYear > year ? 'left' : 'right';
    setSlideClass(`slide-out-${direction}`);
    const t1 = window.setTimeout(() => {
      setYear(newYear);
      setSlideClass(`slide-in-${direction}`);
      const t2 = window.setTimeout(() => setSlideClass(''), 350);
      timersRef.current.push(t2);
    }, 200);
    timersRef.current.push(t1);
  };

  const handleMonthChange = (newMonth: number | string) => {
    const m = Number(newMonth);
    if (m === month) return;
    clearScheduledAnimations();
    setSlideClass('fade-out');
    const t1 = window.setTimeout(() => {
      setMonth(m);
      setSlideClass('fade-in');
      const t2 = window.setTimeout(() => setSlideClass(''), 300);
      timersRef.current.push(t2);
    }, 150);
    timersRef.current.push(t1);
  };

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
        <MonthBar
          year={year}
          month={month}
          onMonthChange={handleMonthChange}
          allowAllMonths={false}
        />
      </div>

      <div className={`dashboard-slide-wrapper ${slideClass}`}>
        {isPending ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StatGrid data={data ?? null} baseCurrency={baseCurrency} year={year} month={month} />
            {year === now.getFullYear() && month === now.getMonth() + 1 && (
              <SafetyMarginCard data={data ?? null} baseCurrency={baseCurrency} />
            )}
            <FixedExpensesCard
              data={data ?? null}
              baseCurrency={baseCurrency}
              year={year}
              month={month}
            />
            <DashboardCharts
              data={data ?? null}
              baseCurrency={baseCurrency}
              year={year}
              month={month}
            />
          </>
        )}
      </div>
    </div>
  );
}
