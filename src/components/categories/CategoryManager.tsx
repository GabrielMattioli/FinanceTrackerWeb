import { useState, useMemo, useEffect, type CSSProperties, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CategoryModal } from './CategoryModal';
import {
  useBulkDeleteCategories,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../hooks/queries/useCategoryQueries';
import type { Category } from '../../types/domain';

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

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar categorias.');
    }
  }, [isError]);

  const saving = createMutation.isPending || updateMutation.isPending;

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

  const handleDeleteCategory = async (id: string, catName: string) => {
    if (
      !window.confirm(
        `Excluir a categoria "${catName}"? Transações vinculadas voltarão para Pendentes.`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Categoria "${catName}" excluída.`);
      setSelectedCategoryIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch {
      toast.error('Erro ao excluir categoria.');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCategoryIds.length === 0) return;
    if (
      !window.confirm(
        `Excluir as ${selectedCategoryIds.length} categorias selecionadas? Transações vinculadas voltarão para Pendentes.`
      )
    ) {
      return;
    }
    try {
      await bulkDeleteMutation.mutateAsync(selectedCategoryIds);
      toast.success(`${selectedCategoryIds.length} categorias excluídas.`);
      setSelectedCategoryIds([]);
    } catch {
      toast.error('Erro ao excluir categorias.');
    }
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
                <button type="button" className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              padding: '16px',
            }}
          >
            {groupedCategories.map((group) => (
              <div
                key={group.id}
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
                  <span style={{ fontSize: '16px' }}>{group.icon}</span>
                  {group.name}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {group.items.map((c) => {
                    const catColor = c.color || '#6366f1';
                    const isSelected = selectedCategoryIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: `1px solid ${isSelected ? catColor : `${catColor}40`}`,
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 0 0 1px ${catColor}` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = `${catColor}88`;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = `${catColor}40`;
                        }}
                      >
                        <div style={{ padding: '0 0 0 10px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(c.id)}
                            style={{ '--checkbox-color': catColor } as CSSProperties}
                          />
                        </div>
                        <div
                          style={{
                            padding: '6px 10px 6px 8px',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onClick={() => handleEditCategory(c)}
                          title="Clique para editar"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span
                            className="category-dot"
                            style={{ background: catColor, width: 8, height: 8, minWidth: 8 }}
                          />
                          <span>{c.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteCategory(c.id, c.name);
                          }}
                          title="Excluir Categoria"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderLeft: `1px solid ${catColor}22`,
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
    </div>
  );
}
