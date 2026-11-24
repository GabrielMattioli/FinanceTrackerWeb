import { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrencyValue } from '../../utils/formatters';
import { useToggleCategoryPaid } from '../../hooks/queries/useDashboardQueries';
import type { DashboardData, FixedExpense } from '../../types/dashboard';

export default function FixedExpensesCard({
  data,
  baseCurrency,
  year,
  month,
}: {
  data: DashboardData | null;
  baseCurrency: string;
  year: number;
  month: number;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const togglePaidMutation = useToggleCategoryPaid();

  const handleToggle = async (expense: FixedExpense) => {
    try {
      setLoadingId(expense.id);
      await togglePaidMutation.mutateAsync({
        categoryId: expense.id,
        year,
        month,
        isPaid: !expense.isManuallyPaid,
      });
      toast.success(expense.isManuallyPaid ? 'Marcado como pendente' : 'Marcado como pago');
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setLoadingId(null);
    }
  };

  const fixedExpenses = data?.fixedExpenses ?? [];
  if (fixedExpenses.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h3 className="card-title">Contas Fixas — Acompanhamento</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Referência: orçamento ou mês anterior
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {fixedExpenses.map((expense) => {
          const target = expense.referenceAmount;
          const pct =
            target > 0
              ? Math.min(100, (expense.currentSpent / target) * 100)
              : expense.currentSpent > 0
                ? 100
                : 0;
          const isOverspent = expense.currentSpent > target && target > 0;

          return (
            <div key={expense.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: expense.color,
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{expense.name}</span>
                  {expense.referenceSource === 'budget' && (
                    <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 10.5 }}>
                      Orçamento: {formatCurrencyValue(expense.referenceAmount, baseCurrency)}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  Gasto: {formatCurrencyValue(expense.currentSpent, baseCurrency)}
                  {expense.referenceSource === 'lastMonth' && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' '}
                      / {formatCurrencyValue(expense.referenceAmount, baseCurrency)}
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {expense.isPaid ? (
                      <span
                        style={{
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <ShieldCheck size={16} /> Pago{' '}
                        {isOverspent
                          ? `(+${formatCurrencyValue(expense.currentSpent - target, baseCurrency)})`
                          : ''}
                      </span>
                    ) : target === 0 ? (
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Sem histórico
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertCircle size={16} /> Pendente:{' '}
                        {formatCurrencyValue(expense.pending, baseCurrency)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggle(expense)}
                    disabled={loadingId === expense.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                      color: expense.isManuallyPaid ? '#10b981' : 'var(--text-muted)',
                      opacity: loadingId === expense.id ? 0.5 : 1,
                    }}
                    title={
                      expense.isManuallyPaid ? 'Desmarcar pagamento manual' : 'Marcar como pago'
                    }
                    aria-label={
                      expense.isManuallyPaid
                        ? `Desmarcar ${expense.name} como paga`
                        : `Marcar ${expense.name} como paga`
                    }
                  >
                    {expense.isManuallyPaid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  background: 'var(--border-color)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: expense.isPaid ? '#10b981' : expense.color,
                    width: `${pct}%`,
                    transition: 'width 0.5s ease-out',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
