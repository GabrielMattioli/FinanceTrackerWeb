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
    isSavings: c.is_savings || false
  }));
};

export const createCategory = async (dto: any) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    is_savings: dto.isSavings
  };
  const { data, error } = await supabase.from('categories').insert([payload]).select().single();
  return checkError(error, data);
};

export const updateCategory = async (id: any, dto: any) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    is_savings: dto.isSavings
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
    const daysInMonth = new Date(params.year, params.month, 0).getDate();
    const endDate = `${params.year}-${String(params.month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
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
  const firstLine = text.split('\n')[0] || '';
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  const parseRow = (row: string) => {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCell += char;
      } else if (char === delimiter && !inQuotes) {
        cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return cells;
  };

  const rows = text.split('\n').map(parseRow);

  if (rows.length === 0) return { imported: 0, skipped: 0, errors: 0 };

  const headers = rows[0];

  if (headers.includes('Auftragskonto') && headers.includes('BLZ') && !headers.includes('Glaeubiger ID')) {
    throw new Error('Formato MT940 legado. Por favor, exporte usando a opção "Excel (CSV-CAMT V2)" ou "V8".');
  }

  const dataRows = rows.slice(1).filter(r => r.some(cell => cell));

  let dateCol = options.dateColumn;
  let descCol = options.descColumn;
  let amountCol = options.amountColumn;
  let payeeCol = -1;

  if (dateCol === undefined || descCol === undefined || amountCol === undefined) {
    // Attempt auto-detect
    dateCol = headers.findIndex(h => /data|date|datum|buchungstag/i.test(h));
    descCol = headers.findIndex(h => /descrição|description|verwendungszweck|payment reference/i.test(h));
    payeeCol = headers.findIndex(h => /nome|name|partner|payee|empfänger|empfaenger|beguenstigter|zahlungspflichtiger/i.test(h));
    
    if (descCol === -1 && payeeCol !== -1) {
      descCol = payeeCol;
    }
    
    amountCol = headers.findIndex(h => /^valor$|amount|^betrag$/i.test(h.trim()));

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
    
    let descStr = row[descCol] || '';
    if (payeeCol !== -1 && payeeCol !== descCol && row[payeeCol]) {
      const payeeVal = row[payeeCol].trim();
      const descVal = descStr.trim();
      
      if (!descVal) {
        descStr = payeeVal;
      } else if (payeeVal.toLowerCase() === descVal.toLowerCase()) {
        descStr = payeeVal;
      } else {
        descStr = `${payeeVal} - ${descVal}`;
      }
    }
    let desc = descStr || 'Sem descrição';
    
    let amountStr = row[amountCol];

    if (!dateStr || !desc || !amountStr) continue;

    // Convert DD/MM/YYYY or DD.MM.YYYY to YYYY-MM-DD if needed
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) { // DD/MM/YYYY
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[2].length === 2) { // DD/MM/YY
          dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    } else if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        if (parts[2].length === 4) { // DD.MM.YYYY
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[2].length === 2) { // DD.MM.YY
          dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
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
    let minDate = transactions[0].date;
    let maxDate = transactions[0].date;
    for (const tx of transactions) {
      if (tx.date < minDate) minDate = tx.date;
      if (tx.date > maxDate) maxDate = tx.date;
    }

    const { data: existingTxs, error: fetchError } = await supabase
      .from('transactions')
      .select('date, description, amount')
      .gte('date', minDate)
      .lte('date', maxDate);

    if (fetchError) throw fetchError;

    const dbCounts: Record<string, number> = {};
    for (const tx of existingTxs || []) {
      const sig = `${tx.date}|${tx.description}|${Number(tx.amount)}`;
      dbCounts[sig] = (dbCounts[sig] || 0) + 1;
    }

    const toInsert = [];
    for (const tx of transactions) {
      const sig = `${tx.date}|${tx.description}|${Number(tx.amount)}`;
      if (dbCounts[sig] && dbCounts[sig] > 0) {
        dbCounts[sig]--;
      } else {
        toInsert.push(tx);
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('transactions').insert(toInsert);
      if (error) throw error;
    }

    return { imported: toInsert.length, skipped: dataRows.length - toInsert.length, errors: 0 };
  }

  return { imported: 0, skipped: dataRows.length, errors: 0 };
};

export const getDashboardSummary = async (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color, is_essential, is_savings)')
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

  const mainIncomeId = localStorage.getItem('mainIncomeCategoryId');

  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    const amount = Number(tx.amount);
    const isExpense = amount < 0;
    const expenseAmount = isExpense ? Math.abs(amount) : 0;
    const isEssential = tx.categories?.is_essential;

    if (tx.date < startDate) {
      previousMonthBalance += amount;
      
      if (amount >= 0 && (!tx.categories?.is_savings && (!tx.categories || tx.categories.id === mainIncomeId))) {
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
        } else if (!tx.categories || tx.categories.id === mainIncomeId) {
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

  try {
    const { data: essentialCats } = await supabase.from('categories').select('id, name, color').eq('is_essential', true);
    if (essentialCats) {
      for (const cat of essentialCats) {
        if (!essentialCatHistory[cat.id]) {
          essentialCatHistory[cat.id] = { lastMonthTotal: 0, currentSpent: 0, name: cat.name, color: cat.color };
        }
      }
    }
  } catch (e) {
    // Ignore error
  }

  for (const catId in essentialCatHistory) {
    const data = essentialCatHistory[catId];
    
    const lastMonthAmount = data.lastMonthTotal;
    const pending = Math.max(0, lastMonthAmount - data.currentSpent);

    expectedEssentialOutflow += pending;

    fixedExpenses.push({
      id: catId,
      name: data.name,
      color: data.color,
      lastMonthAmount,
      currentSpent: data.currentSpent,
      pending,
      isPaid: data.currentSpent >= lastMonthAmount && lastMonthAmount > 0,
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
    .select('date, amount, ignore_in_reports, categories(is_savings)')
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

  const mainIncomeId = localStorage.getItem('mainIncomeCategoryId');

  for (const tx of txs) {
    if (tx.ignore_in_reports) continue;

    const monthIndex = parseInt(tx.date.split('-')[1], 10) - 1;
    const amount = Number(tx.amount);

    months[monthIndex].hasData = true;

    if (amount >= 0) {
      if (!(tx.categories as any)?.is_savings) {
        if (!tx.categories || (tx.categories as any).id === mainIncomeId) {
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

export const getMainIncomeCategoryId = () => {
  return localStorage.getItem('mainIncomeCategoryId');
};

export const setMainIncomeCategoryId = (id: string | null) => {
  if (id) {
    localStorage.setItem('mainIncomeCategoryId', id);
  } else {
    localStorage.removeItem('mainIncomeCategoryId');
  }
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
  getYearlySummary,
  getMainIncomeCategoryId,
  setMainIncomeCategoryId
};
