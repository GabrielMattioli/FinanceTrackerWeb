import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { Search, CheckSquare, Tag, Trash2, Eye, EyeOff, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAmount, formatDate } from '../utils/formatters';
import { useRowSelection } from '../hooks/useRowSelection';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useSettings } from '../context/SettingsContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useCategories, useCreateCategoryRule } from '../hooks/queries/useCategoryQueries';
import {
  useApplyCategoryRule,
  useBulkCategorize,
  useBulkDeleteTransactions,
  useCategorizeTransaction,
  useDeleteTransaction,
  usePendingTransactions,
  useToggleIgnoreTransaction,
} from '../hooks/queries/useTransactionQueries';
import type { Transaction } from '../types/domain';

function suggestKeyword(description: string): string {
  const firstSegment = description.split(' - ')[0]?.trim() || description.trim();
  return firstSegment.slice(0, 40);
}

export default function PendingPage() {
  const { baseCurrency } = useSettings();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [bulkCategory, setBulkCategory] = useState('');
  const [ruleModalTx, setRuleModalTx] = useState<Transaction | null>(null);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [confirmState, setConfirmState] = useState<
    { type: 'single'; id: string } | { type: 'bulk'; ids: string[] } | null
  >(null);

  const queryParams = useMemo(
    () => ({
      page,
      size: 50,
      search: debouncedSearch.trim() || undefined,
    }),
    [page, debouncedSearch]
  );

  const { data: pendingPage, isPending: loadingPending, isError } = usePendingTransactions(queryParams);
  const { data: categories = [] } = useCategories();

  const categorizeMutation = useCategorizeTransaction();
  const bulkCategorizeMutation = useBulkCategorize();
  const deleteMutation = useDeleteTransaction();
  const bulkDeleteMutation = useBulkDeleteTransactions();
  const toggleIgnoreMutation = useToggleIgnoreTransaction();
  const createRuleMutation = useCreateCategoryRule();
  const applyRuleMutation = useApplyCategoryRule();

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar transações pendentes.');
    }
  }, [isError]);

  const transactions = useMemo(() => pendingPage?.content ?? [], [pendingPage]);
  const totalElements = pendingPage?.totalElements ?? 0;
  const totalPages = pendingPage?.totalPages ?? 0;

  const {
    selected,
    setSelected,
    toggleSelect,
    toggleAll,
    clearSelection,
    allSelected,
    someSelected,
  } = useRowSelection(transactions);

  const applying = bulkCategorizeMutation.isPending || bulkDeleteMutation.isPending;
  const savingRule = createRuleMutation.isPending || applyRuleMutation.isPending;

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

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    setConfirmState({ type: 'bulk', ids: Array.from(selected) });
  };

  const handleQuickCategory = async (id: string, categoryId: string) => {
    try {
      await categorizeMutation.mutateAsync({ id, categoryId });
    } catch {
      toast.error('Erro ao categorizar.');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({ type: 'single', id });
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

  const openQuickRule = (tx: Transaction) => {
    setRuleModalTx(tx);
    setRuleKeyword(suggestKeyword(tx.description));
    setRuleCategoryId('');
  };

  const handleCreateQuickRule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = ruleKeyword.trim();
    if (!trimmed || !ruleCategoryId) return;
    try {
      await createRuleMutation.mutateAsync({ keyword: trimmed, categoryId: ruleCategoryId });
      const applied = await applyRuleMutation.mutateAsync({
        keyword: trimmed,
        categoryId: ruleCategoryId,
      });
      const count = applied ? applied.length : 0;
      toast.success(
        count > 0
          ? `Regra criada e aplicada em ${count} transações pendentes!`
          : 'Regra criada com sucesso!'
      );
      setRuleModalTx(null);
      setRuleKeyword('');
      setRuleCategoryId('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar regra.';
      toast.error(message);
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
            placeholder="Buscar pendentes por descrição..."
            aria-label="Buscar transações pendentes"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
              clearSelection();
            }}
          />
        </div>
      </div>

      {someSelected && (
        <div className="bulk-bar">
          <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
          <span className="bulk-count">{selected.size} selecionadas</span>
          <select
            className="select"
            aria-label="Categoria para aplicar em lote"
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
          ) : transactions.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">🎉</div>
              <p>{search ? 'Nenhum resultado para o filtro.' : 'Nenhuma transação pendente!'}</p>
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
                        aria-label="Selecionar todas as transações"
                      />
                    </th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 270 }}>Categorizar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
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
                          maxWidth: 340,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={tx.description}
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
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <select
                            className="select"
                            aria-label={`Categorizar ${tx.description}`}
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
                            title="Criar regra automática a partir desta transação"
                            aria-label={`Criar regra para ${tx.description}`}
                            onClick={() => openQuickRule(tx)}
                            style={{ padding: '6px 7px' }}
                          >
                            <Wand2 size={13} />
                          </button>
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
                            style={{ padding: '6px 7px' }}
                          >
                            {tx.ignore_in_reports ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            title="Excluir Transação"
                            aria-label={`Excluir transação ${tx.description}`}
                            onClick={() => handleDelete(tx.id)}
                            style={{ padding: '6px 7px' }}
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

      <Modal
        isOpen={ruleModalTx !== null}
        title="Criar Regra Automática"
        onClose={() => setRuleModalTx(null)}
        maxWidth={460}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setRuleModalTx(null)}
              disabled={savingRule}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="quick-rule-form"
              className="btn btn-primary"
              disabled={!ruleKeyword.trim() || !ruleCategoryId || savingRule}
            >
              {savingRule ? <span className="spinner" /> : <Wand2 size={14} />}
              Criar e Aplicar
            </button>
          </>
        }
      >
        <form id="quick-rule-form" onSubmit={handleCreateQuickRule}>
          <div className="form-group">
            <label className="label" htmlFor="quick-rule-keyword">
              Palavra-chave na descrição
            </label>
            <input
              id="quick-rule-keyword"
              className="input"
              value={ruleKeyword}
              onChange={(e) => setRuleKeyword(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
            <p className="form-hint">
              Todas as transações pendentes contendo esse texto serão categorizadas automaticamente.
            </p>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="quick-rule-category">
              Categoria Destino
            </label>
            <select
              id="quick-rule-category"
              className="select"
              value={ruleCategoryId}
              onChange={(e) => setRuleCategoryId(e.target.value)}
              required
            >
              <option value="">-- Selecione uma categoria --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={
          confirmState?.type === 'bulk' ? 'Excluir transações selecionadas?' : 'Excluir transação?'
        }
        message={
          confirmState?.type === 'bulk'
            ? `Tem certeza que deseja excluir as ${confirmState.ids.length} transações selecionadas? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta transação pendente? Esta ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
