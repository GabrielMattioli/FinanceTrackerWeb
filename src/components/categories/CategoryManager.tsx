import { useState, useMemo, useEffect, type CSSProperties, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  useBulkDeleteCategories,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../hooks/queries/useCategoryQueries';
import type { Category } from '../../types/domain';

type ConfirmState =
  | { type: 'single'; id: string; name: string }
  | { type: 'bulk'; ids: string[] }
  | null;

export default function CategoryManager() {
  const { data: categories = [], isPending: loadingCategories, isError } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const bulkDeleteMutation = useBulkDeleteCategories();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isEssential, setIsEssential] = useState(false);
  const [isSavings, setIsSavings] = useState(false);
  const [isMainIncome, setIsMainIncome] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar categorias.');
    }
  }, [isError]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  const resetForm = () => {
    setEditingCategoryId(null);
    setName('');
    setColor('#6366f1');
    setIsEssential(false);
    setIsSavings(false);
    setIsMainIncome(false);
    setIsModalOpen(false);
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const payload = {
        name: name.trim(),
        color,
        isEssential,
        isSavings,
        isMainIncome,
      };
      if (editingCategoryId) {
        await updateMutation.mutateAsync({ id: editingCategoryId, dto: payload });
        toast.success('Categoria atualizada!');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Categoria criada!');
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar categoria.';
      toast.error(message);
    }
  };

  const handleEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setName(c.name);
    setColor(c.color || '#6366f1');
    setIsEssential(c.isEssential);
    setIsSavings(c.isSavings);
    setIsMainIncome(c.isMainIncome);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === 'single') {
        await deleteMutation.mutateAsync(confirmState.id);
        toast.success(`Categoria "${confirmState.name}" excluída.`);
        setSelectedCategoryIds((prev) => prev.filter((id) => id !== confirmState.id));
      } else {
        await bulkDeleteMutation.mutateAsync(confirmState.ids);
        toast.success(`${confirmState.ids.length} categorias excluídas.`);
        setSelectedCategoryIds([]);
      }
      setConfirmState(null);
    } catch {
      toast.error(
        confirmState.type === 'single' ? 'Erro ao excluir categoria.' : 'Erro ao excluir categorias.'
      );
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const groupedCategories = useMemo(() => {
    return [
      {
        id: 'income',
        name: 'Entradas Principais',
        icon: '💰',
        items: categories.filter((c) => c.isMainIncome),
      },
      {
        id: 'essential',
        name: 'Despesas Essenciais',
        icon: '🏠',
        items: categories.filter((c) => c.isEssential && !c.isMainIncome),
      },
      {
        id: 'savings',
        name: 'Economias & Investimentos',
        icon: '📈',
        items: categories.filter((c) => c.isSavings && !c.isEssential && !c.isMainIncome),
      },
      {
        id: 'others',
        name: 'Outras Categorias',
        icon: '🏷️',
        items: categories.filter((c) => !c.isMainIncome && !c.isEssential && !c.isSavings),
      },
    ].filter((g) => g.items.length > 0);
  }, [categories]);

  return (
    <div className="settings-layout">
      <div className="card">
        <div
          className="card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3 className="card-title">Categorias ({categories.length})</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedCategoryIds.length > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }} className="mobile-hidden">
                  {selectedCategoryIds.length} selecionadas
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => setConfirmState({ type: 'bulk', ids: selectedCategoryIds })}
                >
                  <Trash2 size={14} /> <span className="mobile-hidden">Excluir</span>
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} /> Nova
            </button>
          </div>
        </div>
        {loadingCategories ? (
          <div className="loading-page">
            <span className="spinner" />
          </div>
        ) : categories.length === 0 ? (
          <div className="table-empty" style={{ padding: '40px 0' }}>
            <div className="empty-icon">🏷️</div>
            <p>Nenhuma categoria criada.</p>
            <span>Clique em "Nova" para adicionar uma categoria.</span>
          </div>
        ) : (
          <div className="entity-group-grid">
            {groupedCategories.map((group) => (
              <div key={group.id} className="entity-group-card">
                <h4 className="entity-group-title">
                  <span style={{ fontSize: 16 }} aria-hidden="true">
                    {group.icon}
                  </span>
                  {group.name}
                </h4>
                <div className="entity-chip-list">
                  {group.items.map((c) => {
                    const catColor = c.color || '#6366f1';
                    const isSelected = selectedCategoryIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`entity-chip ${isSelected ? 'selected' : ''}`}
                        style={{ '--chip-color': catColor } as CSSProperties}
                      >
                        <div className="entity-chip-check">
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(c.id)}
                            aria-label={`Selecionar categoria ${c.name}`}
                            style={{ '--checkbox-color': catColor } as CSSProperties}
                          />
                        </div>
                        <button
                          type="button"
                          className="entity-chip-body"
                          onClick={() => handleEditCategory(c)}
                          title="Clique para editar"
                        >
                          <span className="category-dot" style={{ background: catColor }} />
                          <span>{c.name}</span>
                        </button>
                        <button
                          type="button"
                          className="entity-chip-remove"
                          onClick={() => setConfirmState({ type: 'single', id: c.id, name: c.name })}
                          title="Excluir Categoria"
                          aria-label={`Excluir categoria ${c.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        isEditing={Boolean(editingCategoryId)}
        name={name}
        setName={setName}
        color={color}
        setColor={setColor}
        isEssential={isEssential}
        setIsEssential={setIsEssential}
        isSavings={isSavings}
        setIsSavings={setIsSavings}
        isMainIncome={isMainIncome}
        setIsMainIncome={setIsMainIncome}
        saving={saving}
        onSave={handleSaveCategory}
        onClose={resetForm}
      />

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={
          confirmState?.type === 'bulk' ? 'Excluir categorias selecionadas?' : 'Excluir categoria?'
        }
        message={
          confirmState?.type === 'bulk'
            ? `Excluir as ${confirmState.ids.length} categorias selecionadas? Transações vinculadas voltarão para Pendentes.`
            : confirmState?.type === 'single'
              ? `Excluir a categoria "${confirmState.name}"? Transações vinculadas voltarão para Pendentes.`
              : ''
        }
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
