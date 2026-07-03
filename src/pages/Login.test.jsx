import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

vi.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
        }
    }
}));

vi.mock('react-hot-toast', () => {
    const t = vi.fn();
    t.success = vi.fn();
    t.error = vi.fn();
    return { default: t };
});

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form and submits', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByText('Faça login para gerenciar suas finanças')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(toast.success).toHaveBeenCalledWith('Login bem-sucedido!');
        });
    });

    it('shows error on login failure', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({ error: { message: 'Credenciais inválidas' } });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas');
        });
    });
});
