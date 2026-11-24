import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  applyCategoryRuleToUncategorized,
  bulkCategorize,
  bulkDelete,
  categorizeOne,
  createTransaction,
  deleteTransaction,
  getHistory,
  getPending,
  toggleIgnoreInReports,
  uncategorizeOne,
  updateTransaction,
  type GetHistoryParams,
  type GetPendingParams,
} from '../../api/transactions';
import { queryKeys } from '../../lib/queryKeys';
import type { TransactionInput, TransactionUpdateInput } from '../../types/domain';

export function invalidateTransactionRelatedQueries(qc: QueryClient): Promise<void> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  ]).then(() => undefined);
}

export function usePendingTransactions(params: GetPendingParams = { page: 0, size: 50 }) {
  return useQuery({
    queryKey: queryKeys.transactions.pending(params),
    queryFn: () => getPending(params),
    placeholderData: keepPreviousData,
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: queryKeys.transactions.pendingCount,
    queryFn: async () => {
      const res = await getPending({ page: 0, size: 1 });
      return res.totalElements;
    },
  });
}

export function useHistoryTransactions(params: GetHistoryParams) {
  return useQuery({
    queryKey: queryKeys.transactions.history(params),
    queryFn: () => getHistory(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionUpdateInput }) =>
      updateTransaction(id, input),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useCategorizeTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      categorizeOne(id, categoryId),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useUncategorizeTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uncategorizeOne(id),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useBulkCategorize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string }) =>
      bulkCategorize(ids, categoryId),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useBulkDeleteTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDelete(ids),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useToggleIgnoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ignore }: { id: string; ignore: boolean }) =>
      toggleIgnoreInReports(id, ignore),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}

export function useApplyCategoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyword, categoryId }: { keyword: string; categoryId: string }) =>
      applyCategoryRuleToUncategorized(keyword, categoryId),
    onSuccess: () => invalidateTransactionRelatedQueries(qc),
  });
}
