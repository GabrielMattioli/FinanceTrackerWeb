import { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { formatCurrencyValue } from '../../utils/formatters';
import { toggleCategoryPaidState } from '../../api/dashboard';
import toast from 'react-hot-toast';

export default function FixedExpensesCard({ data, baseCurrency, year, month, onRefresh }: any) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggle = async (expense: any) => {
        try {
            setLoadingId(expense.id);
            await toggleCategoryPaidState(expense.id, year, month, !expense.isManuallyPaid);
            toast.success(expense.isManuallyPaid ? 'Marcado como pendente' : 'Marcado como pago');
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        } finally {
            setLoadingId(null);
        }
    };

    const fixedExpenses = data?.fixedExpenses || [];
    if (fixedExpenses.length === 0) return null;

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
                <h3 className="card-title">Despesas Fixas (Mês Passado)</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status de pagamento baseado no mês passado</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {fixedExpenses.map((expense: any) => {
                    const pct = expense.lastMonthAmount > 0 ? Math.min(100, (expense.currentSpent / expense.lastMonthAmount) * 100) : (expense.currentSpent > 0 ? 100 : 0);
                    const isOverspent = expense.currentSpent > expense.lastMonthAmount && expense.lastMonthAmount > 0;

                    return (
                        <div key={expense.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: expense.color }} />
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>{expense.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                        {expense.isPaid ? (
                                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <ShieldCheck size={16} /> Pago {isOverspent ? `(+${formatCurrencyValue(expense.currentSpent - expense.lastMonthAmount, baseCurrency)})` : ''}
                                            </span>
                                        ) : expense.lastMonthAmount === 0 ? (
                                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Sem histórico
                                            </span>
                                        ) : (
                                            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <AlertCircle size={16} /> Pendente: {formatCurrencyValue(expense.pending, baseCurrency)}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleToggle(expense)}
                                        disabled={loadingId === expense.id}
                                        style={{ 
                                            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                                            color: expense.isManuallyPaid ? '#10b981' : 'var(--text-muted)',
                                            opacity: loadingId === expense.id ? 0.5 : 1
                                        }}
                                        title={expense.isManuallyPaid ? "Desmarcar pagamento manual" : "Marcar como pago"}
                                    >
                                        {expense.isManuallyPaid ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                                <span>Gasto: {formatCurrencyValue(expense.currentSpent, baseCurrency)}</span>
                                <span>Mês Passado: {formatCurrencyValue(expense.lastMonthAmount, baseCurrency)} {expense.isFirstMonth ? '(Sem Dados)' : ''}</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    background: expense.isPaid ? '#10b981' : expense.color,
                                    width: `${pct}%`,
                                    transition: 'width 0.5s ease-out',
                                    borderRadius: 4
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
