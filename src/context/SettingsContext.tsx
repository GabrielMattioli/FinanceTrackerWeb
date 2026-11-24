import React, { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import {
  getSettings,
  updateCurrency as apiUpdateCurrency,
  updateInitialBalance as apiUpdateInitialBalance,
  dismissOnboarding as apiDismissOnboarding,
  updateExpectedMonthlyIncome as apiUpdateExpectedMonthlyIncome,
} from '../api/settings';
import { queryKeys } from '../lib/queryKeys';
import type { UserSettings } from '../types/domain';

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

const DEFAULT_SETTINGS: UserSettings = {
  baseCurrency: 'EUR',
  initialBalance: 0,
  expectedMonthlyIncome: null,
  has_seen_onboarding: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: user ? queryKeys.settings.byUser(user.id) : queryKeys.settings.all,
    queryFn: getSettings,
    enabled: Boolean(user),
  });

  const currentSettings = user ? (settingsQuery.data ?? DEFAULT_SETTINGS) : DEFAULT_SETTINGS;

  const patchLocalCache = (updater: (prev: UserSettings) => UserSettings) => {
    if (!user) return;
    qc.setQueryData<UserSettings>(queryKeys.settings.byUser(user.id), (prev) =>
      updater(prev ?? DEFAULT_SETTINGS)
    );
  };

  const dismissMutation = useMutation({
    mutationFn: apiDismissOnboarding,
    onSuccess: () => {
      patchLocalCache((prev) => ({ ...prev, has_seen_onboarding: true }));
    },
  });

  const expectedIncomeMutation = useMutation({
    mutationFn: apiUpdateExpectedMonthlyIncome,
    onSuccess: (data) => {
      patchLocalCache((prev) => ({
        ...prev,
        expectedMonthlyIncome: data.expectedMonthlyIncome,
      }));
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const currencyMutation = useMutation({
    mutationFn: apiUpdateCurrency,
    onSuccess: (data) => {
      if (data.baseCurrency) {
        patchLocalCache((prev) => ({ ...prev, baseCurrency: data.baseCurrency ?? 'EUR' }));
      }
    },
  });

  const initialBalanceMutation = useMutation({
    mutationFn: apiUpdateInitialBalance,
    onSuccess: (data) => {
      patchLocalCache((prev) => ({
        ...prev,
        initialBalance: data.initialBalance ?? 0,
      }));
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  return (
    <SettingsContext.Provider
      value={{
        baseCurrency: currentSettings.baseCurrency,
        initialBalance: currentSettings.initialBalance,
        expectedIncome: currentSettings.expectedMonthlyIncome,
        loadingSettings: Boolean(user) && settingsQuery.isPending,
        hasSeenOnboarding: currentSettings.has_seen_onboarding,
        updateExpectedIncome: async (val) => {
          await expectedIncomeMutation.mutateAsync(val);
        },
        updateBaseCurrency: async (newCurrency) => {
          await currencyMutation.mutateAsync(newCurrency);
        },
        updateInitialBalance: async (val) => {
          await initialBalanceMutation.mutateAsync(val);
        },
        dismissOnboarding: async () => {
          await dismissMutation.mutateAsync();
        },
      }}
    >
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
