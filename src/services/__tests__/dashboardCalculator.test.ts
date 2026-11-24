import { describe, expect, it } from 'vitest';
import {
  computeDashboardMetrics,
  computeYearlySummary,
  type DashboardTransactionInput,
  type YearlyTransactionInput,
} from '../dashboardCalculator';

const makeTx = (overrides: Partial<DashboardTransactionInput>): DashboardTransactionInput => ({
  id: 'tx-1',
  date: '2026-05-05',
  description: 'Test Tx',
  amount: -100,
  category_id: null,
  user_id: 'user-1',
  ignore_in_reports: false,
  created_at: '2026-05-05T10:00:00Z',
  categories: null,
  ...overrides,
});

const SALARY_CAT = {
  id: 'cat-salary',
  name: 'Salário',
  color: '#10b981',
  is_essential: false,
  is_savings: false,
  is_main_income: true,
};

const RENT_CAT = {
  id: 'cat-rent',
  name: 'Aluguel',
  color: '#ef4444',
  is_essential: true,
  is_savings: false,
  is_main_income: false,
};

const INTERNET_CAT = {
  id: 'cat-internet',
  name: 'Internet',
  color: '#3b82f6',
  is_essential: true,
  is_savings: false,
  is_main_income: false,
};

const MARKET_CAT = {
  id: 'cat-market',
  name: 'Mercado',
  color: '#f59e0b',
  is_essential: false,
  is_savings: false,
  is_main_income: false,
};

const SAVINGS_CAT = {
  id: 'cat-savings',
  name: 'Investimentos',
  color: '#6366f1',
  is_essential: false,
  is_savings: true,
  is_main_income: false,
};

describe('computeDashboardMetrics', () => {
  it('regression: does NOT subtract main income (salary) from daily expenses or category breakdown', () => {
    const transactions: DashboardTransactionInput[] = [
      // Previous month salary + expense
      makeTx({ id: 'p1', date: '2026-04-01', amount: 3000, category_id: SALARY_CAT.id, categories: SALARY_CAT }),
      makeTx({ id: 'p2', date: '2026-04-01', amount: -50, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
      // Current month salary + expense on same day
      makeTx({ id: 'c1', date: '2026-05-01', amount: 3500, category_id: SALARY_CAT.id, categories: SALARY_CAT }),
      makeTx({ id: 'c2', date: '2026-05-01', amount: -80, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
    ];

    const result = computeDashboardMetrics({
      transactions,
      essentialCategories: [],
      manuallyPaidCategoryIds: new Set(),
      previousMonthBalance: 1000,
      minMonthlyMainIncome: 3000,
      expectedMonthlyIncomeSetting: null,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      lastMonthStartDate: '2026-04-01',
      lastMonthEndDate: '2026-04-30',
    });

    expect(result.totalIncome).toBe(3500);
    expect(result.totalExpense).toBe(80);
    expect(result.dailyExpenses).toHaveLength(1);
    expect(result.dailyExpenses[0].day).toBe(1);
    expect(result.dailyExpenses[0].total).toBe(80);
    expect(result.prevMonthDailyExpenses).toEqual([{ day: 1, total: 50 }]);
    expect(result.categoryBreakdown).toEqual([
      { id: MARKET_CAT.id, name: 'Mercado', color: '#f59e0b', total: 80 },
    ]);
  });

  it('subtracts refunds in expense categories from totals, category breakdown, and daily expenses', () => {
    const transactions: DashboardTransactionInput[] = [
      makeTx({ id: '1', date: '2026-05-10', amount: -200, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
      makeTx({ id: '2', date: '2026-05-10', amount: 50, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
    ];

    const result = computeDashboardMetrics({
      transactions,
      essentialCategories: [],
      manuallyPaidCategoryIds: new Set(),
      previousMonthBalance: 0,
      minMonthlyMainIncome: 0,
      expectedMonthlyIncomeSetting: 0,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      lastMonthStartDate: '2026-04-01',
      lastMonthEndDate: '2026-04-30',
    });

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(150);
    expect(result.dailyExpenses[0].total).toBe(150);
    expect(result.categoryBreakdown[0].total).toBe(150);
  });

  it('handles savings, ignored transactions, last-month fixed expense references, and manual paid overrides', () => {
    const transactions: DashboardTransactionInput[] = [
      // Last month rent (1200) and internet (100)
      makeTx({ id: 'p0', date: '2026-04-02', amount: -1200, category_id: RENT_CAT.id, categories: RENT_CAT }),
      makeTx({ id: 'p1', date: '2026-04-05', amount: -100, category_id: INTERNET_CAT.id, categories: INTERNET_CAT }),
      // Current month: partial rent paid (400 of 1200), savings outflow, ignored transfer, uncategorized expense
      makeTx({ id: 'c1', date: '2026-05-02', amount: -400, category_id: RENT_CAT.id, categories: RENT_CAT }),
      makeTx({ id: 'c2', date: '2026-05-03', amount: -300, category_id: SAVINGS_CAT.id, categories: SAVINGS_CAT }),
      makeTx({ id: 'c3', date: '2026-05-04', amount: -999, category_id: MARKET_CAT.id, categories: MARKET_CAT, ignore_in_reports: true }),
      makeTx({ id: 'c4', date: '2026-05-05', amount: -45.5, category_id: null, categories: null }),
    ];

    const result = computeDashboardMetrics({
      transactions,
      essentialCategories: [
        { id: RENT_CAT.id, name: RENT_CAT.name, color: RENT_CAT.color },
        { id: INTERNET_CAT.id, name: INTERNET_CAT.name, color: INTERNET_CAT.color },
      ],
      manuallyPaidCategoryIds: new Set([INTERNET_CAT.id]),
      previousMonthBalance: 2000,
      minMonthlyMainIncome: 2500,
      expectedMonthlyIncomeSetting: 3000,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      lastMonthStartDate: '2026-04-01',
      lastMonthEndDate: '2026-04-30',
    });

    expect(result.totalExpense).toBe(445.5);
    expect(result.totalSaved).toBe(300);
    expect(result.uncategorizedTotal).toBe(45.5);
    expect(result.netBalance).toBe(-745.5);
    expect(result.accumulatedBalance).toBe(1254.5);

    const rent = result.fixedExpenses.find((f) => f.id === RENT_CAT.id);
    const internet = result.fixedExpenses.find((f) => f.id === INTERNET_CAT.id);

    expect(rent).toMatchObject({
      lastMonthAmount: 1200,
      currentSpent: 400,
      pending: 800,
      isPaid: false,
      isFirstMonth: false,
    });

    expect(internet).toMatchObject({
      lastMonthAmount: 100,
      currentSpent: 0,
      pending: 0,
      isPaid: true,
      isManuallyPaid: true,
    });

    expect(result.expectedEssentialOutflow).toBe(800);
    expect(result.pendingIncome).toBe(3000);
    // accumulatedBalance (1254.5) + pendingIncome (3000) - expectedEssentialOutflow (800) = 3454.5
    expect(result.safeMoneyMargin).toBe(3454.5);
  });

  it('avoids floating-point precision drift across many decimal transactions', () => {
    const transactions: DashboardTransactionInput[] = [
      makeTx({ id: '1', date: '2026-05-01', amount: -0.1, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
      makeTx({ id: '2', date: '2026-05-01', amount: -0.2, category_id: MARKET_CAT.id, categories: MARKET_CAT }),
    ];

    const result = computeDashboardMetrics({
      transactions,
      essentialCategories: [],
      manuallyPaidCategoryIds: new Set(),
      previousMonthBalance: 0,
      minMonthlyMainIncome: 0,
      expectedMonthlyIncomeSetting: 0,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      lastMonthStartDate: '2026-04-01',
      lastMonthEndDate: '2026-04-30',
    });

    expect(result.totalExpense).toBe(0.3);
    expect(result.categoryBreakdown[0].total).toBe(0.3);
  });
});

describe('computeYearlySummary', () => {
  it('aggregates 12 months accurately, excluding ignored transactions and separating savings', () => {
    const txs: YearlyTransactionInput[] = [
      { date: '2026-01-05', amount: 3000, ignore_in_reports: false, categories: { is_savings: false, is_main_income: true } },
      { date: '2026-01-10', amount: -1000.1, ignore_in_reports: false, categories: { is_savings: false, is_main_income: false } },
      { date: '2026-01-12', amount: -0.2, ignore_in_reports: false, categories: { is_savings: false, is_main_income: false } },
      { date: '2026-01-15', amount: -500, ignore_in_reports: false, categories: { is_savings: true, is_main_income: false } },
      { date: '2026-02-01', amount: -999, ignore_in_reports: true, categories: { is_savings: false, is_main_income: false } },
    ];

    const months = computeYearlySummary(txs, 2026, new Date('2026-05-15T12:00:00Z'));
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      month: 1,
      totalIncome: 3000,
      totalExpense: 1000.3,
      netBalance: 1499.7,
      hasData: true,
    });
    expect(months[1].hasData).toBe(false);
    // Current month (May = index 4) always marked hasData
    expect(months[4].hasData).toBe(true);
  });
});
