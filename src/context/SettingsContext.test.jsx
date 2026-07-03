import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';
import * as api from '../api/api';

vi.mock('../api/api', () => ({
    getSettings: vi.fn(),
    updateCurrency: vi.fn(),
}));

const TestComponent = () => {
    const { baseCurrency, updateBaseCurrency, loadingSettings } = useSettings();
    return (
        <div>
            <div data-testid="loading">{loadingSettings ? 'loading' : 'done'}</div>
            <div data-testid="currency">{baseCurrency}</div>
            <button onClick={() => updateBaseCurrency('USD')}>Set USD</button>
        </div>
    );
};

describe('SettingsContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads settings and sets base currency', async () => {
        api.getSettings.mockResolvedValue({ baseCurrency: 'BRL' });

        render(
            <SettingsProvider>
                <TestComponent />
            </SettingsProvider>
        );

        expect(screen.getByTestId('loading')).toHaveTextContent('loading');
        
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('done');
            expect(screen.getByTestId('currency')).toHaveTextContent('BRL');
        });
    });

    it('updates currency through api', async () => {
        api.getSettings.mockResolvedValue({ baseCurrency: 'EUR' });
        api.updateCurrency.mockResolvedValue({ baseCurrency: 'USD' });

        render(
            <SettingsProvider>
                <TestComponent />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('currency')).toHaveTextContent('EUR');
        });

        screen.getByText('Set USD').click();

        await waitFor(() => {
            expect(api.updateCurrency).toHaveBeenCalledWith('USD');
            expect(screen.getByTestId('currency')).toHaveTextContent('USD');
        });
    });
});
