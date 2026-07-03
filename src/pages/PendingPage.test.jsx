import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PendingPage from './PendingPage';
import * as api from '../api/api';

vi.mock('../api/api', () => ({
    getPending: vi.fn(),
    getCategories: vi.fn(),
}));

describe('PendingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no pending transactions', async () => {
        api.getPending.mockResolvedValue({ content: [], totalElements: 0 });
        api.getCategories.mockResolvedValue([]);

        render(<PendingPage onCountChange={vi.fn()} onRefreshCount={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Nenhuma transação pendente!')).toBeInTheDocument();
        });
    });

    it('renders pending transactions', async () => {
        api.getPending.mockResolvedValue({
            content: [
                { id: '1', date: '2024-01-01', description: 'Test', amount: -50, type: 'EXPENSE', category_id: null }
            ],
            totalElements: 1
        });
        api.getCategories.mockResolvedValue([]);

        render(<PendingPage onCountChange={vi.fn()} onRefreshCount={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Test')).toBeInTheDocument();
        });
    });
});
