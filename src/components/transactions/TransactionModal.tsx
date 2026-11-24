import { useState, type FormEvent } from 'react';
import { Plus, Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { useCategories } from '../../hooks/queries/useCategoryQueries';
import {
  useCreateTransaction,
  useUpdateTransaction,
} from '../../hooks/queries/useTransactionQueries';
import type { Transaction } from '../../types/domain';

interface TransactionModalProps {
  isOpen: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TransactionModal({ isOpen, transaction = null, onClose }: TransactionModalProps) {
  const isEditing = Boolean(transaction);
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [kind, setKind] = useState<'expense' | 'income'>(() =>
    transaction && Number(transaction.amount) >= 0 ? 'income' : 'expense'
  );
  const [date, setDate] = useState(() => transaction?.date ?? getTodayIso());
  const [description, setDescription] = useState(() => transaction?.description ?? '');
  const [amountInput, setAmountInput] = useState(() =>
    transaction ? String(Math.abs(Number(transaction.amount))) : ''
  );
  const [categoryId, setCategoryId] = useState(() => transaction?.category_id ?? '');
  const [ignoreInReports, setIgnoreInReports] = useState(() =>
    Boolean(transaction?.ignore_in_reports)
  );

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountInput.replace(',', '.'));
    if (!description.trim() || !date || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Preencha data, descrição e um valor maior que zero.');
      return;
    }

    const signedAmount = kind === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
    const payload = {
      date,
      description: description.trim(),
      amount: signedAmount,
      categoryId: categoryId || null,
      ignoreInReports,
    };

    try {
      if (transaction) {
        await updateMutation.mutateAsync({ id: transaction.id, input: payload });
        toast.success('Transação atualizada!');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(
          categoryId ? 'Transação adicionada ao Histórico!' : 'Transação adicionada em Pendentes!'
        );
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar transação.';
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar Transação' : 'Nova Transação'}
      onClose={onClose}
      maxWidth={480}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            form="transaction-form"
            className="btn btn-primary"
            disabled={saving || !description.trim() || !amountInput.trim()}
          >
            {saving ? <span className="spinner" /> : isEditing ? <Save size={15} /> : <Plus size={15} />}
            {isEditing ? 'Salvar Alterações' : 'Adicionar'}
          </button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit}>
        <div
          role="group"
          aria-label="Tipo de transação"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}
        >
          <button
            type="button"
            className={`btn ${kind === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ justifyContent: 'center', padding: '10px' }}
            aria-pressed={kind === 'expense'}
            onClick={() => setKind('expense')}
          >
            <ArrowDownCircle size={16} />
            Despesa
          </button>
          <button
            type="button"
            className={`btn ${kind === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'center',
              padding: '10px',
              ...(kind === 'income' ? { background: 'var(--income)', color: '#ffffff' } : {}),
            }}
            aria-pressed={kind === 'income'}
            onClick={() => setKind('income')}
          >
            <ArrowUpCircle size={16} />
            Receita
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label" htmlFor="tx-date">
              Data
            </label>
            <input
              id="tx-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="tx-amount">
              Valor
            </label>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              placeholder="0,00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              autoFocus={!isEditing}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="tx-description">
            Descrição
          </label>
          <input
            id="tx-description"
            className="input"
            placeholder="Ex: Supermercado, Salário, Aluguel..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="tx-category">
            Categoria (opcional)
          </label>
          <select
            id="tx-category"
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sem categoria (enviar para Pendentes)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={ignoreInReports}
            onChange={(e) => setIgnoreInReports(e.target.checked)}
          />
          Ignorar nos relatórios (transferência entre contas)
        </label>
      </form>
    </Modal>
  );
}
