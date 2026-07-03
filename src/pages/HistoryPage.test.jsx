import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HistoryPage from './HistoryPage';
import * as api from '../api/api';

vi.mock('../api/api', () => ({
    getHistory: vi.fn(),
    getCategories: vi.fn(),
    getLatestDashboardMonth: vi.fn().mockResolvedValue({ year: 2024, month: 1 }),
    getYearlySummary: vi.fn().mockResolvedValue({ months: [] }),
}));

describe('HistoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders history transactions', async () => {
        api.getHistory.mockResolvedValue({
            content: [
                { id: '1', date: '2024-01-01', description: 'History Item', amount: 100, type: 'INCOME', category_id: 1, categories: { id: 1, name: 'Salary', color: '#000' } }
            ],
            totalElements: 1,
            totalPages: 1
        });
        api.getCategories.mockResolvedValue([{ id: 1, name: 'Salary', color: '#000' }]);

        render(<HistoryPage />);

        await waitFor(() => {
            expect(screen.getByText('History Item')).toBeInTheDocument();
            expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
        });
    });
});
