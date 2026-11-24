import type { GetHistoryParams, GetPendingParams } from '../api/transactions';

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    summary: (year: number, month: number) => ['dashboard', 'summary', year, month] as const,
    yearly: (year: number, categorizedOnly: boolean) =>
      ['dashboard', 'yearly', year, categorizedOnly] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    pendingRoot: ['transactions', 'pending'] as const,
    pending: (params: GetPendingParams) => ['transactions', 'pending', params] as const,
    pendingCount: ['transactions', 'pendingCount'] as const,
    historyRoot: ['transactions', 'history'] as const,
    history: (params: GetHistoryParams) => ['transactions', 'history', params] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  rules: {
    all: ['categoryRules'] as const,
  },
  settings: {
    all: ['settings'] as const,
    byUser: (userId: string) => ['settings', userId] as const,
  },
} as const;
