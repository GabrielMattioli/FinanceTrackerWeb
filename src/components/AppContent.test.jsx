import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppContent from './AppContent';

// We mock pages to avoid complex rendering inside AppContent
vi.mock('../pages/DashboardPage', () => ({ default: () => <div data-testid="dashboard-page">Dashboard Mock</div> }));
vi.mock('../pages/PendingPage', () => ({ default: () => <div data-testid="pending-page">Pending Mock</div> }));
vi.mock('../pages/HistoryPage', () => ({ default: () => <div data-testid="history-page">History Mock</div> }));
vi.mock('../pages/CategoriesPage', () => ({ default: () => <div data-testid="categories-page">Categories Mock</div> }));
vi.mock('../pages/SettingsPage', () => ({ default: () => <div data-testid="settings-page">Settings Mock</div> }));

vi.mock('../api/api', () => ({
    getPending: vi.fn().mockResolvedValue({ totalElements: 5 }),
    default: { post: vi.fn() } // For sidebar shutdown
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ signOut: vi.fn() })
}));

describe('AppContent Layout & Routing', () => {
    it('redirects to dashboard by default', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <AppContent />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        });
    });

    it('renders pending page on /pending', async () => {
        render(
            <MemoryRouter initialEntries={['/pending']}>
                <AppContent />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('pending-page')).toBeInTheDocument();
            expect(screen.getByText('Transações Pendentes')).toBeInTheDocument(); // Title injected by AppContent in Topbar
        });
    });
});
