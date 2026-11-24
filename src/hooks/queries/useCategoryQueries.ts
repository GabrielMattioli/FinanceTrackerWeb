import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkDeleteCategories,
  createCategory,
  createCategoryRule,
  deleteCategory,
  deleteCategoryRule,
  getCategories,
  getCategoryRules,
  updateCategory,
  updateCategoryRule,
} from '../../api/categories';
import { queryKeys } from '../../lib/queryKeys';
import type { CategoryInput, CategoryRuleInput } from '../../types/domain';
import { invalidateTransactionRelatedQueries } from './useTransactionQueries';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CategoryInput) => createCategory(dto),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CategoryInput }) => updateCategory(id, dto),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
      qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
      invalidateTransactionRelatedQueries(qc),
    ]),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
      qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
      invalidateTransactionRelatedQueries(qc),
    ]),
  });
}

export function useBulkDeleteCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteCategories(ids),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
      qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
      invalidateTransactionRelatedQueries(qc),
    ]),
  });
}

export function useCategoryRules() {
  return useQuery({
    queryKey: queryKeys.rules.all,
    queryFn: getCategoryRules,
  });
}

export function useCreateCategoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CategoryRuleInput) => createCategoryRule(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
  });
}

export function useUpdateCategoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CategoryRuleInput }) =>
      updateCategoryRule(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
  });
}

export function useDeleteCategoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategoryRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rules.all }),
  });
}
