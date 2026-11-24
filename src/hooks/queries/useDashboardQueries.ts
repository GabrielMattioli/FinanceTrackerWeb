import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getYearlySummary,
  toggleCategoryPaidState,
} from '../../api/dashboard';
import { queryKeys } from '../../lib/queryKeys';

export function useDashboardSummary(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(year, month),
    queryFn: () => getDashboardSummary(year, month),
  });
}

export function useYearlySummary(year: number, categorizedOnly: boolean = false) {
  return useQuery({
    queryKey: queryKeys.dashboard.yearly(year, categorizedOnly),
    queryFn: () => getYearlySummary(year, categorizedOnly),
  });
}

export function useToggleCategoryPaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      year,
      month,
      isPaid,
    }: {
      categoryId: string;
      year: number;
      month: number;
      isPaid: boolean;
    }) => toggleCategoryPaidState(categoryId, year, month, isPaid),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.summary(variables.year, variables.month),
      });
    },
  });
}
