export interface CategoryBreakdownItem {
  name: string;
  color: string;
  total: number;
}

export interface DailyExpense {
  day: number;
  total: number;
  transactions: unknown[];
}

export interface FixedExpense {
  id: string;
  name: string;
  color: string;
  lastMonthAmount: number;
  currentSpent: number;
  pending: number;
  isPaid: boolean;
  isManuallyPaid: boolean;
  isFirstMonth: boolean;
}

export interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  netBalance: number;
  accumulatedBalance: number;
  previousMonthBalance: number;
  safeMoneyMargin: number;
  expectedEssentialOutflow: number;
  expectedTotalIncome: number;
  pendingIncome: number;
  categoryBreakdown: CategoryBreakdownItem[];
  uncategorizedTotal: number;
  dailyExpenses: DailyExpense[];
  fixedExpenses: FixedExpense[];
  prevMonthIncome: number;
  prevMonthExpense: number;
  prevMonthSaved: number;
}
