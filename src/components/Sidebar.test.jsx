import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('Sidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ signOut: vi.fn() });
    });

    it('renders navigation links and pending count', () => {
        render(
            <MemoryRouter>
                <Sidebar pendingCount={5} />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Pendentes')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Badge
    });

    it('renders 99+ for pending count > 99', () => {
        render(
            <MemoryRouter>
                <Sidebar pendingCount={150} />
            </MemoryRouter>
        );

        expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('handles logout correctly', () => {
        const mockSignOut = vi.fn();
        useAuth.mockReturnValue({ signOut: mockSignOut });

        render(
            <MemoryRouter>
                <Sidebar pendingCount={0} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Log out'));
        expect(mockSignOut).toHaveBeenCalled();
    });
});
