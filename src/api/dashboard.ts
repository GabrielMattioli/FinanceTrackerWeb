import { supabase } from '../supabaseClient';
import type { DashboardData } from '../types/dashboard';

export const getDashboardSummary = async (year: number, month: number): Promise<DashboardData> => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const lastMonthYear = month === 1 ? year - 1 : year;
  const lastMonthMonth = month === 1 ? 12 : month - 1;
  const lastMonthStartDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-01`;
  const daysInLastMonth = new Date(lastMonthYear, lastMonthMonth, 0).getDate();
  const lastMonthEndDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-${String(daysInLastMonth).padStart(2, '0')}`;

  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) {
    throw new Error('User not authenticated');
  }
  const user_uuid = userResp.user.id;

  // Run the new RPCs alongside fetching the limited transactions
  const [txRes, prevBalanceRes, minIncomeRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, categories(id, name, color, is_essential, is_savings, is_main_income)')
      .gte('date', lastMonthStartDate)
      .lte('date', endDate),
    supabase.rpc('get_balance_before_date', { target_date: startDate, user_uuid }),
    supabase.rpc('get_min_monthly_main_income', { user_uuid })
  ]);

  if (txRes.error) throw txRes.error;

  const txs = txRes.data || [];
  let previousMonthBalance = prevBalanceRes.data || 0;
  
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaved = 0;
  let uncategorizedTotal = 0;

  // Previous month totals for trend comparison
  let prevMonthIncome = 0;
  let prevMonthExpense = 0;
  let prevMonthSaved = 0;

  const categoryMap: Record<string, { name: string; color: string; total: number }> = {};
  const dailyMap: Record<number, { day: number; total: number; transactions: any[] }> = {};
  const prevMonthDailyMap: Record<number, { day: number; total: number }> = {};
  const essentialCatHistory: Record<string, { lastMonthTotal: number; currentSpent: number; name: string; color: string }> = {};

  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    const amount = Number(tx.amount);
    const isExpense = amount < 0;
    const expenseAmount = isExpense ? Math.abs(amount) : 0;
    const cat = tx.categories as any; // Using any for nested relations temporarily until mapped 
    const isEssential = cat?.is_essential;

    const isLastMonth = tx.date >= lastMonthStartDate && tx.date <= lastMonthEndDate;
    const isCurrentMonth = tx.date >= startDate && tx.date <= endDate;

    if (isLastMonth) {
      if (amount >= 0) {
        if (cat?.is_savings) {
          prevMonthSaved -= amount;
        } else if (!cat || cat.is_main_income) {
          prevMonthIncome += amount;
        } else {
          prevMonthExpense -= amount;
        }
      } else {
        if (cat?.is_savings) {
          prevMonthSaved += expenseAmount;
        } else {
          prevMonthExpense += expenseAmount;
        }
      }

      // Daily expenses for previous month
      if (amount < 0 && !(cat?.is_savings)) {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!prevMonthDailyMap[day]) {
          prevMonthDailyMap[day] = { day, total: 0 };
        }
        prevMonthDailyMap[day].total += expenseAmount;
      } else if (amount >= 0 && cat && !cat.is_savings) {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!prevMonthDailyMap[day]) {
          prevMonthDailyMap[day] = { day, total: 0 };
        }
        prevMonthDailyMap[day].total -= amount;
      }

      if (isEssential && cat) {
        const catId = cat.id;
        if (!essentialCatHistory[catId]) {
          essentialCatHistory[catId] = { lastMonthTotal: 0, currentSpent: 0, name: cat.name, color: cat.color };
        }
        essentialCatHistory[catId].lastMonthTotal -= amount;
      }
    } else if (isCurrentMonth) {
      if (cat && !cat.is_savings) {
        const catId = cat.id;
        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            name: cat.name,
            color: cat.color,
            total: 0
          };
        }
        categoryMap[catId].total -= amount;

        if (isEssential) {
          if (!essentialCatHistory[catId]) {
            essentialCatHistory[catId] = { lastMonthTotal: 0, currentSpent: 0, name: cat.name, color: cat.color };
          }
          essentialCatHistory[catId].currentSpent -= amount;
        }
      }

      if (amount >= 0) {
        if (cat?.is_savings) {
          totalSaved -= amount;
        } else if (!cat || cat.is_main_income) {
          totalIncome += amount;
        } else {
          totalExpense -= amount;
        }
      } else {
        if (cat?.is_savings) {
          totalSaved += expenseAmount;
        } else {
          totalExpense += expenseAmount;
          if (!cat) {
            uncategorizedTotal += expenseAmount;
          }
        }
      }

      // Daily expenses
      if (amount < 0 && !(cat?.is_savings)) {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!dailyMap[day]) {
          dailyMap[day] = { day, total: 0, transactions: [] };
        }
        dailyMap[day].total += expenseAmount;
        dailyMap[day].transactions.push(tx);
      } else if (amount >= 0 && cat && !cat.is_savings) {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!dailyMap[day]) {
          dailyMap[day] = { day, total: 0, transactions: [] };
        }
        dailyMap[day].total -= amount;
        dailyMap[day].transactions.push(tx);
      }
    }
  }

  const netBalance = totalIncome - totalExpense - totalSaved;
  const accumulatedBalance = previousMonthBalance + netBalance;
  const categoryBreakdown = Object.values(categoryMap).filter((c) => c.total > 0);
  const dailyExpenses = Object.values(dailyMap).sort((a, b) => a.day - b.day);
  const prevMonthDailyExpenses = Object.values(prevMonthDailyMap).sort((a, b) => a.day - b.day);

  let expectedEssentialOutflow = 0;
  const fixedExpenses: any[] = [];
  const manuallyPaidCategoryIds = new Set<string>();

  try {
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const [catsRes, paidRes] = await Promise.all([
      supabase.from('categories').select('id, name, color').eq('is_essential', true),
      supabase.from('category_monthly_state').select('category_id').eq('month', currentMonthStr).eq('is_paid', true)
    ]);

    if (catsRes.data) {
      for (const category of catsRes.data) {
        if (!essentialCatHistory[category.id]) {
          essentialCatHistory[category.id] = { lastMonthTotal: 0, currentSpent: 0, name: category.name, color: category.color || '' };
        }
      }
    }
    
    if (paidRes.data) {
      paidRes.data.forEach((p) => {
         if (p.category_id) manuallyPaidCategoryIds.add(p.category_id);
      });
    }
  } catch (e) {
    console.error('Error fetching essential categories or paid states:', e);
  }

  for (const catId in essentialCatHistory) {
    const data = essentialCatHistory[catId];
    
    const lastMonthAmount = data.lastMonthTotal;
    let pending = Math.max(0, lastMonthAmount - data.currentSpent);
    let isPaid = data.currentSpent >= lastMonthAmount && lastMonthAmount > 0;
    const isManuallyPaid = manuallyPaidCategoryIds.has(catId);

    if (isManuallyPaid) {
      pending = 0;
      isPaid = true;
    }

    expectedEssentialOutflow += pending;

    fixedExpenses.push({
      id: catId,
      name: data.name,
      color: data.color,
      lastMonthAmount,
      currentSpent: data.currentSpent,
      pending,
      isPaid,
      isManuallyPaid,
      isFirstMonth: data.lastMonthTotal === 0
    });
  }

  fixedExpenses.sort((a, b) => b.lastMonthAmount - a.lastMonthAmount);

  const expectedMonthlyIncomeStr = localStorage.getItem('expectedMonthlyIncome');
  let parsedExpectedIncome = expectedMonthlyIncomeStr ? Number(expectedMonthlyIncomeStr) : NaN;
  if (isNaN(parsedExpectedIncome)) {
    parsedExpectedIncome = minIncomeRes.data || 0;
  }
  
  const baseExpectedIncome = parsedExpectedIncome;
  const pendingIncome = Math.max(0, baseExpectedIncome - totalIncome);
  const expectedTotalIncome = totalIncome + pendingIncome;
  const safeMoneyMargin = accumulatedBalance + pendingIncome - expectedEssentialOutflow;

  return {
    totalIncome,
    totalExpense,
    totalSaved,
    netBalance,
    accumulatedBalance,
    previousMonthBalance,
    safeMoneyMargin,
    expectedEssentialOutflow,
    expectedTotalIncome,
    pendingIncome,
    categoryBreakdown,
    uncategorizedTotal,
    dailyExpenses,
    prevMonthDailyExpenses,
    fixedExpenses,
    prevMonthIncome,
    prevMonthExpense,
    prevMonthSaved
  };
};

export const getLatestDashboardMonth = async () => {
  return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
};

// In-memory cache to deduplicate concurrent calls from MonthBar + parent
const yearlySummaryCache = new Map<string, { promise: Promise<{ months: any[] }>; timestamp: number }>();
const YEARLY_CACHE_TTL_MS = 30_000;

export const getYearlySummary = (year: number, categorizedOnly: boolean = false) => {
  const cacheKey = `${year}-${categorizedOnly}`;
  const cached = yearlySummaryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < YEARLY_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchYearlySummary(year, categorizedOnly);
  yearlySummaryCache.set(cacheKey, { promise, timestamp: Date.now() });

  // Clean up on failure so retries work
  promise.catch(() => yearlySummaryCache.delete(cacheKey));

  return promise;
};

export const invalidateYearlySummaryCache = () => {
  yearlySummaryCache.clear();
};

const fetchYearlySummary = async (year: number, categorizedOnly: boolean = false) => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  let query = supabase
    .from('transactions')
    .select('date, amount, ignore_in_reports, categories(is_savings, is_main_income)')
    .gte('date', startDate)
    .lte('date', endDate);

  if (categorizedOnly) {
    query = query.not('category_id', 'is', null);
  }

  const { data: txs, error } = await query;

  if (error) throw error;

  // Initialize 12 months
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    hasData: false
  }));



  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    const monthIndex = parseInt(tx.date.split('-')[1], 10) - 1;
    const amount = Number(tx.amount);

    months[monthIndex].hasData = true;

    if (amount >= 0) {
      if (!(tx.categories as any)?.is_savings) {
        if (!tx.categories || (tx.categories as any).is_main_income) {
          months[monthIndex].totalIncome += amount;
        } else {
          months[monthIndex].totalExpense -= amount;
        }
      }
      months[monthIndex].netBalance += amount;
    } else {
      if (!(tx.categories as any)?.is_savings) {
        months[monthIndex].totalExpense += Math.abs(amount);
      }
      months[monthIndex].netBalance += amount;
    }
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    months[currentMonth - 1].hasData = true; // Always allow clicking current month
  }

  return { months };
};

export const toggleCategoryPaidState = async (categoryId: string, year: number, month: number, isPaid: boolean) => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  const { data: existing } = await supabase
    .from('category_monthly_state')
    .select('id')
    .eq('category_id', categoryId)
    .eq('month', monthStr)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('category_monthly_state')
      .update({ is_paid: isPaid })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      const authError = new Error("Usuário não autenticado");
      authError.name = "AuthError";
      throw authError;
    }
    const { error } = await supabase
      .from('category_monthly_state')
      .insert({
        category_id: categoryId,
        month: monthStr,
        is_paid: isPaid,
        user_id: userData.user.id
      });
    if (error) throw error;
  }
};
