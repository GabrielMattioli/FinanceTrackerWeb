import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSettings, updateCurrency as apiUpdateCurrency, updateInitialBalance as apiUpdateInitialBalance } from '../api/settings';

interface SettingsContextType {
    baseCurrency: string;
    initialBalance: number;
    updateInitialBalance: (val: number) => Promise<void>;
    updateBaseCurrency: (newCurrency: string) => Promise<void>;
    loadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] = useState({ baseCurrency: 'EUR', initialBalance: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        getSettings()
            .then(data => {
                if (!isMounted) return;
                const currency = data?.baseCurrency || 'EUR';
                const initBal = data?.initialBalance || 0;
                setSettings(prev => ({ ...prev, baseCurrency: currency, initialBalance: initBal }));
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

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
            if (data && data.initialBalance !== undefined) {
                setSettings(prev => ({ ...prev, initialBalance: Number(data.initialBalance) }));
            }
        } catch (err) {
            console.error('Failed to update initial balance', err);
            throw err;
        }
    };

    const value = {
        baseCurrency: settings.baseCurrency,
        initialBalance: settings.initialBalance,
        updateInitialBalance,
        updateBaseCurrency,
        loadingSettings: loading
    };

    return (
        <SettingsContext.Provider value={value}>
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
