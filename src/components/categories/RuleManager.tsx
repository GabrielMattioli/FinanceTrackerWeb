import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { getCategoryRules, createCategoryRule, deleteCategoryRule, updateCategoryRule, getCategories } from '../../api/categories';
import { applyCategoryRuleToUncategorized } from '../../api/transactions';
import toast from 'react-hot-toast';

export default function RuleManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [savingRule, setSavingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setLoadingRules(true);
        try {
            const [cats, rls] = await Promise.all([
                getCategories(),
                getCategoryRules()
            ]);
            setCategories(cats);
            setRules(rls);
        } catch {
            toast.error('Erro ao carregar regras e categorias.');
        } finally {
            setLoadingRules(false);
        }
    };

    const loadRules = async () => {
        try {
            setRules(await getCategoryRules());
        } catch {
            // handle error
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveRule = async (e: any) => {
        e.preventDefault();
        if (!keyword.trim() || !categoryId) return;
        setSavingRule(true);
        try {
            const trimmedKeyword = keyword.trim();
            if (editingRuleId) {
                await updateCategoryRule(editingRuleId, {
                    keyword: trimmedKeyword,
                    categoryId: categoryId
                });
                const updatedData = await applyCategoryRuleToUncategorized(trimmedKeyword, categoryId);
                const updatedCount = updatedData ? updatedData.length : 0;
                if (updatedCount > 0) {
                    toast.success(`Regra atualizada! ${updatedCount} transações pendentes foram categorizadas.`);
                } else {
                    toast.success('Regra atualizada com sucesso!');
                }
            } else {
                await createCategoryRule({
                    keyword: trimmedKeyword,
                    categoryId: categoryId
                });
                const updatedData = await applyCategoryRuleToUncategorized(trimmedKeyword, categoryId);
                const updatedCount = updatedData ? updatedData.length : 0;
                if (updatedCount > 0) {
                    toast.success(`Regra criada! ${updatedCount} transações pendentes foram categorizadas.`);
                } else {
                    toast.success('Regra criada com sucesso!');
                }
            }

            handleCancelEditRule();
            await loadRules();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar regra.');
        } finally {
            setSavingRule(false);
        }
    };

    const handleEditRule = (rule: any) => {
        setEditingRuleId(rule.id);
        setKeyword(rule.keyword);
        setCategoryId(rule.category_id);
        setIsModalOpen(true);
    };

    const handleCancelEditRule = () => {
        setEditingRuleId(null);
        setKeyword('');
        setCategoryId('');
        setIsModalOpen(false);
    };

    const handleDeleteRule = async (id: any, ruleKeyword: string) => {
        if (!window.confirm(`Excluir a regra para "${ruleKeyword}"?`)) return;
        try {
            await deleteCategoryRule(id);
            toast.success(`Regra excluída.`);
            await loadRules();
        } catch {
            toast.error('Erro ao excluir regra.');
        }
    };

    const rulesByCategory = rules.reduce((acc, rule) => {
        const categoryId = rule.category_id || (rule.category && rule.category.id);
        if (!acc[categoryId]) {
            acc[categoryId] = {
                category: rule.category,
                rules: []
            };
        }
        acc[categoryId].rules.push(rule);
        return acc;
    }, {} as Record<string, { category: any, rules: any[] }>);

    const groupedRules = Object.values(rulesByCategory).sort((a, b) => {
        if (!a.category) return 1;
        if (!b.category) return -1;
        return a.category.name.localeCompare(b.category.name);
    });

    return (
        <div className="settings-layout">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Regras Ativas ({rules.length})</h3>
                    <button className="btn btn-sm btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> Nova Regra
                    </button>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '16px' }}>
                        {groupedRules.map(group => (
                            <div key={group.category?.id || 'unknown'} style={{
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
                                    {group.category ? (
                                        <>
                                            <span className="category-dot" style={{ background: group.category.color }} />
                                            {group.category.name}
                                        </>
                                    ) : 'Sem Categoria'}
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {group.rules.map(r => (
                                        <div key={r.id} style={{
                                            background: 'var(--bg-card)',
                                            border: `1px solid ${group.category ? group.category.color + '33' : 'var(--border-color)'}`,
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = group.category ? group.category.color + '88' : 'var(--text-muted)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = group.category ? group.category.color + '33' : 'var(--border-color)'; }}
                                        >
                                            <div 
                                                style={{ 
                                                    padding: '6px 12px', 
                                                    fontSize: '13px', 
                                                    color: 'var(--text-main)', 
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                onClick={() => handleEditRule(r)}
                                                title="Clique para editar"
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <span>{r.keyword}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteRule(r.id, r.keyword); }}
                                                title="Excluir Regra"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderLeft: `1px solid ${group.category ? group.category.color + '22' : 'var(--border-color)'}`,
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
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelEditRule()}>
                    <div className="modal" style={{ maxWidth: 500, width: '95%' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingRuleId ? 'Editar Regra' : 'Nova Regra'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={handleCancelEditRule}>
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
                                        onChange={e => setKeyword(e.target.value)}
                                        maxLength={100}
                                        autoFocus
                                    />
                                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                                        Se a descrição da transação contiver esse texto, ela será categorizada automaticamente.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label className="label">Categoria Destino</label>
                                    <select
                                        className="input"
                                        value={categoryId}
                                        onChange={e => setCategoryId(e.target.value)}
                                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                    >
                                        <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>-- Selecione --</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={handleCancelEditRule}>Cancelar</button>
                            <button type="submit" form="rule-form" className="btn btn-primary" disabled={!keyword.trim() || !categoryId || savingRule}>
                                {savingRule ? <span className="spinner" /> : (editingRuleId ? <Edit2 size={15} /> : <Plus size={15} />)}
                                {editingRuleId ? 'Salvar Alterações' : 'Criar Regra'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
