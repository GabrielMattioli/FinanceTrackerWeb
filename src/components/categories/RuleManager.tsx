import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { getCategoryRules, createCategoryRule, deleteCategoryRule, updateCategoryRule, getCategories } from '../../api/categories';
import { applyCategoryRuleToUncategorized } from '../../api/transactions';
import toast from 'react-hot-toast';

export default function RuleManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [ruleKeyword, setRuleKeyword] = useState('');
    const [ruleCategoryId, setRuleCategoryId] = useState('');
    const [savingRule, setSavingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<any>(null);
    const [editRuleKeyword, setEditRuleKeyword] = useState('');
    const [editRuleCategoryId, setEditRuleCategoryId] = useState('');

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
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar regra.');
        } finally {
            setSavingRule(false);
        }
    };

    const handleEditRule = (rule: any) => {
        setEditingRuleId(rule.id);
        setEditRuleKeyword(rule.keyword);
        setEditRuleCategoryId(rule.category_id);
    };

    const handleCancelEditRule = () => {
        setEditingRuleId(null);
        setEditRuleKeyword('');
        setEditRuleCategoryId('');
    };

    const handleUpdateRule = async (id: any) => {
        if (!editRuleKeyword.trim() || !editRuleCategoryId) return;
        setSavingRule(true);
        try {
            const keyword = editRuleKeyword.trim();
            await updateCategoryRule(id, {
                keyword: keyword,
                categoryId: editRuleCategoryId
            });
            toast.success('Regra atualizada com sucesso!');
            handleCancelEditRule();
            await loadRules();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao atualizar regra.');
        } finally {
            setSavingRule(false);
        }
    };

    const handleDeleteRule = async (id: any, keyword: string) => {
        if (!window.confirm(`Excluir a regra para "${keyword}"?`)) return;
        try {
            await deleteCategoryRule(id);
            toast.success(`Regra excluída.`);
            await loadRules();
        } catch {
            toast.error('Erro ao excluir regra.');
        }
    };

    return (
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
                                {editingRuleId === r.id ? (
                                    <>
                                        <input
                                            className="input"
                                            value={editRuleKeyword}
                                            onChange={e => setEditRuleKeyword(e.target.value)}
                                            style={{ padding: '6px 10px', fontSize: 13 }}
                                            maxLength={100}
                                        />
                                        <select
                                            className="input"
                                            value={editRuleCategoryId}
                                            onChange={e => setEditRuleCategoryId(e.target.value)}
                                            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', padding: '6px 10px', fontSize: 13 }}
                                        >
                                            <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>-- Selecione --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateRule(r.id)} disabled={savingRule}>
                                                Salvar
                                            </button>
                                            <button className="btn btn-sm" onClick={handleCancelEditRule} style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
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
                                                className="btn btn-sm"
                                                onClick={() => handleEditRule(r)}
                                                title="Editar Regra"
                                                style={{ background: 'transparent', color: 'var(--text-main)' }}
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteRule(r.id, r.keyword)}
                                                title="Excluir Regra"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
