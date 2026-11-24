import { supabase } from '../supabaseClient';
import { fetchAllPages, getAuthenticatedUser } from './common';
import {
  computeDashboardMetrics,
  computeYearlySummary,
  type DashboardTransactionInput,
  type YearlyTransactionInput,
} from '../services/dashboardCalculator';
import type { DashboardData } from '../types/dashboard';
import type { YearlyMonthSummary } from '../types/domain';

export const getDashboardSummary = async (year: number, month: number): Promise<DashboardData> => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const lastMonthYear = month === 1 ? year - 1 : year;
  const lastMonthMonth = month === 1 ? 12 : month - 1;
  const lastMonthStartDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-01`;
  const daysInLastMonth = new Date(lastMonthYear, lastMonthMonth, 0).getDate();
  const lastMonthEndDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-${String(daysInLastMonth).padStart(2, '0')}`;

  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  const user = await getAuthenticatedUser();
  const user_uuid = user.id;

  // Single parallel round-trip (eliminates the previous sequential waterfall)
  const [transactions, prevBalanceRes, minIncomeRes, settingsRes, essentialCatsRes, paidStateRes] =
    await Promise.all([
      fetchAllPages<DashboardTransactionInput>((from, to) =>
        supabase
          .from('transactions')
          .select('*, categories(id, name, color, is_essential, is_savings, is_main_income)')
          .gte('date', lastMonthStartDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to) as unknown as PromiseLike<{ data: DashboardTransactionInput[] | null; error: import('@supabase/supabase-js').PostgrestError | null }>
      ),
      supabase.rpc('get_balance_before_date', { target_date: startDate, user_uuid }),
      supabase.rpc('get_min_monthly_main_income', { user_uuid }),
      supabase.from('settings').select('expected_monthly_income').eq('user_id', user_uuid).maybeSingle(),
      supabase.from('categories').select('id, name, color').eq('is_essential', true),
      supabase
        .from('category_monthly_state')
        .select('category_id')
        .eq('month', currentMonthStr)
        .eq('is_paid', true),
    ]);

  if (prevBalanceRes.error) throw prevBalanceRes.error;
  if (minIncomeRes.error) throw minIncomeRes.error;
  if (settingsRes.error) throw settingsRes.error;
  if (essentialCatsRes.error) throw essentialCatsRes.error;
  if (paidStateRes.error) throw paidStateRes.error;

  const manuallyPaidCategoryIds = new Set<string>();
  for (const row of paidStateRes.data ?? []) {
    if (row.category_id) {
      manuallyPaidCategoryIds.add(row.category_id);
    }
  }

  return computeDashboardMetrics({
    transactions,
    essentialCategories: essentialCatsRes.data ?? [],
    manuallyPaidCategoryIds,
    previousMonthBalance: prevBalanceRes.data ?? 0,
    minMonthlyMainIncome: minIncomeRes.data ?? 0,
    expectedMonthlyIncomeSetting: settingsRes.data?.expected_monthly_income,
    startDate,
    endDate,
    lastMonthStartDate,
    lastMonthEndDate,
  });
};

export const getYearlySummary = async (
  year: number,
  categorizedOnly: boolean = false
): Promise<{ months: YearlyMonthSummary[] }> => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const transactions = await fetchAllPages<YearlyTransactionInput>((from, to) => {
    let query = supabase
      .from('transactions')
      .select('date, amount, ignore_in_reports, categories(is_savings, is_main_income)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    if (categorizedOnly) {
      query = query.not('category_id', 'is', null);
    }

    return query as unknown as PromiseLike<{
      data: YearlyTransactionInput[] | null;
      error: import('@supabase/supabase-js').PostgrestError | null;
    }>;
  });

  return { months: computeYearlySummary(transactions, year) };
};

export const toggleCategoryPaidState = async (
  categoryId: string,
  year: number,
  month: number,
  isPaid: boolean
): Promise<void> => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from('category_monthly_state')
    .upsert(
      {
        category_id: categoryId,
        month: monthStr,
        is_paid: isPaid,
        user_id: user.id,
      },
      { onConflict: 'category_id,month,user_id' }
    );

  if (error) throw error;
};
