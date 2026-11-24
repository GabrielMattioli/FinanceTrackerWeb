import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
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

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (catsError || rulesError) {
      toast.error('Erro ao carregar regras e categorias.');
    }
  }, [catsError, rulesError]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isModalOpen && dialog.open) {
      dialog.close();
    }

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      };
      dialog.addEventListener('click', handleBackdropClick);
      return () => dialog.removeEventListener('click', handleBackdropClick);
    }
  }, [isModalOpen]);

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
        if (updatedCount > 0) {
          toast.success(
            `Regra atualizada! ${updatedCount} transações pendentes foram categorizadas.`
          );
        } else {
          toast.success('Regra atualizada com sucesso!');
        }
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
        if (updatedCount > 0) {
          toast.success(`Regra criada! ${updatedCount} transações pendentes foram categorizadas.`);
        } else {
          toast.success('Regra criada com sucesso!');
        }
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

  const handleDeleteRule = async (id: string, ruleKeyword: string) => {
    if (!window.confirm(`Excluir a regra para "${ruleKeyword}"?`)) return;
    try {
      await deleteRuleMutation.mutateAsync(id);
      toast.success('Regra excluída.');
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              padding: '16px',
            }}
          >
            {groupedRules.map((group) => {
              const groupColor = group.category?.color || '#6366f1';
              return (
                <div
                  key={group.category?.id || 'unknown'}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h4
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                    }}
                  >
                    {group.category ? (
                      <>
                        <span className="category-dot" style={{ background: groupColor }} />
                        {group.category.name}
                      </>
                    ) : (
                      'Sem Categoria'
                    )}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.rules.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: `1px solid ${group.category ? `${groupColor}33` : 'var(--border-color)'}`,
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = group.category
                            ? `${groupColor}88`
                            : 'var(--text-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = group.category
                            ? `${groupColor}33`
                            : 'var(--border-color)';
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onClick={() => handleEditRule(r)}
                          title="Clique para editar"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{r.keyword}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteRule(r.id, r.keyword);
                          }}
                          title="Excluir Regra"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderLeft: `1px solid ${group.category ? `${groupColor}22` : 'var(--border-color)'}`,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--danger)';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
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

      {isModalOpen && (
        <dialog
          ref={dialogRef}
          className="modal"
          style={{ maxWidth: 500, width: '95%', margin: 'auto' }}
          onClose={handleCancelEditRule}
          closedby="any"
        >
          <div className="modal-header">
            <h2 className="modal-title">{editingRuleId ? 'Editar Regra' : 'Nova Regra'}</h2>
            <button type="button" className="btn btn-ghost btn-icon" onClick={handleCancelEditRule}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <form id="rule-form" onSubmit={handleSaveRule}>
              <div className="form-group">
                <label className="label">Palavra-chave (Keyword)</label>
                <input
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
                <label className="label">Categoria Destino</label>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                  >
                    -- Selecione --
                  </option>
                  {categories.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
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
          </div>
        </dialog>
      )}
    </div>
  );
}
