import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { getCategories, createCategory, deleteCategory, updateCategory, bulkDeleteCategories } from '../../api/categories';

import toast from 'react-hot-toast';

const DEFAULT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
    '#10b981', '#14b8a6', '#3b82f6', '#06b6d4', '#84cc16',
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setName('');
        setColor('#6366f1');
        setIsEssential(false);
        setIsSavings(false);
        setIsMainIncome(false);
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

    return (
        <div className="settings-layout">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="card-title" style={{ marginBottom: 0 }}>
                        {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    {editingCategoryId && (
                        <button className="btn btn-sm" onClick={handleCancelEditCategory} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                            <X size={16} /> Cancelar
                        </button>
                    )}
                </div>
                <form onSubmit={handleSaveCategory}>
                    <div className="form-group">
                        <label className="label">Nome</label>
                        <input
                            className="input"
                            placeholder="Ex: Alimentação, Transporte..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={100}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
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
                                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Despesas fixas que sao cobradas todos os meses (ex: aluguel, internet, academia).</p>
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
                                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Identifica valores poupados ou investidos, separando-os de despesas comuns.</p>
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
                                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Considerada a fonte principal de receita (ex: salário) nos cálculos de saldo.</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginBottom: 16, marginTop: 16 }}>
                        <label className="label">Preview</label>
                        <span className="category-badge" style={{ background: color + '22', color, border: `1px solid ${color}44`, fontSize: 13 }}>
                            <span className="category-dot" style={{ background: color }} />
                            {name || 'Nome da categoria'}
                        </span>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!name.trim() || saving} style={{ width: '100%' }}>
                        {saving ? <span className="spinner" /> : (editingCategoryId ? <Edit2 size={15} /> : <Plus size={15} />)}
                        {editingCategoryId ? 'Salvar Alterações' : 'Criar Categoria'}
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Categorias ({categories.length})</h3>
                    {selectedCategoryIds.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedCategoryIds.length} selecionadas</span>
                            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
                                <Trash2 size={14} /> Excluir
                            </button>
                        </div>
                    )}
                </div>
                {loadingCategories ? (
                    <div className="loading-page"><span className="spinner" /></div>
                ) : categories.length === 0 ? (
                    <div className="table-empty" style={{ padding: '40px 0' }}>
                        <div className="empty-icon">🏷️</div>
                        <p>Nenhuma categoria criada.</p>
                        <span>Adicione uma categoria ao lado.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '16px' }}>
                        {categories.map(c => (
                            <div key={c.id} style={{
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="checkbox"
                                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                                        checked={selectedCategoryIds.includes(c.id)}
                                        onChange={() => handleToggleSelect(c.id)}
                                    />
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color }} />
                                    <span style={{ fontWeight: 600, fontSize: '15px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>{c.color}</span>
                                        {c.isEssential && (
                                            <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, border: '1px solid rgba(59,130,246,0.2)' }}>
                                                Essencial
                                            </span>
                                        )}
                                        {c.isSavings && (
                                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, border: '1px solid rgba(16,185,129,0.2)' }}>
                                                Economia
                                            </span>
                                        )}
                                        {c.isMainIncome && (
                                            <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, border: '1px solid rgba(234,179,8,0.2)' }}>
                                                Entrada Principal
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleEditCategory(c)}
                                            style={{ padding: '6px' }}
                                            title="Editar Categoria"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleDeleteCategory(c.id, c.name)}
                                            style={{ padding: '6px', color: 'var(--danger)' }}
                                            title="Excluir Categoria"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
