import { supabase } from '../supabaseClient';
import { checkError } from './common';

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
