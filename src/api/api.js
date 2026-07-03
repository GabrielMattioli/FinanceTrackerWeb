import { supabase } from '../supabaseClient';

// Helper for throwing errors
const checkError = (error, data) => {
  if (error) throw error;
  return data;
};

// --- Categories ---
export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  return checkError(error, data);
};

export const createCategory = async (dto) => {
  const { data, error } = await supabase.from('categories').insert([dto]).select().single();
  return checkError(error, data);
};

export const updateCategory = async (id, dto) => {
  const { data, error } = await supabase.from('categories').update(dto).eq('id', id).select().single();
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
  const { data, error } = await supabase.from('settings').select('*').single();
  // Se não existir, retorna um padrão
  if (error && error.code === 'PGRST116') {
      return { baseCurrency: 'EUR' };
  }
  return checkError(error, data);
};

export const updateCurrency = async (baseCurrency) => {
  // Para simplificar, assumimos que há apenas uma linha de settings por user (tratado por RLS)
  const { data, error } = await supabase
    .from('settings')
    .upsert({ id: 1, baseCurrency })
    .select()
    .single();
  return checkError(error, data);
};

// CSV Import and Dashboard logic would require more complex DB functions or frontend logic.
// We will stub them or implement frontend logic if requested.
export const importCsv = async (file, options = {}) => {
    throw new Error('CSV Import must be handled directly on the frontend or via Edge Functions in Supabase.');
};

export const getDashboardSummary = async (year, month) => {
    // This requires aggregation. We should fetch transactions and aggregate on the frontend for now,
    // or create a Supabase RPC. Let's do frontend aggregation for simplicity.
    throw new Error('Dashboard summary requires a custom RPC or frontend aggregation.');
};

export const getLatestDashboardMonth = async () => {
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
};

export const getYearlySummary = async (year) => {
    throw new Error('Yearly summary requires a custom RPC or frontend aggregation.');
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
    getYearlySummary
};
