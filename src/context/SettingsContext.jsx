import React, { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { getSettings, updateCurrency as apiUpdateCurrency } from '../api/api';

const SettingsContext = createContext(undefined);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({ baseCurrency: 'EUR' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        getSettings()
            .then(data => {
                if (!isMounted) return;
                // Prefer normalized baseCurrency, fallback to snake_case if api isn't updated yet
                const currency = data?.baseCurrency || data?.base_currency || 'EUR';
                setSettings(prev => ({ ...prev, baseCurrency: currency }));
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const updateBaseCurrency = async (newCurrency) => {
        try {
            const data = await apiUpdateCurrency(newCurrency);
            if (data?.baseCurrency) {
                setSettings(prev => ({ ...prev, baseCurrency: data.baseCurrency }));
            }
        } catch (err) {
            console.error('Failed to update currency', err);
            throw err;
        }
    };

    const value = {
        baseCurrency: settings.baseCurrency,
        updateBaseCurrency,
        loadingSettings: loading
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

SettingsProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
