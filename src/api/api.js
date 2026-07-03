import { supabase } from '../supabaseClient';

// Helper for throwing errors
const checkError = (error, data) => {
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

export const createCategory = async (dto) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    expected_amount: dto.expectedAmount
  };
  const { data, error } = await supabase.from('categories').insert([payload]).select().single();
  return checkError(error, data);
};

export const updateCategory = async (id, dto) => {
  const payload = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    expected_amount: dto.expectedAmount
  };
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
  return checkError(error, data);
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDeleteCategories = async (categoryIds) => {
  const { error } = await supabase.from('categories').delete().in('id', categoryIds);
  if (error) throw error;
};

// --- Category Rules ---
export const getCategoryRules = async () => {
  const { data, error } = await supabase
    .from('category_rules')
    .select(`*, categories (id, name, color)`)
    .order('keyword');
  return checkError(error, data);
};

export const createCategoryRule = async (dto) => {
  const { data, error } = await supabase.from('category_rules').insert([dto]).select().single();
  return checkError(error, data);
};

export const deleteCategoryRule = async (id) => {
  const { error } = await supabase.from('category_rules').delete().eq('id', id);
  if (error) throw error;
};

// --- Transactions ---
export const getPending = async (page = 0, size = 100) => {
  const { data, error, count } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color)', { count: 'exact' })
    .is('category_id', null)
    .order('date', { ascending: false })
    .range(page * size, (page + 1) * size - 1);

  if (error) throw error;
  return { content: data, totalElements: count };
};

export const getHistory = async (params = {}) => {
  let query = supabase
    .from('transactions')
    .select('*, categories(id, name, color)', { count: 'exact' })
    .not('category_id', 'is', null)
    .order('date', { ascending: false });

  if (params.year) {
    const startDate = `${params.year}-01-01`;
    const endDate = `${params.year}-12-31`;
    query = query.gte('date', startDate).lte('date', endDate);
  }
  if (params.month) {
    const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
    const endDate = new Date(params.year, params.month, 0).toISOString().split('T')[0];
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
  return { content: data, totalElements: count, totalPages: Math.ceil((count || 0) / size) };
};

export const categorizeOne = async (id, categoryId) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', id)
    .select()
    .single();
  return checkError(error, data);
};

export const uncategorizeOne = async (id) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: null })
    .eq('id', id)
    .select()
    .single();
  return checkError(error, data);
};

export const bulkCategorize = async (transactionIds, categoryId) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', transactionIds)
    .select();
  return checkError(error, data);
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDelete = async (transactionIds) => {
  const { error } = await supabase.from('transactions').delete().in('id', transactionIds);
  if (error) throw error;
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
  return data;
};

export const updateCurrency = async (baseCurrency) => {
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

export const importCsv = async (file, options = {}) => {
  throw new Error('CSV Import must be handled directly on the frontend or via Edge Functions in Supabase.');
};

export const getDashboardSummary = async (year, month) => {
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

  const categoryMap = {};
  const dailyMap = {};

  for (const tx of txs) {
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
  const dailyExpenses = Object.values(dailyMap).sort((a, b) => a.day - b.day);

  const expectedEssentialOutflow = totalExpense > 0 ? totalExpense * 0.8 : 0;
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

export const getYearlySummary = async (year) => {
  throw new Error('Yearly summary requires a custom RPC or frontend aggregation.');
};

export const generateTestData = async () => {
  // 1. Create categories
  const categoriesToCreate = [
    { name: 'Alimentação', color: '#ff6b6b' },
    { name: 'Transporte', color: '#4ecdc4' },
    { name: 'Lazer', color: '#feca57' },
    { name: 'Salário', color: '#1dd1a1' }
  ];

  const createdCategories = [];
  for (const cat of categoriesToCreate) {
    const { data } = await supabase.from('categories').insert([cat]).select().single();
    createdCategories.push(data);
  }

  const foodCat = createdCategories.find(c => c.name === 'Alimentação').id;
  const transportCat = createdCategories.find(c => c.name === 'Transporte').id;
  const salaryCat = createdCategories.find(c => c.name === 'Salário').id;

  // 2. Create some transactions (history & pending)
  const today = new Date();

  const transactions = [
    { date: today.toISOString().split('T')[0], description: 'Supermercado', amount: -150.50, category_id: foodCat },
    { date: today.toISOString().split('T')[0], description: 'Uber', amount: -25.00, category_id: transportCat },
    { date: today.toISOString().split('T')[0], description: 'Salário Mensal', amount: 3500.00, category_id: salaryCat },
    { date: today.toISOString().split('T')[0], description: 'Restaurante', amount: -85.00, category_id: null }, // pending
    { date: today.toISOString().split('T')[0], description: 'Padaria', amount: -12.50, category_id: null } // pending
  ];

  await supabase.from('transactions').insert(transactions);

  return true;
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
  deleteTransaction,
  bulkDelete,
  getSettings,
  updateCurrency,
  importCsv,
  getDashboardSummary,
  getLatestDashboardMonth,
  getYearlySummary,
  generateTestData
};
