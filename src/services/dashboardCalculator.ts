import type { DashboardData, FixedExpense } from '../types/dashboard';
import type { TransactionRow, YearlyMonthSummary } from '../types/domain';
import { fromCents, toCents } from '../utils/money';

export interface DashboardCategoryJoin {
  id: string;
  name: string;
  color: string | null;
  is_essential: boolean | null;
  is_savings: boolean | null;
  is_main_income: boolean | null;
}

export interface DashboardTransactionInput extends TransactionRow {
  categories: DashboardCategoryJoin | null;
}

export interface EssentialCategoryInput {
  id: string;
  name: string;
  color: string | null;
}

export interface ComputeDashboardParams {
  transactions: readonly DashboardTransactionInput[];
  essentialCategories: readonly EssentialCategoryInput[];
  manuallyPaidCategoryIds: ReadonlySet<string>;
  previousMonthBalance: number;
  minMonthlyMainIncome: number;
  expectedMonthlyIncomeSetting: number | null | undefined;
  startDate: string;
  endDate: string;
  lastMonthStartDate: string;
  lastMonthEndDate: string;
}

export interface YearlyTransactionInput {
  date: string;
  amount: number;
  ignore_in_reports: boolean | null;
  categories: {
    is_savings: boolean | null;
    is_main_income: boolean | null;
  } | null;
}

export function computeDashboardMetrics(params: ComputeDashboardParams): DashboardData {
  const {
    transactions,
    essentialCategories,
    manuallyPaidCategoryIds,
    previousMonthBalance,
    minMonthlyMainIncome,
    expectedMonthlyIncomeSetting,
    startDate,
    endDate,
    lastMonthStartDate,
    lastMonthEndDate,
  } = params;

  const previousMonthBalanceCents = toCents(Number(previousMonthBalance) || 0);

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let totalSavedCents = 0;
  let uncategorizedCents = 0;

  let prevMonthIncomeCents = 0;
  let prevMonthExpenseCents = 0;
  let prevMonthSavedCents = 0;

  const categoryMap = new Map<string, { id: string; name: string; color: string; totalCents: number }>();
  const dailyMap = new Map<number, { day: number; totalCents: number; transactions: TransactionRow[] }>();
  const prevMonthDailyMap = new Map<number, { day: number; totalCents: number }>();
  const essentialCatHistory = new Map<
    string,
    {
      lastMonthCents: number;
      currentSpentCents: number;
      name: string;
      color: string;
    }
  >();

  for (const category of essentialCategories) {
    essentialCatHistory.set(category.id, {
      lastMonthCents: 0,
      currentSpentCents: 0,
      name: category.name,
      color: category.color || '#6366f1',
    });
  }

  for (const tx of transactions) {
    if (tx.ignore_in_reports) continue;

    const amountCents = toCents(Number(tx.amount));
    const isExpense = amountCents < 0;
    const expenseCents = isExpense ? Math.abs(amountCents) : 0;
    const cat = tx.categories;
    const isEssential = Boolean(cat?.is_essential);
    const isSavings = Boolean(cat?.is_savings);
    const isMainIncome = Boolean(cat?.is_main_income);

    const isLastMonth = tx.date >= lastMonthStartDate && tx.date <= lastMonthEndDate;
    const isCurrentMonth = tx.date >= startDate && tx.date <= endDate;

    if (isLastMonth) {
      if (amountCents >= 0) {
        if (isSavings) {
          prevMonthSavedCents -= amountCents;
        } else if (!cat || isMainIncome) {
          prevMonthIncomeCents += amountCents;
        } else {
          prevMonthExpenseCents -= amountCents;
        }
      } else {
        if (isSavings) {
          prevMonthSavedCents += expenseCents;
        } else {
          prevMonthExpenseCents += expenseCents;
        }
      }

      // Daily expenses for previous month (exclude savings and main income)
      if (amountCents < 0 && !isSavings) {
        const day = parseInt(tx.date.split('-')[2], 10);
        const existing = prevMonthDailyMap.get(day) ?? { day, totalCents: 0 };
        existing.totalCents += expenseCents;
        prevMonthDailyMap.set(day, existing);
      } else if (amountCents >= 0 && cat && !isSavings && !isMainIncome) {
        const day = parseInt(tx.date.split('-')[2], 10);
        const existing = prevMonthDailyMap.get(day) ?? { day, totalCents: 0 };
        existing.totalCents -= amountCents;
        prevMonthDailyMap.set(day, existing);
      }

      if (isEssential && cat) {
        const existing = essentialCatHistory.get(cat.id) ?? {
          lastMonthCents: 0,
          currentSpentCents: 0,
          name: cat.name,
          color: cat.color || '#6366f1',
        };
        existing.lastMonthCents -= amountCents;
        essentialCatHistory.set(cat.id, existing);
      }
    } else if (isCurrentMonth) {
      if (cat && !isSavings && !isMainIncome) {
        const existing = categoryMap.get(cat.id) ?? {
          id: cat.id,
          name: cat.name,
          color: cat.color || '#6366f1',
          totalCents: 0,
        };
        existing.totalCents -= amountCents;
        categoryMap.set(cat.id, existing);

        if (isEssential) {
          const ess = essentialCatHistory.get(cat.id) ?? {
            lastMonthCents: 0,
            currentSpentCents: 0,
            name: cat.name,
            color: cat.color || '#6366f1',
          };
          ess.currentSpentCents -= amountCents;
          essentialCatHistory.set(cat.id, ess);
        }
      }

      if (amountCents >= 0) {
        if (isSavings) {
          totalSavedCents -= amountCents;
        } else if (!cat || isMainIncome) {
          totalIncomeCents += amountCents;
        } else {
          totalExpenseCents -= amountCents;
        }
      } else {
        if (isSavings) {
          totalSavedCents += expenseCents;
        } else {
          totalExpenseCents += expenseCents;
          if (!cat) {
            uncategorizedCents += expenseCents;
          }
        }
      }

      // Daily expenses for current month (exclude savings and main income)
      if (amountCents < 0 && !isSavings) {
        const day = parseInt(tx.date.split('-')[2], 10);
        const existing = dailyMap.get(day) ?? { day, totalCents: 0, transactions: [] };
        existing.totalCents += expenseCents;
        existing.transactions.push(tx);
        dailyMap.set(day, existing);
      } else if (amountCents >= 0 && cat && !isSavings && !isMainIncome) {
        const day = parseInt(tx.date.split('-')[2], 10);
        const existing = dailyMap.get(day) ?? { day, totalCents: 0, transactions: [] };
        existing.totalCents -= amountCents;
        existing.transactions.push(tx);
        dailyMap.set(day, existing);
      }
    }
  }

  const netBalanceCents = totalIncomeCents - totalExpenseCents - totalSavedCents;
  const accumulatedBalanceCents = previousMonthBalanceCents + netBalanceCents;

  const categoryBreakdown = Array.from(categoryMap.values())
    .filter((c) => c.totalCents > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      total: fromCents(c.totalCents),
    }));

  const dailyExpenses = Array.from(dailyMap.values())
    .sort((a, b) => a.day - b.day)
    .map((d) => ({
      day: d.day,
      total: fromCents(d.totalCents),
      transactions: d.transactions,
    }));

  const prevMonthDailyExpenses = Array.from(prevMonthDailyMap.values())
    .sort((a, b) => a.day - b.day)
    .map((d) => ({
      day: d.day,
      total: fromCents(d.totalCents),
    }));

  let expectedEssentialOutflowCents = 0;
  const fixedExpenses: FixedExpense[] = [];

  for (const [catId, data] of essentialCatHistory.entries()) {
    let pendingCents = Math.max(0, data.lastMonthCents - data.currentSpentCents);
    let isPaid = data.currentSpentCents >= data.lastMonthCents && data.lastMonthCents > 0;
    const isManuallyPaid = manuallyPaidCategoryIds.has(catId);

    if (isManuallyPaid) {
      pendingCents = 0;
      isPaid = true;
    }

    expectedEssentialOutflowCents += pendingCents;

    fixedExpenses.push({
      id: catId,
      name: data.name,
      color: data.color,
      lastMonthAmount: fromCents(data.lastMonthCents),
      currentSpent: fromCents(data.currentSpentCents),
      pending: fromCents(pendingCents),
      isPaid,
      isManuallyPaid,
      isFirstMonth: data.lastMonthCents === 0,
    });
  }

  fixedExpenses.sort((a, b) => b.lastMonthAmount - a.lastMonthAmount || a.name.localeCompare(b.name));

  const hasValidExpectedSetting =
    expectedMonthlyIncomeSetting !== null &&
    expectedMonthlyIncomeSetting !== undefined &&
    Number.isFinite(Number(expectedMonthlyIncomeSetting));

  const baseExpectedIncomeCents = hasValidExpectedSetting
    ? toCents(Number(expectedMonthlyIncomeSetting))
    : toCents(Number(minMonthlyMainIncome) || 0);

  const pendingIncomeCents = Math.max(0, baseExpectedIncomeCents - totalIncomeCents);
  const expectedTotalIncomeCents = totalIncomeCents + pendingIncomeCents;
  const safeMoneyMarginCents =
    accumulatedBalanceCents + pendingIncomeCents - expectedEssentialOutflowCents;

  return {
    totalIncome: fromCents(totalIncomeCents),
    totalExpense: fromCents(totalExpenseCents),
    totalSaved: fromCents(totalSavedCents),
    netBalance: fromCents(netBalanceCents),
    accumulatedBalance: fromCents(accumulatedBalanceCents),
    previousMonthBalance: fromCents(previousMonthBalanceCents),
    safeMoneyMargin: fromCents(safeMoneyMarginCents),
    expectedEssentialOutflow: fromCents(expectedEssentialOutflowCents),
    expectedTotalIncome: fromCents(expectedTotalIncomeCents),
    pendingIncome: fromCents(pendingIncomeCents),
    categoryBreakdown,
    uncategorizedTotal: fromCents(uncategorizedCents),
    dailyExpenses,
    prevMonthDailyExpenses,
    fixedExpenses,
    prevMonthIncome: fromCents(prevMonthIncomeCents),
    prevMonthExpense: fromCents(prevMonthExpenseCents),
    prevMonthSaved: fromCents(prevMonthSavedCents),
  };
}

export function computeYearlySummary(
  transactions: readonly YearlyTransactionInput[],
  year: number,
  now: Date = new Date()
): YearlyMonthSummary[] {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    incomeCents: 0,
    expenseCents: 0,
    netCents: 0,
    hasData: false,
  }));

  for (const tx of transactions) {
    if (tx.ignore_in_reports) continue;

    const monthIndex = parseInt(tx.date.split('-')[1], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) continue;

    const amountCents = toCents(Number(tx.amount));
    const bucket = months[monthIndex];
    bucket.hasData = true;

    const isSavings = Boolean(tx.categories?.is_savings);
    const isMainIncome = Boolean(tx.categories?.is_main_income);

    if (amountCents >= 0) {
      if (!isSavings) {
        if (!tx.categories || isMainIncome) {
          bucket.incomeCents += amountCents;
        } else {
          bucket.expenseCents -= amountCents;
        }
      }
      bucket.netCents += amountCents;
    } else {
      if (!isSavings) {
        bucket.expenseCents += Math.abs(amountCents);
      }
      bucket.netCents += amountCents;
    }
  }

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (year === currentYear) {
    months[currentMonth - 1].hasData = true;
  }

  return months.map((m) => ({
    month: m.month,
    totalIncome: fromCents(m.incomeCents),
    totalExpense: fromCents(m.expenseCents),
    netBalance: fromCents(m.netCents),
    hasData: m.hasData,
  }));
}
