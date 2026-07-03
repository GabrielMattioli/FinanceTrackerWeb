import { createContext, useState, useEffect, useContext } from 'react';
import { getSettings, updateCurrency as apiUpdateCurrency } from '../api/api';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({ baseCurrency: 'EUR' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettings()
            .then(data => {
                if (data.baseCurrency) {
                    setSettings(prev => ({ ...prev, baseCurrency: data.baseCurrency }));
                }
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => setLoading(false));
    }, []);

    const updateBaseCurrency = async (newCurrency) => {
        try {
            const data = await apiUpdateCurrency(newCurrency);
            if (data.baseCurrency) {
                setSettings(prev => ({ ...prev, baseCurrency: data.baseCurrency }));
            }
        } catch (err) {
            console.error('Failed to update currency', err);
            throw err;
        }
    };

    return (
        <SettingsContext.Provider value={{
            baseCurrency: settings.baseCurrency,
            updateBaseCurrency,
            loadingSettings: loading
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
