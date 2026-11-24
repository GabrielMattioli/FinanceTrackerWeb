import { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, Trash2, CheckSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { formatAmount, formatDate } from '../utils/formatters';
import { useRowSelection } from '../hooks/useRowSelection';
import { useSettings } from '../context/SettingsContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useCategories } from '../hooks/queries/useCategoryQueries';
import {
  useBulkDeleteTransactions,
  useCategorizeTransaction,
  useDeleteTransaction,
  useHistoryTransactions,
  useToggleIgnoreTransaction,
  useUncategorizeTransaction,
} from '../hooks/queries/useTransactionQueries';
import type { GetHistoryParams } from '../api/transactions';

export default function HistoryPage() {
  const { baseCurrency } = useSettings();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | ''>(now.getMonth() + 1);
  const [categoryId, setCategoryId] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [confirmState, setConfirmState] = useState<
    { type: 'single'; id: string } | { type: 'bulk'; ids: string[] } | null
  >(null);

  const queryParams = useMemo<GetHistoryParams>(() => {
    const params: GetHistoryParams = { page, size: 50, year };
    if (month !== '') params.month = month;
    if (categoryId) params.categoryId = categoryId;
    return params;
  }, [page, year, month, categoryId]);

  const { data: historyPage, isPending: loading, isError } = useHistoryTransactions(queryParams);
  const { data: categories = [] } = useCategories();

  const uncategorizeMutation = useUncategorizeTransaction();
  const deleteMutation = useDeleteTransaction();
  const bulkDeleteMutation = useBulkDeleteTransactions();
  const categorizeMutation = useCategorizeTransaction();
  const toggleIgnoreMutation = useToggleIgnoreTransaction();

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar histórico.');
    }
  }, [isError]);

  const transactions = useMemo(() => historyPage?.content ?? [], [historyPage]);
  const totalPages = historyPage?.totalPages ?? 0;
  const totalElements = historyPage?.totalElements ?? 0;

  const filtered = useMemo(() => {
    return filter.trim()
      ? transactions.filter((t) => t.description.toLowerCase().includes(filter.toLowerCase()))
      : transactions;
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

  const handleFilterChange = (updater: () => void) => {
    updater();
    setPage(0);
    clearSelection();
  };

  const handleUncategorize = async (id: string) => {
    try {
      await uncategorizeMutation.mutateAsync(id);
      toast.success('Transação movida para Pendentes.');
    } catch {
      toast.error('Erro ao descategorizar.');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({ type: 'single', id });
  };

  const handleQuickCategory = async (id: string, catId: string) => {
    try {
      await categorizeMutation.mutateAsync({ id, categoryId: catId });
    } catch {
      toast.error('Erro ao categorizar.');
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
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar status: ${errorMessage}`);
    }
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    setConfirmState({ type: 'bulk', ids: Array.from(selected) });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === 'single') {
        await deleteMutation.mutateAsync(confirmState.id);
        toast.success('Transação excluída.');
      } else {
        await bulkDeleteMutation.mutateAsync(confirmState.ids);
        toast.success(`${confirmState.ids.length} transações excluídas!`);
        clearSelection();
      }
      setConfirmState(null);
    } catch {
      toast.error(confirmState.type === 'single' ? 'Erro ao excluir.' : 'Erro ao excluir em lote.');
    }
  };

  const applying = bulkDeleteMutation.isPending;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Histórico de Transações</h2>
          <p>{totalElements} transações localizadas</p>
        </div>
        <YearSelector year={year} onYearChange={(y) => handleFilterChange(() => setYear(y))} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <MonthBar
          year={year}
          month={month}
          onMonthChange={(m) => handleFilterChange(() => setMonth(m === '' ? '' : Number(m)))}
          allowAllMonths={true}
          categorizedOnly={true}
        />
      </div>

      <div className="filter-bar">
        <select
          className="select"
          style={{ width: 180 }}
          value={categoryId}
          onChange={(e) => handleFilterChange(() => setCategoryId(e.target.value))}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={15} className="search-icon" />
          <input
            className="input"
            placeholder="Filtrar descrição..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {someSelected && (
        <div className="bulk-bar">
          <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
          <span className="bulk-count">{selected.size} selecionadas</span>
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
          {loading ? (
            <div className="loading-page">
              <span className="spinner" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">📂</div>
              <p>Nenhuma transação neste período.</p>
            </div>
          ) : (
            <>
              <div className="mobile-select-all">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={allSelected}
                  onChange={() => toggleAll()}
                  id="mobile-select-all-history"
                />
                <label htmlFor="mobile-select-all-history">Selecionar todas</label>
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
                        aria-label="Selecionar todas as transações"
                      />
                    </th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 80 }}></th>
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
                          aria-label={`Selecionar transação ${tx.description}`}
                        />
                      </td>
                      <td data-label="Data" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.date)}
                      </td>
                      <td
                        data-label="Descrição"
                        style={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.description}
                      </td>
                      <td data-label="Categoria">
                        <select
                          className="select"
                          style={{ fontSize: 12, padding: '5px 8px', maxWidth: 140 }}
                          value={tx.category ? tx.category.id : ''}
                          onChange={(e) => e.target.value && handleQuickCategory(tx.id, e.target.value)}
                        >
                          <option value="" disabled>
                            Sem categoria
                          </option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
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
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title={
                              tx.ignore_in_reports
                                ? 'Incluir nos relatórios'
                                : 'Ignorar nos relatórios (Transferência)'
                            }
                            aria-label={
                              tx.ignore_in_reports
                                ? `Incluir ${tx.description} nos relatórios`
                                : `Ignorar ${tx.description} nos relatórios`
                            }
                            onClick={() => handleToggleIgnore(tx.id, tx.ignore_in_reports)}
                            style={{ padding: '4px 7px' }}
                          >
                            {tx.ignore_in_reports ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Mover para Pendentes"
                            aria-label={`Mover ${tx.description} para Pendentes`}
                            onClick={() => handleUncategorize(tx.id)}
                            style={{ padding: '4px 7px' }}
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            title="Excluir Transação"
                            aria-label={`Excluir transação ${tx.description}`}
                            onClick={() => handleDelete(tx.id)}
                            style={{ padding: '4px 7px' }}
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
              clearSelection();
            }}
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => {
              setPage(page + 1);
              clearSelection();
            }}
          >
            Próxima →
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={
          confirmState?.type === 'bulk' ? 'Excluir transações selecionadas?' : 'Excluir transação?'
        }
        message={
          confirmState?.type === 'bulk'
            ? `Tem certeza que deseja excluir as ${confirmState.ids.length} transações selecionadas do histórico? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
