import { supabase } from '../supabaseClient';
import { checkError } from './common';
import type { Database } from '../types/supabase';
import type { Category, CategoryInput, CategoryRule, CategoryRuleInput } from '../types/domain';

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
type CategoryRuleInsert = Database['public']['Tables']['category_rules']['Insert'];
type CategoryRuleUpdate = Database['public']['Tables']['category_rules']['Update'];

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data.map((c) => ({
    ...c,
    isEssential: c.is_essential ?? false,
    isSavings: c.is_savings ?? false,
    isMainIncome: c.is_main_income ?? false,
    expectedAmount: c.expected_amount ?? null,
  }));
};

export const createCategory = async (dto: CategoryInput) => {
  const payload: CategoryInsert = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    is_savings: dto.isSavings,
    is_main_income: dto.isMainIncome,
    expected_amount: dto.expectedAmount ?? null,
  };
  const { data, error } = await supabase.from('categories').insert([payload]).select().single();
  return checkError(error, data);
};

export const updateCategory = async (id: string, dto: CategoryInput) => {
  const payload: CategoryUpdate = {
    name: dto.name,
    color: dto.color,
    is_essential: dto.isEssential,
    is_savings: dto.isSavings,
    is_main_income: dto.isMainIncome,
    expected_amount: dto.expectedAmount ?? null,
  };
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
  return checkError(error, data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDeleteCategories = async (categoryIds: string[]): Promise<void> => {
  const { error } = await supabase.from('categories').delete().in('id', categoryIds);
  if (error) throw error;
};

// --- Category Rules ---
export const getCategoryRules = async (): Promise<CategoryRule[]> => {
  const { data, error } = await supabase
    .from('category_rules')
    .select('*, categories (id, name, color)')
    .order('keyword');
  if (error) throw error;
  return data.map((rule) => ({
    ...rule,
    category: rule.categories,
  }));
};

export const createCategoryRule = async (dto: CategoryRuleInput) => {
  const payload: CategoryRuleInsert = {
    keyword: dto.keyword,
    category_id: dto.categoryId,
  };
  const { data, error } = await supabase.from('category_rules').insert([payload]).select().single();
  return checkError(error, data);
};

export const updateCategoryRule = async (id: string, dto: CategoryRuleInput) => {
  const payload: CategoryRuleUpdate = {
    keyword: dto.keyword,
    category_id: dto.categoryId,
  };
  const { data, error } = await supabase.from('category_rules').update(payload).eq('id', id).select().single();
  return checkError(error, data);
};

export const deleteCategoryRule = async (id: string): Promise<void> => {
  const { error } = await supabase.from('category_rules').delete().eq('id', id);
  if (error) throw error;
};
