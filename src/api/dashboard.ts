import { supabase } from '../supabaseClient';

export const getDashboardSummary = async (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color, is_essential, is_savings, is_main_income)')
    .lte('date', endDate);

  if (error) throw error;

  let previousMonthBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaved = 0;
  let uncategorizedTotal = 0;

  const categoryMap: Record<string, any> = {};
  const dailyMap: Record<number, any> = {};
  const essentialCatHistory: Record<string, { lastMonthTotal: number, currentSpent: number, name: string, color: string }> = {};
  const historicalIncomeMap: Record<string, number> = {};

  const lastMonthYear = month === 1 ? year - 1 : year;
  const lastMonthMonth = month === 1 ? 12 : month - 1;
  const lastMonthStartDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-01`;
  const daysInLastMonth = new Date(lastMonthYear, lastMonthMonth, 0).getDate();
  const lastMonthEndDate = `${lastMonthYear}-${String(lastMonthMonth).padStart(2, '0')}-${String(daysInLastMonth).padStart(2, '0')}`;



  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    const amount = Number(tx.amount);
    const isExpense = amount < 0;
    const expenseAmount = isExpense ? Math.abs(amount) : 0;
    const isEssential = tx.categories?.is_essential;

    if (tx.date < startDate) {
      previousMonthBalance += amount;
      
      if (amount >= 0 && (!tx.categories?.is_savings && (!tx.categories || tx.categories.is_main_income))) {
        const monthKey = tx.date.substring(0, 7); // e.g. "YYYY-MM"
        historicalIncomeMap[monthKey] = (historicalIncomeMap[monthKey] || 0) + amount;
      }

      if (isEssential && tx.categories) {
        const catId = tx.categories.id;
        if (!essentialCatHistory[catId]) {
          essentialCatHistory[catId] = { lastMonthTotal: 0, currentSpent: 0, name: tx.categories.name, color: tx.categories.color };
        }
        if (tx.date >= lastMonthStartDate && tx.date <= lastMonthEndDate) {
          essentialCatHistory[catId].lastMonthTotal -= amount;
        }
      }
    } else {
      if (tx.categories && !tx.categories.is_savings) {
        const catId = tx.categories.id;
        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            name: tx.categories.name,
            color: tx.categories.color,
            total: 0
          };
        }
        categoryMap[catId].total -= amount;

        if (isEssential) {
          if (!essentialCatHistory[catId]) {
            essentialCatHistory[catId] = { lastMonthTotal: 0, currentSpent: 0, name: tx.categories.name, color: tx.categories.color };
          }
          essentialCatHistory[catId].currentSpent -= amount;
        }
      }

      if (amount >= 0) {
        if (tx.categories?.is_savings) {
          totalSaved -= amount;
        } else if (!tx.categories || tx.categories.is_main_income) {
          totalIncome += amount;
        } else {
          totalExpense -= amount;
        }
      } else {
        if (tx.categories?.is_savings) {
          totalSaved += expenseAmount;
        } else {
          totalExpense += expenseAmount;
          if (!tx.categories) {
            uncategorizedTotal += expenseAmount;
          }
        }
      }

      // Daily expenses
      if (amount < 0 && !(tx.categories?.is_savings)) {
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!dailyMap[day]) {
          dailyMap[day] = { day, total: 0, transactions: [] };
        }
        dailyMap[day].total += expenseAmount;
        dailyMap[day].transactions.push(tx);
      } else if (amount >= 0 && tx.categories && !tx.categories.is_savings) {
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
  const categoryBreakdown = Object.values(categoryMap).filter((c: any) => c.total > 0);
  const dailyExpenses = Object.values(dailyMap).sort((a: any, b: any) => a.day - b.day);

  // Fetch all essential categories to ensure we include ones with zero transactions
  let expectedEssentialOutflow = 0;
  const fixedExpenses = [];
  const manuallyPaidCategoryIds = new Set<string>();

  try {
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const [catsRes, paidRes] = await Promise.all([
      supabase.from('categories').select('id, name, color').eq('is_essential', true),
      supabase.from('category_monthly_state').select('category_id').eq('month', currentMonthStr).eq('is_paid', true)
    ]);

    if (catsRes.data) {
      for (const cat of catsRes.data) {
        if (!essentialCatHistory[cat.id]) {
          essentialCatHistory[cat.id] = { lastMonthTotal: 0, currentSpent: 0, name: cat.name, color: cat.color };
        }
      }
    }
    
    if (paidRes.data) {
      paidRes.data.forEach((p: any) => manuallyPaidCategoryIds.add(p.category_id));
    }
  } catch (e) {
    // Ignore error
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

  // Sort fixed expenses by highest lastMonthAmount first
  fixedExpenses.sort((a, b) => b.lastMonthAmount - a.lastMonthAmount);

  const pastIncomes = Object.values(historicalIncomeMap).filter(v => v > 0);
  const minHistoricalIncome = pastIncomes.length > 0 ? Math.min(...pastIncomes) : 0;

  const expectedMonthlyIncomeStr = localStorage.getItem('expectedMonthlyIncome');
  const baseExpectedIncome = expectedMonthlyIncomeStr ? Number(expectedMonthlyIncomeStr) : minHistoricalIncome;
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
    fixedExpenses
  };
};

export const getLatestDashboardMonth = async () => {
  return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
};

export const getYearlySummary = async (year: number, categorizedOnly: boolean = false) => {
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
    if (!userData.user) throw new Error("Usuário não autenticado");
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
