// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, List, Hash } from 'lucide-react';
import {
    getCategories, createCategory, deleteCategory, updateCategory, bulkDeleteCategories,
    getCategoryRules, createCategoryRule, deleteCategoryRule, applyCategoryRuleToUncategorized
} from '../api/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { formatCurrencyValue } from '../utils/formatters';

const DEFAULT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
    '#10b981', '#14b8a6', '#3b82f6', '#06b6d4', '#84cc16',
];

export default function CategoriesPage() {
    const { baseCurrency } = useSettings();
    const currencySymbols = { 'EUR': '€', 'BRL': 'R$', 'USD': '$' };
    const currencySymbol = currencySymbols[baseCurrency] || '€';

    const [activeTab, setActiveTab] = useState('categories');

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [isEssential, setIsEssential] = useState(false);
    const [expectedAmount, setExpectedAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const colorRef = useRef(null);

    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

    const [rules, setRules] = useState([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [ruleKeyword, setRuleKeyword] = useState('');
    const [ruleCategoryId, setRuleCategoryId] = useState('');
    const [savingRule, setSavingRule] = useState(false);

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

    const loadRules = async () => {
        setLoadingRules(true);
        try {
            setRules(await getCategoryRules());
        } catch {
            if (activeTab === 'rules') toast.error('Erro ao carregar regras.');
        } finally {
            setLoadingRules(false);
        }
    };

    useEffect(() => {
        loadCategories();
        loadRules();
    }, []);

    // --- CATEGORY HANDLERS ---
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                color,
                isEssential,
                expectedAmount: isEssential && expectedAmount ? parseFloat(expectedAmount) : null
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
            setExpectedAmount('');
            setEditingCategoryId(null);
            await loadCategories();
        } catch (err) {
            toast.error(err?.message || 'Erro ao salvar categoria.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditCategory = (c) => {
        setEditingCategoryId(c.id);
        setName(c.name);
        setColor(c.color);
        setIsEssential(c.isEssential || false);
        setExpectedAmount(c.expectedAmount || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setName('');
        setColor('#6366f1');
        setIsEssential(false);
        setExpectedAmount('');
    };

    const handleDeleteCategory = async (id, catName) => {
        if (!window.confirm(`Excluir a categoria "${catName}"? Transações vinculadas voltarão para Pendentes.`)) return;
        try {
            await deleteCategory(id);
            toast.success(`Categoria "${catName}" excluída.`);
            setSelectedCategoryIds(prev => prev.filter(selectedId => selectedId !== id));
            await loadCategories();
            await loadRules();
        } catch {
            toast.error('Erro ao excluir categoria.');
        }
    };

    const handleToggleSelect = (id) => {
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
            await loadRules();
        } catch {
            toast.error('Erro ao excluir categorias.');
        }
    };

    // --- RULE HANDLERS ---
    const handleSaveRule = async (e) => {
        e.preventDefault();
        if (!ruleKeyword.trim() || !ruleCategoryId) return;
        setSavingRule(true);
        try {
            const keyword = ruleKeyword.trim();
            await createCategoryRule({
                keyword: keyword,
                categoryId: ruleCategoryId
            });

            const updatedData = await applyCategoryRuleToUncategorized(keyword, ruleCategoryId);
            const updatedCount = updatedData ? updatedData.length : 0;

            if (updatedCount > 0) {
                toast.success(`Regra criada! ${updatedCount} transações pendentes foram categorizadas.`);
            } else {
                toast.success('Regra criada com sucesso!');
            }

            setRuleKeyword('');
            setRuleCategoryId('');
            await loadRules();
        } catch (err) {
            toast.error(err?.message || 'Erro ao salvar regra.');
        } finally {
            setSavingRule(false);
        }
    };

    const handleDeleteRule = async (id, keyword) => {
        if (!window.confirm(`Excluir a regra para "${keyword}"?`)) return;
        try {
            await deleteCategoryRule(id);
            toast.success(`Regra excluída.`);
            await loadRules();
        } catch {
            toast.error('Erro ao excluir regra.');
        }
    };

    // --- RENDERS ---
    const renderCategories = () => (
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
                                onClick={() => colorRef.current.click()}
                                title="Cor personalizada"
                            >
                                <span style={{ fontSize: 12, position: 'absolute', bottom: -2, right: -2 }}>🎨</span>
                            </button>
                            <input ref={colorRef} type="color" value={color} onChange={e => setColor(e.target.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                        <input type="checkbox" id="isEssential" checked={isEssential} onChange={e => setIsEssential(e.target.checked)} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                        <label htmlFor="isEssential" style={{ cursor: 'pointer', margin: 0, fontSize: 14 }}>Despesa Essencial (Fixa/Recorrente)</label>
                    </div>
                    {isEssential && (
                        <div className="form-group" style={{ marginTop: 10 }}>
                            <label className="label" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Valor Mensal Esperado ({currencySymbol})</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="Ex: 500.00"
                                value={expectedAmount}
                                onChange={e => setExpectedAmount(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}
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
                                            <span style={{ fontSize: 11, background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>
                                                Essencial: {formatCurrencyValue(c.expectedAmount || 0, baseCurrency)}
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

    const renderRules = () => (
        <div className="settings-layout">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="card-title" style={{ marginBottom: 0 }}>Nova Regra</h3>
                </div>
                <form onSubmit={handleSaveRule}>
                    <div className="form-group">
                        <label className="label">Palavra-chave (Keyword)</label>
                        <input
                            className="input"
                            placeholder="Ex: Uber, Ifood, Netflix..."
                            value={ruleKeyword}
                            onChange={e => setRuleKeyword(e.target.value)}
                            maxLength={100}
                        />
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                            Se a descrição da transação contiver esse texto, ela será categorizada automaticamente.
                        </small>
                    </div>
                    <div className="form-group">
                        <label className="label">Categoria Destino</label>
                        <select
                            className="input"
                            value={ruleCategoryId}
                            onChange={e => setRuleCategoryId(e.target.value)}
                            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                        >
                            <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>-- Selecione --</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!ruleKeyword.trim() || !ruleCategoryId || savingRule} style={{ width: '100%' }}>
                        {savingRule ? <span className="spinner" /> : <Plus size={15} />}
                        Criar Regra
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Regras Ativas ({rules.length})</h3>
                </div>
                {loadingRules ? (
                    <div className="loading-page"><span className="spinner" /></div>
                ) : rules.length === 0 ? (
                    <div className="table-empty" style={{ padding: '40px 0' }}>
                        <div className="empty-icon">🤖</div>
                        <p>Nenhuma regra configurada.</p>
                        <span>Crie regras para categorizar transações automaticamente.</span>
                    </div>
                ) : (
                    <div>
                        {rules.map(r => (
                            <div key={r.id} className="category-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Contém: </span>
                                    <strong>"{r.keyword}"</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                                    <span className="category-badge" style={{ background: r.category.color + '22', color: r.category.color, border: `1px solid ${r.category.color}44`, fontSize: 12 }}>
                                        <span className="category-dot" style={{ background: r.category.color }} />
                                        {r.category.name}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDeleteRule(r.id, r.keyword)}
                                        title="Excluir Regra"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Categorias & Automação</h2>
                    <p>Gerencie suas categorias e regras de automação</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                    className={`btn ${activeTab === 'categories' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('categories')}
                    style={activeTab !== 'categories' ? { background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                >
                    <List size={16} /> Categorias
                </button>
                <button
                    className={`btn ${activeTab === 'rules' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('rules')}
                    style={activeTab !== 'rules' ? { background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                >
                    <Hash size={16} /> Categorização Automática
                </button>
            </div>

            {activeTab === 'categories' ? renderCategories() : renderRules()}
        </div>
    );
}
