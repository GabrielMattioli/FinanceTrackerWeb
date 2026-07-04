import { supabase } from '../supabaseClient';

// Helper for throwing errors
const checkError = (error: any, data: any) => {
  if (error) throw error;
  return data;
};

// --- Categories ---
export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data.map(c => ({
    ...c,
    isEssential: c.is_essential || false,
    expectedAmount: c.expected_amount || null
  }));
};

export const createCategory = async (dto: any) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    expected_amount: dto.expectedAmount
  };
  const { data, error } = await supabase.from('categories').insert([payload]).select().single();
  return checkError(error, data);
};

export const updateCategory = async (id: any, dto: any) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    expected_amount: dto.expectedAmount
  };
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
  return checkError(error, data);
};

export const deleteCategory = async (id: any) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDeleteCategories = async (categoryIds: any[]) => {
  const { error } = await supabase.from('categories').delete().in('id', categoryIds);
  if (error) throw error;
};

// --- Category Rules ---
export const getCategoryRules = async () => {
  const { data, error } = await supabase
    .from('category_rules')
    .select(`*, categories (id, name, color)`)
    .order('keyword');
  if (error) throw error;
  return data.map(rule => ({
    ...rule,
    category: rule.categories
  }));
};

export const createCategoryRule = async (dto: any) => {
  const payload = {
    keyword: dto.keyword,
    category_id: dto.categoryId
  };
  const { data, error } = await supabase.from('category_rules').insert([payload]).select().single();
  return checkError(error, data);
};

export const deleteCategoryRule = async (id: any) => {
  const { error } = await supabase.from('category_rules').delete().eq('id', id);
  if (error) throw error;
};

// --- Transactions ---
export const getPending = async (page: number = 0, size: number = 100) => {
  const { data, error, count } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color)', { count: 'exact' })
    .is('category_id', null)
    .order('date', { ascending: false })
    .range(page * size, (page + 1) * size - 1);

  if (error) throw error;
  return { 
    content: data.map(tx => ({ ...tx, category: tx.categories })), 
    totalElements: count 
  };
};

export const getHistory = async (params: any = {}) => {
  let query = supabase
    .from('transactions')
    .select('*, categories(id, name, color)', { count: 'exact' })
    .not('category_id', 'is', null)
    .order('date', { ascending: false });

  if (params.month && params.year) {
    const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
    const endDate = new Date(params.year, params.month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  } else if (params.year) {
    const startDate = `${params.year}-01-01`;
    const endDate = `${params.year}-12-31`;
    query = query.gte('date', startDate).lte('date', endDate);
  }
  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  const page = params.page || 0;
  const size = params.size || 100;
  query = query.range(page * size, (page + 1) * size - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { 
    content: data.map(tx => ({ ...tx, category: tx.categories })), 
    totalElements: count, 
    totalPages: Math.ceil((count || 0) / size) 
  };
};

export const categorizeOne = async (id: any, categoryId: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', id)
    .select()
    .single();
  return checkError(error, data);
};

export const uncategorizeOne = async (id: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: null })
    .eq('id', id)
    .select()
    .single();
  return checkError(error, data);
};

export const bulkCategorize = async (transactionIds: any[], categoryId: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', transactionIds)
    .select();
  return checkError(error, data);
};

export const applyCategoryRuleToUncategorized = async (keyword: string, categoryId: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .is('category_id', null)
    .ilike('description', `%${keyword}%`)
    .select();
  return checkError(error, data);
};

export const deleteTransaction = async (id: any) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDelete = async (transactionIds: any[]) => {
  const { error } = await supabase.from('transactions').delete().in('id', transactionIds);
  if (error) throw error;
};

export const toggleIgnoreInReports = async (id: any, ignore: boolean) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ignore_in_reports: ignore })
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('toggleIgnoreInReports error:', error);
    throw error;
  }
  return data;
};

// --- Settings ---
export const getSettings = async () => {
  const { data, error } = await supabase.from('settings').select('*').maybeSingle();

  if (error) {
    return checkError(error, data);
  }

  // Se não existir (maybeSingle retorna null), retorna um padrão
  if (!data) {
    return { baseCurrency: 'EUR' };
  }
  
  return {
    ...data,
    baseCurrency: data.base_currency || 'EUR'
  };
};

export const updateCurrency = async (baseCurrency: string) => {
  const { data: existing } = await supabase.from('settings').select('id').maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ base_currency: baseCurrency })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { baseCurrency: data.base_currency };
  } else {
    // Cria com um ID aleatório para evitar colisão com outros usuários
    const randomId = Math.floor(Math.random() * 1000000000) + 2;
    const { data, error } = await supabase
      .from('settings')
      .insert({ id: randomId, base_currency: baseCurrency })
      .select()
      .single();
    if (error) throw error;
    return { baseCurrency: data.base_currency };
  }
};

export const importCsv = async (file: File, options: any = {}) => {
  const text = await file.text();
  const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
  
  if (rows.length === 0) return { imported: 0, skipped: 0, errors: 0 };
  
  const headers = rows[0];
  const dataRows = rows.slice(1).filter(r => r.some(cell => cell));

  let dateCol = options.dateColumn;
  let descCol = options.descColumn;
  let amountCol = options.amountColumn;

  if (dateCol === undefined || descCol === undefined || amountCol === undefined) {
    // Attempt auto-detect
    dateCol = headers.findIndex(h => /data|date/i.test(h));
    descCol = headers.findIndex(h => /descrição|description|nome|histórico|history/i.test(h));
    amountCol = headers.findIndex(h => /valor|amount/i.test(h));

    if (dateCol === -1 || descCol === -1 || amountCol === -1) {
      return {
        requiresManualMapping: true,
        headers,
        previewRows: dataRows.slice(0, 3)
      };
    }
  }

  // Fetch rules for auto-categorization
  let rules: any[] = [];
  try {
    const { data } = await supabase.from('category_rules').select('keyword, category_id');
    if (data) rules = data;
  } catch (e) {
    // Ignore error, rules are optional
  }

  const transactions = [];
  for (const row of dataRows) {
    let dateStr = row[dateCol];
    const desc = row[descCol];
    let amountStr = row[amountCol];

    if (!dateStr || !desc || !amountStr) continue;

    // Convert DD/MM/YYYY to YYYY-MM-DD if needed
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) { // DD/MM/YYYY
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    // Convert amount string to number. Ex: "1.234,56" or "1,234.56"
    amountStr = amountStr.replace(/R\$|\$|€/g, '').trim();
    if (amountStr.includes(',') && amountStr.includes('.')) {
      if (amountStr.indexOf(',') < amountStr.indexOf('.')) {
        amountStr = amountStr.replace(/,/g, '');
      } else {
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      }
    } else if (amountStr.includes(',')) {
      amountStr = amountStr.replace(',', '.');
    }
    
    const amount = Number(amountStr);
    
    // Quick validate date YYYY-MM-DD
    const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isNaN(amount) || !dateMatch) continue;
    
    // Format to strict YYYY-MM-DD for PG
    const cleanDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;

    // Apply auto-categorization
    let category_id = null;
    const lowerDesc = desc.toLowerCase();
    for (const rule of rules) {
      if (lowerDesc.includes(rule.keyword.toLowerCase())) {
        category_id = rule.category_id;
        break;
      }
    }

    transactions.push({
      date: cleanDate,
      description: desc,
      amount: amount,
      category_id: category_id
    });
  }

  if (transactions.length > 0) {
    const { error } = await supabase.from('transactions').insert(transactions);
    if (error) throw error;
  }

  return { imported: transactions.length, skipped: dataRows.length - transactions.length, errors: 0 };
};

export const getDashboardSummary = async (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color)')
    .lte('date', endDate);

  if (error) throw error;

  let previousMonthBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let uncategorizedTotal = 0;

  const categoryMap: Record<string, any> = {};
  const dailyMap: Record<number, any> = {};

  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    if (tx.date < startDate) {
      previousMonthBalance += Number(tx.amount);
    } else {
      const amount = Number(tx.amount);
      if (amount >= 0) {
        totalIncome += amount;
      } else {
        const expense = Math.abs(amount);
        totalExpense += expense;

        if (!tx.categories) {
          uncategorizedTotal += expense;
        } else {
          const catId = tx.categories.id;
          if (!categoryMap[catId]) {
            categoryMap[catId] = {
              name: tx.categories.name,
              color: tx.categories.color,
              total: 0
            };
          }
          categoryMap[catId].total += expense;
        }

        // Daily expenses
        const day = parseInt(tx.date.split('-')[2], 10);
        if (!dailyMap[day]) {
          dailyMap[day] = { day, total: 0, transactions: [] };
        }
        dailyMap[day].total += expense;
        dailyMap[day].transactions.push(tx);
      }
    }
  }

  const netBalance = totalIncome - totalExpense;
  const accumulatedBalance = previousMonthBalance + netBalance;
  const categoryBreakdown = Object.values(categoryMap);
  const dailyExpenses = Object.values(dailyMap).sort((a: any, b: any) => a.day - b.day);

  // Fetch true expected essential outflow from categories
  let expectedEssentialOutflow = 0;
  try {
    const { data: essentialCats } = await supabase.from('categories').select('expected_amount').eq('is_essential', true);
    if (essentialCats) {
      expectedEssentialOutflow = essentialCats.reduce((acc, c) => acc + Number(c.expected_amount || 0), 0);
    }
  } catch(e) {
    // Ignore error and leave it 0
  }

  const safeMoneyMargin = accumulatedBalance - expectedEssentialOutflow;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    accumulatedBalance,
    previousMonthBalance,
    safeMoneyMargin,
    expectedEssentialOutflow,
    categoryBreakdown,
    uncategorizedTotal,
    dailyExpenses
  };
};

export const getLatestDashboardMonth = async () => {
  return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
};

export const getYearlySummary = async (year: number) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: txs, error } = await supabase
        .from('transactions')
        .select('date, amount, ignore_in_reports')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;

    // Initialize 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        hasData: false,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0
    }));

    for (const tx of txs) {
        if (tx.ignore_in_reports) continue;
        
        const monthIndex = parseInt(tx.date.split('-')[1], 10) - 1;
        const amount = Number(tx.amount);
        
        months[monthIndex].hasData = true;
        
        if (amount >= 0) {
            months[monthIndex].totalIncome += amount;
            months[monthIndex].netBalance += amount;
        } else {
            months[monthIndex].totalExpense += Math.abs(amount);
            months[monthIndex].netBalance += amount;
        }
    }

    // Current logic expects months to just be a property, but wait, usually it's just an array 
    // of all 12 months, and if there's no data, it's fine.
    // However, the fallback in MonthBar also looks for months that are not in the future?
    // Actually, `hasData` true/false is exactly what the component uses to disable it.
    // Let's make the current month available even if hasData is false, so user can click the current month.
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
        months[currentMonth - 1].hasData = true; // Always allow clicking current month
    }

    return { months };
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  getCategoryRules,
  createCategoryRule,
  deleteCategoryRule,
  getPending,
  getHistory,
  categorizeOne,
  uncategorizeOne,
  bulkCategorize,
  applyCategoryRuleToUncategorized,
  deleteTransaction,
  bulkDelete,
  toggleIgnoreInReports,
  getSettings,
  updateCurrency,
  importCsv,
  getDashboardSummary,
  getLatestDashboardMonth,
  getYearlySummary
};
