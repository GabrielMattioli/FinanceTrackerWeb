import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

vi.mock('../supabaseClient', () => {
    return {
        supabase: {
            auth: {
                getSession: vi.fn(),
                onAuthStateChange: vi.fn(),
                signOut: vi.fn(),
            },
        },
    };
});

const TestComponent = () => {
    const { session, user, signOut } = useAuth();
    return (
        <div>
            <div data-testid="session">{session ? 'logged_in' : 'logged_out'}</div>
            <div data-testid="user">{user ? user.email : 'none'}</div>
            <button onClick={signOut}>Sign Out</button>
        </div>
    );
};

describe('AuthContext', () => {
    let mockUnsubscribe;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnsubscribe = vi.fn();
        supabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } }
        });
    });

    it('initializes and provides session state', async () => {
        const mockSession = { user: { email: 'test@example.com' } };
        supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Should initially not render children while loading
        expect(screen.queryByTestId('session')).not.toBeInTheDocument();

        // Wait for effect to finish
        await waitFor(() => {
            expect(screen.getByTestId('session')).toHaveTextContent('logged_in');
        });
        
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    it('handles sign out', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('session')).toHaveTextContent('logged_out');
        });

        screen.getByText('Sign Out').click();
        expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
});
