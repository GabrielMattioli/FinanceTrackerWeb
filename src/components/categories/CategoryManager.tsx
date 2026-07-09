import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { getCategories, createCategory, deleteCategory, updateCategory, bulkDeleteCategories } from '../../api/categories';

import toast from 'react-hot-toast';

const DEFAULT_COLORS = [
    '#ef4444', '#f43f5e', '#ec4899', // Reds & Pinks
    '#f97316', '#f59e0b', '#eab308', // Oranges & Yellows
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', // Greens
    '#06b6d4', '#0ea5e9', '#3b82f6', // Blues
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', // Purples & Indigos
    '#64748b', '#52525b', '#78716c', // Grays
];

export default function CategoryManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [isEssential, setIsEssential] = useState(false);
    const [isSavings, setIsSavings] = useState(false);
    const [isMainIncome, setIsMainIncome] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<any>(null);
    const colorRef = useRef<HTMLInputElement>(null);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            setCategories(await getCategories());
        } catch {
            toast.error('Erro ao carregar categorias.');
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleSaveCategory = async (e: any) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                color,
                isEssential,
                isSavings,
                isMainIncome
            };
            if (editingCategoryId) {
                await updateCategory(editingCategoryId, payload);
                toast.success('Categoria atualizada!');
            } else {
                await createCategory(payload);
                toast.success('Categoria criada!');
            }
            setName('');
            setColor('#6366f1');
            setIsEssential(false);
            setIsSavings(false);
            setIsMainIncome(false);
            setEditingCategoryId(null);
            setIsModalOpen(false);
            await loadCategories();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar categoria.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditCategory = (c: any) => {
        setEditingCategoryId(c.id);
        setName(c.name);
        setColor(c.color);
        setIsEssential(c.isEssential || false);
        setIsSavings(c.isSavings || false);
        setIsMainIncome(c.isMainIncome || false);
        setIsModalOpen(true);
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setName('');
        setColor('#6366f1');
        setIsEssential(false);
        setIsSavings(false);
        setIsMainIncome(false);
        setIsModalOpen(false);
    };

    const handleDeleteCategory = async (id: any, catName: string) => {
        if (!window.confirm(`Excluir a categoria "${catName}"? Transações vinculadas voltarão para Pendentes.`)) return;
        try {
            await deleteCategory(id);
            toast.success(`Categoria "${catName}" excluída.`);
            setSelectedCategoryIds(prev => prev.filter(selectedId => selectedId !== id));
            await loadCategories();
        } catch {
            toast.error('Erro ao excluir categoria.');
        }
    };

    const handleToggleSelect = (id: any) => {
        setSelectedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedCategoryIds.length === 0) return;
        if (!window.confirm(`Excluir as ${selectedCategoryIds.length} categorias selecionadas? Transações vinculadas voltarão para Pendentes.`)) return;
        try {
            await bulkDeleteCategories(selectedCategoryIds);
            toast.success(`${selectedCategoryIds.length} categorias excluídas.`);
            setSelectedCategoryIds([]);
            await loadCategories();
        } catch {
            toast.error('Erro ao excluir categorias.');
        }
    };

    const groupedCategories = [
        { id: 'income', name: 'Entradas Principais', icon: '💰', items: categories.filter(c => c.isMainIncome) },
        { id: 'essential', name: 'Despesas Essenciais', icon: '🏠', items: categories.filter(c => c.isEssential && !c.isMainIncome) },
        { id: 'savings', name: 'Economias & Investimentos', icon: '📈', items: categories.filter(c => c.isSavings && !c.isEssential && !c.isMainIncome) },
        { id: 'others', name: 'Outras Categorias', icon: '🏷️', items: categories.filter(c => !c.isMainIncome && !c.isEssential && !c.isSavings) },
    ].filter(g => g.items.length > 0);

    return (
        <div className="settings-layout">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Categorias ({categories.length})</h3>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {selectedCategoryIds.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }} className="mobile-hidden">{selectedCategoryIds.length} selecionadas</span>
                                <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
                                    <Trash2 size={14} /> <span className="mobile-hidden">Excluir</span>
                                </button>
                            </div>
                        )}
                        <button className="btn btn-sm btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} /> Nova
                        </button>
                    </div>
                </div>
                {loadingCategories ? (
                    <div className="loading-page"><span className="spinner" /></div>
                ) : categories.length === 0 ? (
                    <div className="table-empty" style={{ padding: '40px 0' }}>
                        <div className="empty-icon">🏷️</div>
                        <p>Nenhuma categoria criada.</p>
                        <span>Clique em "Nova" para adicionar uma categoria.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '16px' }}>
                        {groupedCategories.map(group => (
                            <div key={group.id} style={{
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h4 style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontSize: '15px'
                                }}>
                                    <span style={{ fontSize: '16px' }}>{group.icon}</span>
                                    {group.name}
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {group.items.map(c => (
                                        <div key={c.id} style={{
                                            background: 'var(--bg-card)',
                                            border: `1px solid ${selectedCategoryIds.includes(c.id) ? c.color : c.color + '40'}`,
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedCategoryIds.includes(c.id) ? `0 0 0 1px ${c.color}` : 'none'
                                        }}
                                            onMouseEnter={e => { if (!selectedCategoryIds.includes(c.id)) e.currentTarget.style.borderColor = c.color + '88'; }}
                                            onMouseLeave={e => { if (!selectedCategoryIds.includes(c.id)) e.currentTarget.style.borderColor = c.color + '40'; }}
                                        >
                                            <div style={{ padding: '0 0 0 10px', display: 'flex', alignItems: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCategoryIds.includes(c.id)} 
                                                    onChange={() => handleToggleSelect(c.id)}
                                                    style={{ cursor: 'pointer', margin: 0, width: 14, height: 14, accentColor: c.color }}
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
                                                    gap: '6px'
                                                }}
                                                onClick={() => handleEditCategory(c)}
                                                title="Clique para editar"
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <span className="category-dot" style={{ background: c.color, width: 8, height: 8, minWidth: 8 }} />
                                                <span>{c.name}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id, c.name); }}
                                                title="Excluir Categoria"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderLeft: `1px solid ${c.color + '22'}`,
                                                    padding: '6px 10px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelEditCategory()}>
                    <div className="modal" style={{ maxWidth: 500, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={handleCancelEditCategory}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="category-form" onSubmit={handleSaveCategory}>
                                <div className="form-group">
                                    <label className="label">Nome</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: Alimentação, Transporte..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        maxLength={100}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Cor</label>
                                    <div className="color-picker-wrapper" style={{ flexWrap: 'wrap', gap: 8 }}>
                                        {DEFAULT_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                style={{
                                                    width: 28, height: 28,
                                                    background: c,
                                                    borderRadius: 8,
                                                    border: color === c ? '2px solid white' : '2px solid transparent',
                                                    cursor: 'pointer',
                                                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                                                    transition: 'transform 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        ))}
                                        <button
                                            type="button"
                                            className="color-swatch"
                                            style={{ background: color, width: 28, height: 28, borderRadius: 8, border: '2px solid var(--border-light)', cursor: 'pointer', position: 'relative' }}
                                            onClick={() => colorRef.current?.click()}
                                            title="Cor personalizada"
                                        >
                                            <span style={{ fontSize: 12, position: 'absolute', bottom: -2, right: -2 }}>🎨</span>
                                        </button>
                                        <input ref={colorRef} type="color" value={color} onChange={e => setColor(e.target.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
                                    <div
                                        onClick={() => setIsEssential(!isEssential)}
                                        style={{
                                            border: `2px solid ${isEssential ? 'var(--accent)' : 'var(--border-color)'}`,
                                            background: isEssential ? 'var(--accent-light)' : 'var(--bg-card)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px'
                                        }}
                                    >
                                        <input type="checkbox" checked={isEssential} readOnly style={{ width: 18, height: 18, accentColor: 'var(--accent)', marginTop: 2, cursor: 'pointer' }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Despesa Essencial</h4>
                                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Despesas fixas cobradas todos os meses.</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setIsSavings(!isSavings)}
                                        style={{
                                            border: `2px solid ${isSavings ? '#10b981' : 'var(--border-color)'}`,
                                            background: isSavings ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px'
                                        }}
                                    >
                                        <input type="checkbox" checked={isSavings} readOnly style={{ width: 18, height: 18, accentColor: '#10b981', marginTop: 2, cursor: 'pointer' }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Economia ou Investimento</h4>
                                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Identifica valores poupados ou investidos.</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setIsMainIncome(!isMainIncome)}
                                        style={{
                                            border: `2px solid ${isMainIncome ? '#eab308' : 'var(--border-color)'}`,
                                            background: isMainIncome ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-card)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px'
                                        }}
                                    >
                                        <input type="checkbox" checked={isMainIncome} readOnly style={{ width: 18, height: 18, accentColor: '#eab308', marginTop: 2, cursor: 'pointer' }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Entrada Principal</h4>
                                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Considerada a fonte principal de receita.</p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={handleCancelEditCategory}>Cancelar</button>
                            <button type="submit" form="category-form" className="btn btn-primary" disabled={!name.trim() || saving}>
                                {saving ? <span className="spinner" /> : (editingCategoryId ? <Edit2 size={15} /> : <Plus size={15} />)}
                                {editingCategoryId ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
