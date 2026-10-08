import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getSettings, updateCurrency as apiUpdateCurrency, updateInitialBalance as apiUpdateInitialBalance, dismissOnboarding as apiDismissOnboarding, updateExpectedMonthlyIncome as apiUpdateExpectedMonthlyIncome } from '../api/settings';

interface SettingsContextType {
    baseCurrency: string;
    initialBalance: number;
    expectedIncome: number | null;
    updateExpectedIncome: (val: number | null) => Promise<void>;
    updateInitialBalance: (val: number) => Promise<void>;
    updateBaseCurrency: (newCurrency: string) => Promise<void>;
    loadingSettings: boolean;
    hasSeenOnboarding: boolean;
    dismissOnboarding: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] = useState<{ baseCurrency: string, initialBalance: number, hasSeenOnboarding: boolean, expectedIncome: number | null }>({ baseCurrency: 'EUR', initialBalance: 0, hasSeenOnboarding: false, expectedIncome: null });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        let isMounted = true;
        
        if (!user) {
            setSettings({ baseCurrency: 'EUR', initialBalance: 0, hasSeenOnboarding: false, expectedIncome: null });
            setLoading(false);
            return;
        }

        setLoading(true);
        getSettings()
            .then(data => {
                if (!isMounted) return;
                const currency = data?.baseCurrency || 'EUR';
                const initBal = data?.initialBalance || 0;
                const hasSeen = data?.has_seen_onboarding || false;
                const expectedInc = data?.expectedMonthlyIncome ?? null;
                setSettings({ baseCurrency: currency, initialBalance: initBal, hasSeenOnboarding: hasSeen, expectedIncome: expectedInc });
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [user]);

    const dismissOnboarding = async () => {
        try {
            await apiDismissOnboarding();
            setSettings(prev => ({ ...prev, hasSeenOnboarding: true }));
        } catch (err) {
            console.error('Failed to dismiss onboarding', err);
            throw err;
        }
    };

    const updateExpectedIncome = async (val: number | null) => {
        try {
            const data = await apiUpdateExpectedMonthlyIncome(val);
            if (data && data.expectedMonthlyIncome !== undefined) {
                setSettings(prev => ({ ...prev, expectedIncome: data.expectedMonthlyIncome }));
            }
        } catch (err) {
            console.error('Failed to update expected income', err);
            throw err;
        }
    };

    const updateBaseCurrency = async (newCurrency: string) => {
        try {
            const data = await apiUpdateCurrency(newCurrency);
            if (data?.baseCurrency) {
                setSettings(prev => ({ ...prev, baseCurrency: data.baseCurrency as string }));
            }
        } catch (err) {
            console.error('Failed to update currency', err);
            throw err;
        }
    };

    const updateInitialBalance = async (val: number) => {
        try {
            const data = await apiUpdateInitialBalance(val);
            if (data?.initialBalance !== undefined) {
                setSettings(prev => ({ ...prev, initialBalance: data.initialBalance || 0 }));
            }
        } catch (err) {
            console.error('Failed to update initial balance', err);
            throw err;
        }
    };

    return (
        <SettingsContext.Provider value={{
            baseCurrency: settings.baseCurrency,
            initialBalance: settings.initialBalance,
            expectedIncome: settings.expectedIncome,
            loadingSettings: loading,
            hasSeenOnboarding: settings.hasSeenOnboarding,
            updateExpectedIncome,
            updateBaseCurrency,
            updateInitialBalance,
            dismissOnboarding
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
