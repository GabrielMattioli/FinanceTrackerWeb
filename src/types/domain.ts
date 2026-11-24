import type { Tables } from './supabase';

export type CategoryRow = Tables<'categories'>;
export type CategoryRuleRow = Tables<'category_rules'>;
export type TransactionRow = Tables<'transactions'>;
export type SettingsRow = Tables<'settings'>;

export interface CategorySummary {
  id: string;
  name: string;
  color: string | null;
}

export interface Category extends CategoryRow {
  isEssential: boolean;
  isSavings: boolean;
  isMainIncome: boolean;
}

export interface CategoryInput {
  name: string;
  color: string;
  isEssential: boolean;
  isSavings: boolean;
  isMainIncome: boolean;
}

export interface CategoryRule extends CategoryRuleRow {
  category: CategorySummary | null;
}

export interface CategoryRuleInput {
  keyword: string;
  categoryId: string;
}

export interface Transaction extends TransactionRow {
  category: CategorySummary | null;
}

export interface UserSettings {
  baseCurrency: string;
  initialBalance: number;
  expectedMonthlyIncome: number | null;
  has_seen_onboarding: boolean;
}

export interface SettingsPatch {
  base_currency?: string;
  initial_balance?: number;
  expected_monthly_income?: number | null;
  has_seen_onboarding?: boolean;
}

export interface YearlyMonthSummary {
  month: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  hasData: boolean;
}
