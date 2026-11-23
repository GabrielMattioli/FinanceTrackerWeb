import { supabase } from '../supabaseClient';
import { checkError, fetchAllPages } from './common';
import { invalidateYearlySummaryCache } from './dashboard';
import { escapeLikePattern } from '../utils/sql';
import type { Transaction, TransactionInput, TransactionUpdateInput } from '../types/domain';
import type { Database } from '../types/supabase';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type TransactionIgnoredFilter = 'all' | 'active' | 'ignored';
export type TransactionSortBy = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';

export interface GetPendingParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface GetHistoryParams {
  month?: number;
  year?: number;
  categoryId?: string;
  search?: string;
  type?: TransactionTypeFilter;
  ignoredFilter?: TransactionIgnoredFilter;
  sortBy?: TransactionSortBy;
  sortOrder?: SortDirection;
  page?: number;
  size?: number;
}

const createTransactionQuery = (sortBy: TransactionSortBy = 'date', sortOrder: SortDirection = 'desc') =>
  supabase
    .from('transactions')
    .select('*, categories(id, name, color)', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .order('id', { ascending: false });

export const getPending = async (
  pageOrParams: number | GetPendingParams = 0,
  sizeArg: number = 100
) => {
  const params: GetPendingParams =
    typeof pageOrParams === 'number'
      ? { page: pageOrParams, size: sizeArg }
      : pageOrParams;

  const page = params.page ?? 0;
  const size = params.size ?? 100;

  let query = createTransactionQuery().is('category_id', null);

  if (params.search?.trim()) {
    query = query.ilike('description', `%${escapeLikePattern(params.search.trim())}%`);
  }

  const { data, error, count } = await query.range(page * size, (page + 1) * size - 1);
  if (error) throw error;

  const totalElements = count ?? 0;
  return {
    content: data.map((tx): Transaction => ({ ...tx, category: tx.categories })),
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
};

export const getHistory = async (params: GetHistoryParams = {}) => {
  const sortBy = params.sortBy ?? 'date';
  const sortOrder = params.sortOrder ?? 'desc';
  let query = createTransactionQuery(sortBy, sortOrder).not('category_id', 'is', null);

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
  if (params.search?.trim()) {
    query = query.ilike('description', `%${escapeLikePattern(params.search.trim())}%`);
  }
  if (params.type === 'income') {
    query = query.gte('amount', 0);
  } else if (params.type === 'expense') {
    query = query.lt('amount', 0);
  }
  if (params.ignoredFilter === 'ignored') {
    query = query.eq('ignore_in_reports', true);
  } else if (params.ignoredFilter === 'active') {
    query = query.or('ignore_in_reports.is.null,ignore_in_reports.eq.false');
  }

  const page = params.page ?? 0;
  const size = params.size ?? 100;
  query = query.range(page * size, (page + 1) * size - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const totalElements = count ?? 0;
  return {
    content: data.map((tx): Transaction => ({ ...tx, category: tx.categories })),
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
};

export const getAllTransactionsForExport = async (
  params: Omit<GetHistoryParams, 'page' | 'size'> & { includeUncategorized?: boolean } = {}
): Promise<Transaction[]> => {
  const sortBy = params.sortBy ?? 'date';
  const sortOrder = params.sortOrder ?? 'desc';

  const rows = await fetchAllPages<Transaction & { categories: Transaction['category'] }>((from, to) => {
    let query = supabase
      .from('transactions')
      .select('*, categories(id, name, color)')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: false })
      .range(from, to);

    if (!params.includeUncategorized) {
      query = query.not('category_id', 'is', null);
    }
    if (params.month && params.year) {
      const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
      const daysInMonth = new Date(params.year, params.month, 0).getDate();
      const endDate = `${params.year}-${String(params.month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (params.year) {
      query = query.gte('date', `${params.year}-01-01`).lte('date', `${params.year}-12-31`);
    }
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }
    if (params.search?.trim()) {
      query = query.ilike('description', `%${escapeLikePattern(params.search.trim())}%`);
    }
    if (params.type === 'income') {
      query = query.gte('amount', 0);
    } else if (params.type === 'expense') {
      query = query.lt('amount', 0);
    }
    if (params.ignoredFilter === 'ignored') {
      query = query.eq('ignore_in_reports', true);
    } else if (params.ignoredFilter === 'active') {
      query = query.or('ignore_in_reports.is.null,ignore_in_reports.eq.false');
    }

    return query as unknown as PromiseLike<{
      data: (Transaction & { categories: Transaction['category'] })[] | null;
      error: import('@supabase/supabase-js').PostgrestError | null;
    }>;
  });

  return rows.map((tx) => ({ ...tx, category: tx.categories }));
};

export const createTransaction = async (input: TransactionInput): Promise<Transaction> => {
  const payload: TransactionInsert = {
    date: input.date,
    description: input.description.trim(),
    amount: input.amount,
    category_id: input.categoryId ?? null,
    ignore_in_reports: input.ignoreInReports ?? false,
  };
  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select('*, categories(id, name, color)')
    .single();
  if (error) throw error;
  invalidateYearlySummaryCache();
  return { ...data, category: data.categories };
};

export const updateTransaction = async (id: string, input: TransactionUpdateInput): Promise<Transaction> => {
  const payload: TransactionUpdate = {};
  if (input.date !== undefined) payload.date = input.date;
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.categoryId !== undefined) payload.category_id = input.categoryId;
  if (input.ignoreInReports !== undefined) payload.ignore_in_reports = input.ignoreInReports;

  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select('*, categories(id, name, color)')
    .single();
  if (error) throw error;
  invalidateYearlySummaryCache();
  return { ...data, category: data.categories };
};

export const categorizeOne = async (id: string, categoryId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', id)
    .select()
    .single();
  const result = checkError(error, data);
  invalidateYearlySummaryCache();
  return result;
};

export const uncategorizeOne = async (id: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: null })
    .eq('id', id)
    .select()
    .single();
  const result = checkError(error, data);
  invalidateYearlySummaryCache();
  return result;
};

export const bulkCategorize = async (transactionIds: string[], categoryId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', transactionIds)
    .select();
  const result = checkError(error, data);
  invalidateYearlySummaryCache();
  return result;
};

export const applyCategoryRuleToUncategorized = async (keyword: string, categoryId: string) => {
  const safeKeyword = escapeLikePattern(keyword.trim());
  const { data, error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .is('category_id', null)
    .ilike('description', `%${safeKeyword}%`)
    .select();
  const result = checkError(error, data);
  invalidateYearlySummaryCache();
  return result;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
  invalidateYearlySummaryCache();
};

export const bulkDelete = async (transactionIds: string[]): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().in('id', transactionIds);
  if (error) throw error;
  invalidateYearlySummaryCache();
};

export const toggleIgnoreInReports = async (id: string, ignore: boolean) => {
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
  invalidateYearlySummaryCache();
  return data;
};
