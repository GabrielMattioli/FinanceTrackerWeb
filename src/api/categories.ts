import { supabase } from '../supabaseClient';
import { checkError } from './common';

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

export const updateCategoryRule = async (id: any, dto: any) => {
  const payload = {
    keyword: dto.keyword,
    category_id: dto.categoryId
  };
  const { data, error } = await supabase.from('category_rules').update(payload).eq('id', id).select().single();
  return checkError(error, data);
};

export const deleteCategoryRule = async (id: any) => {
  const { error } = await supabase.from('category_rules').delete().eq('id', id);
  if (error) throw error;
};
