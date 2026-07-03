import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
    const TestApp = () => (
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/login" element={<div data-testid="login">Login Page</div>} />
                <Route path="/protected" element={
                    <ProtectedRoute>
                        <div data-testid="protected-content">Protected Content</div>
                    </ProtectedRoute>
                } />
            </Routes>
        </MemoryRouter>
    );

    it('renders children if session exists', () => {
        AuthContextModule.useAuth.mockReturnValue({ session: { user: 'test' } });
        render(<TestApp />);
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('login')).not.toBeInTheDocument();
    });

    it('redirects to login if no session', () => {
        AuthContextModule.useAuth.mockReturnValue({ session: null });
        render(<TestApp />);
        expect(screen.getByTestId('login')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
});
