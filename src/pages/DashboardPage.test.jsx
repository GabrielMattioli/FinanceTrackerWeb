import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import * as api from '../api/api';
import { SettingsProvider } from '../context/SettingsContext';

vi.mock('../api/api', () => ({
    getSettings: vi.fn().mockResolvedValue({ baseCurrency: 'EUR' }),
    getLatestDashboardMonth: vi.fn().mockResolvedValue({ year: 2024, month: 1 }),
    getDashboardSummary: vi.fn().mockResolvedValue({
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        categoryBreakdown: [],
        dailyExpenses: [],
        safeMoneyMargin: 0,
        expectedEssentialOutflow: 0
    }),
    getYearlySummary: vi.fn().mockResolvedValue({ months: [] }),
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dashboard with summary data', async () => {
        api.getSettings.mockResolvedValue({ baseCurrency: 'EUR' });
        api.getLatestDashboardMonth.mockResolvedValue({ year: 2024, month: 1 });
        api.getDashboardSummary.mockResolvedValue({
            totalIncome: 5000,
            totalExpense: 2000,
            netBalance: 3000,
            categoryBreakdown: [],
            dailyExpenses: [],
            safeMoneyMargin: 0,
            expectedEssentialOutflow: 0
        });

        render(
            <SettingsProvider>
                <DashboardPage />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(api.getDashboardSummary).toHaveBeenCalledWith(2024, 1);
            expect(screen.getByText('Total de Entradas')).toBeInTheDocument();
            expect(screen.getByText('Total de Saídas')).toBeInTheDocument();
            expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
        });
    });
});
