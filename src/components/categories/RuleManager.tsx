import { useState, useEffect, useMemo, type CSSProperties, type FormEvent } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  useCategories,
  useCategoryRules,
  useCreateCategoryRule,
  useDeleteCategoryRule,
  useUpdateCategoryRule,
} from '../../hooks/queries/useCategoryQueries';
import { useApplyCategoryRule } from '../../hooks/queries/useTransactionQueries';
import type { CategoryRule, CategorySummary } from '../../types/domain';

interface RuleGroup {
  category: CategorySummary | null;
  rules: CategoryRule[];
}

export default function RuleManager() {
  const { data: categories = [], isError: catsError } = useCategories();
  const { data: rules = [], isPending: loadingRules, isError: rulesError } = useCategoryRules();

  const createRuleMutation = useCreateCategoryRule();
  const updateRuleMutation = useUpdateCategoryRule();
  const deleteRuleMutation = useDeleteCategoryRule();
  const applyRuleMutation = useApplyCategoryRule();

  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string; keyword: string } | null>(null);

  useEffect(() => {
    if (catsError || rulesError) {
      toast.error('Erro ao carregar regras e categorias.');
    }
  }, [catsError, rulesError]);

  const savingRule =
    createRuleMutation.isPending || updateRuleMutation.isPending || applyRuleMutation.isPending;

  const handleCancelEditRule = () => {
    setEditingRuleId(null);
    setKeyword('');
    setCategoryId('');
    setIsModalOpen(false);
  };

  const handleSaveRule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!keyword.trim() || !categoryId) return;
    try {
      const trimmedKeyword = keyword.trim();
      if (editingRuleId) {
        await updateRuleMutation.mutateAsync({
          id: editingRuleId,
          dto: { keyword: trimmedKeyword, categoryId },
        });
        const updatedData = await applyRuleMutation.mutateAsync({
          keyword: trimmedKeyword,
          categoryId,
        });
        const updatedCount = updatedData ? updatedData.length : 0;
        toast.success(
          updatedCount > 0
            ? `Regra atualizada! ${updatedCount} transações pendentes foram categorizadas.`
            : 'Regra atualizada com sucesso!'
        );
      } else {
        await createRuleMutation.mutateAsync({
          keyword: trimmedKeyword,
          categoryId,
        });
        const updatedData = await applyRuleMutation.mutateAsync({
          keyword: trimmedKeyword,
          categoryId,
        });
        const updatedCount = updatedData ? updatedData.length : 0;
        toast.success(
          updatedCount > 0
            ? `Regra criada! ${updatedCount} transações pendentes foram categorizadas.`
            : 'Regra criada com sucesso!'
        );
      }

      handleCancelEditRule();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar regra.';
      toast.error(message);
    }
  };

  const handleEditRule = (rule: CategoryRule) => {
    setEditingRuleId(rule.id);
    setKeyword(rule.keyword);
    setCategoryId(rule.category_id || '');
    setIsModalOpen(true);
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRuleMutation.mutateAsync(ruleToDelete.id);
      toast.success('Regra excluída.');
      setRuleToDelete(null);
    } catch {
      toast.error('Erro ao excluir regra.');
    }
  };

  const groupedRules = useMemo<RuleGroup[]>(() => {
    const byCategory = new Map<string, RuleGroup>();
    for (const rule of rules) {
      const key = rule.category_id || rule.category?.id || 'unknown';
      const existing = byCategory.get(key) ?? { category: rule.category, rules: [] };
      existing.rules.push(rule);
      byCategory.set(key, existing);
    }
    return Array.from(byCategory.values()).sort((a, b) => {
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.name.localeCompare(b.category.name);
    });
  }, [rules]);

  return (
    <div className="settings-layout">
      <div className="card">
        <div
          className="card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3 className="card-title">Regras Ativas ({rules.length})</h3>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} /> Nova Regra
          </button>
        </div>
        {loadingRules ? (
          <div className="loading-page">
            <span className="spinner" />
          </div>
        ) : rules.length === 0 ? (
          <div className="table-empty" style={{ padding: '40px 0' }}>
            <div className="empty-icon">🤖</div>
            <p>Nenhuma regra configurada.</p>
            <span>Crie regras para categorizar transações automaticamente.</span>
          </div>
        ) : (
          <div className="entity-group-grid">
            {groupedRules.map((group) => {
              const groupColor = group.category?.color || '#6366f1';
              return (
                <div key={group.category?.id || 'unknown'} className="entity-group-card">
                  <h4 className="entity-group-title">
                    {group.category ? (
                      <>
                        <span className="category-dot" style={{ background: groupColor }} />
                        {group.category.name}
                      </>
                    ) : (
                      'Sem Categoria'
                    )}
                  </h4>
                  <div className="entity-chip-list">
                    {group.rules.map((r) => (
                      <div
                        key={r.id}
                        className="entity-chip"
                        style={{ '--chip-color': group.category ? groupColor : 'var(--border-color)' } as CSSProperties}
                      >
                        <button
                          type="button"
                          className="entity-chip-body"
                          onClick={() => handleEditRule(r)}
                          title="Clique para editar"
                        >
                          <span>{r.keyword}</span>
                        </button>
                        <button
                          type="button"
                          className="entity-chip-remove"
                          onClick={() => setRuleToDelete({ id: r.id, keyword: r.keyword })}
                          title="Excluir Regra"
                          aria-label={`Excluir regra ${r.keyword}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingRuleId ? 'Editar Regra' : 'Nova Regra'}
        onClose={handleCancelEditRule}
        maxWidth={500}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={handleCancelEditRule}>
              Cancelar
            </button>
            <button
              type="submit"
              form="rule-form"
              className="btn btn-primary"
              disabled={!keyword.trim() || !categoryId || savingRule}
            >
              {savingRule ? (
                <span className="spinner" />
              ) : editingRuleId ? (
                <Edit2 size={15} />
              ) : (
                <Plus size={15} />
              )}
              {editingRuleId ? 'Salvar Alterações' : 'Criar Regra'}
            </button>
          </>
        }
      >
        <form id="rule-form" onSubmit={handleSaveRule}>
          <div className="form-group">
            <label className="label" htmlFor="rule-keyword-input">
              Palavra-chave (Keyword)
            </label>
            <input
              id="rule-keyword-input"
              className="input"
              placeholder="Ex: Uber, Ifood, Netflix..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              Se a descrição da transação contiver esse texto, ela será categorizada
              automaticamente.
            </small>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="rule-category-select">
              Categoria Destino
            </label>
            <select
              id="rule-category-select"
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">-- Selecione --</option>
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
        isOpen={ruleToDelete !== null}
        title="Excluir regra?"
        message={ruleToDelete ? `Excluir a regra para "${ruleToDelete.keyword}"?` : ''}
        confirmLabel="Excluir"
        loading={deleteRuleMutation.isPending}
        onConfirm={() => void handleConfirmDeleteRule()}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
}
