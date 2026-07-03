import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import * as api from '../api/api';
import { SettingsProvider } from '../context/SettingsContext';

vi.mock('../api/api', () => ({
    getSettings: vi.fn().mockResolvedValue({ baseCurrency: 'EUR' }),
    getLatestDashboardMonth: vi.fn().mockResolvedValue({ year: 2024, month: 1 }),
    getDashboardSummary: vi.fn().mockResolvedValue({ income: 0, expense: 0, netBalance: 0, expensesByCategory: [] }),
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
            income: 5000,
            expense: 2000,
            netBalance: 3000,
            expensesByCategory: []
        });

        render(
            <SettingsProvider>
                <DashboardPage />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(api.getDashboardSummary).toHaveBeenCalledWith(2024, 1);
            expect(screen.getByText('Receitas')).toBeInTheDocument();
            expect(screen.getByText('Despesas')).toBeInTheDocument();
            expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
        });
    });
});
