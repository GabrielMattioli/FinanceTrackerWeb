import { useState, useMemo, useEffect } from 'react';
import { Search, CheckSquare, Tag, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAmount, formatDate } from '../utils/formatters';
import { useRowSelection } from '../hooks/useRowSelection';
import { useSettings } from '../context/SettingsContext';
import { useCategories } from '../hooks/queries/useCategoryQueries';
import {
  useBulkCategorize,
  useBulkDeleteTransactions,
  useCategorizeTransaction,
  useDeleteTransaction,
  usePendingTransactions,
  useToggleIgnoreTransaction,
} from '../hooks/queries/useTransactionQueries';

export default function PendingPage() {
  const { baseCurrency } = useSettings();
  const [filter, setFilter] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');

  const { data: pendingPage, isPending: loadingPending, isError } = usePendingTransactions({
    page: 0,
    size: 500,
  });
  const { data: categories = [] } = useCategories();

  const categorizeMutation = useCategorizeTransaction();
  const bulkCategorizeMutation = useBulkCategorize();
  const deleteMutation = useDeleteTransaction();
  const bulkDeleteMutation = useBulkDeleteTransactions();
  const toggleIgnoreMutation = useToggleIgnoreTransaction();

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar transações pendentes.');
    }
  }, [isError]);

  const transactions = useMemo(() => pendingPage?.content ?? [], [pendingPage]);
  const totalElements = pendingPage?.totalElements ?? transactions.length;

  const filtered = useMemo(() => {
    if (!filter.trim()) return transactions;
    const q = filter.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        t.date.includes(q)
    );
  }, [transactions, filter]);

  const {
    selected,
    setSelected,
    toggleSelect,
    toggleAll,
    clearSelection,
    allSelected,
    someSelected,
  } = useRowSelection(filtered);

  const applying = bulkCategorizeMutation.isPending || bulkDeleteMutation.isPending;

  const handleBulkApply = async () => {
    if (!bulkCategory || selected.size === 0) return;
    try {
      const ids = Array.from(selected);
      await bulkCategorizeMutation.mutateAsync({ ids, categoryId: bulkCategory });
      toast.success(`${ids.length} transações categorizadas!`);
      clearSelection();
      setBulkCategory('');
    } catch {
      toast.error('Erro ao categorizar.');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Excluir ${selected.size} transações selecionadas?`)) return;
    try {
      const ids = Array.from(selected);
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`${ids.length} transações excluídas!`);
      clearSelection();
    } catch {
      toast.error('Erro ao excluir em lote.');
    }
  };

  const handleQuickCategory = async (id: string, categoryId: string) => {
    try {
      await categorizeMutation.mutateAsync({ id, categoryId });
    } catch {
      toast.error('Erro ao categorizar.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta transação pendente?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Transação excluída.');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const handleToggleIgnore = async (id: string, currentStatus: boolean | null) => {
    const isIgnored = currentStatus === true;
    try {
      await toggleIgnoreMutation.mutateAsync({ id, ignore: !isIgnored });
      toast.success(
        !isIgnored ? 'Transação ignorada em relatórios.' : 'Transação incluída em relatórios.'
      );
    } catch (err: unknown) {
      console.error('handleToggleIgnore error:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar status: ${message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Transações Pendentes</h2>
          <p>{totalElements} transações aguardando categorização</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 420 }}>
          <Search size={15} className="search-icon" />
          <input
            className="input"
            placeholder="Filtrar por descrição, valor ou data..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {someSelected && (
        <div className="bulk-bar">
          <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
          <span className="bulk-count">{selected.size} selecionadas</span>
          <select
            className="select"
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
          >
            <option value="">Escolher categoria...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleBulkApply}
            disabled={!bulkCategory || applying}
          >
            {applying ? <span className="spinner" /> : <Tag size={13} />}
            Aplicar
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleBulkDelete}
            disabled={applying}
          >
            {applying ? <span className="spinner" /> : <Trash2 size={13} />}
            Excluir Selecionadas
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Cancelar
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loadingPending ? (
            <div className="loading-page">
              <span className="spinner" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">🎉</div>
              <p>{filter ? 'Nenhum resultado para o filtro.' : 'Nenhuma transação pendente!'}</p>
              <span>Importe um extrato CSV para começar.</span>
            </div>
          ) : (
            <>
              <div className="mobile-select-all">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={allSelected}
                  onChange={() => toggleAll()}
                  id="mobile-select-all"
                />
                <label htmlFor="mobile-select-all">Selecionar todas</label>
              </div>
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={allSelected}
                        onChange={() => toggleAll()}
                      />
                    </th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 200 }}>Categorizar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr key={tx.id} className={selected.has(tx.id) ? 'selected' : ''}>
                      <td data-label="">
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={selected.has(tx.id)}
                          onChange={() => toggleSelect(tx.id)}
                        />
                      </td>
                      <td data-label="Data" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.date)}
                      </td>
                      <td
                        data-label="Descrição"
                        style={{
                          maxWidth: 340,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.description}
                      </td>
                      <td
                        data-label="Valor"
                        style={{
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          textDecoration: tx.ignore_in_reports ? 'line-through' : 'none',
                          opacity: tx.ignore_in_reports ? 0.6 : 1,
                        }}
                      >
                        {formatAmount(tx.amount, baseCurrency)}
                      </td>
                      <td data-label="Ações">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <select
                            className="select"
                            style={{ fontSize: 12, padding: '5px 10px', flex: 1 }}
                            defaultValue=""
                            onChange={(e) => e.target.value && handleQuickCategory(tx.id, e.target.value)}
                          >
                            <option value="">— categorizar —</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title={
                              tx.ignore_in_reports
                                ? 'Incluir nos relatórios'
                                : 'Ignorar nos relatórios (Transferência)'
                            }
                            onClick={() => handleToggleIgnore(tx.id, tx.ignore_in_reports)}
                            style={{ padding: '6px 8px' }}
                          >
                            {tx.ignore_in_reports ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            title="Excluir Transação"
                            onClick={() => handleDelete(tx.id)}
                            style={{ padding: '6px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
