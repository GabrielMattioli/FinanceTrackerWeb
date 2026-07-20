import { useState, useEffect } from 'react';
import { getDashboardSummary, getLatestDashboardMonth } from '../api/dashboard';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { useSettings } from '../context/SettingsContext';
import type { DashboardData } from '../types/dashboard';

// Components
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
    const [data, setData] = useState<DashboardData | null>(null);
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

    const load = async (y: number, m: number) => {
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

    const handleYearChange = (newYear: number) => {
        const direction = newYear > year ? 'left' : 'right';
        setSlideClass(`slide-out-${direction}`);
        setTimeout(() => {
            setYear(newYear);
            setSlideClass(`slide-in-${direction}`);
            setTimeout(() => setSlideClass(''), 350);
        }, 200);
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
                <MonthBar year={year} month={month} onMonthChange={(m) => setMonth(Number(m))} allowAllMonths={false} />
            </div>

            <div className={`dashboard-slide-wrapper ${slideClass}`}>
                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <StatGrid data={data} baseCurrency={baseCurrency} year={year} month={month} />
                        {year === now.getFullYear() && month === now.getMonth() + 1 && (
                            <SafetyMarginCard data={data} baseCurrency={baseCurrency} />
                        )}
                        <FixedExpensesCard data={data} baseCurrency={baseCurrency} year={year} month={month} onRefresh={() => load(year, month)} />
                        <DashboardCharts data={data} baseCurrency={baseCurrency} year={year} month={month} />
                    </>
                )}
            </div>
        </div>
    );
}
