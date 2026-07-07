// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { Search, CheckSquare, Tag, Trash2, Eye, EyeOff } from 'lucide-react';
import { getPending, bulkCategorize, categorizeOne, deleteTransaction, bulkDelete, toggleIgnoreInReports } from '../api/transactions';
import { getCategories } from '../api/categories';
import toast from 'react-hot-toast';
import { formatAmount, formatDate } from '../utils/formatters';
import { useRowSelection } from '../hooks/useRowSelection';
import { useSettings } from '../context/SettingsContext';

export default function PendingPage({ onCountChange }: any) {
    const { baseCurrency } = useSettings();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [bulkCategory, setBulkCategory] = useState('');
    const [applying, setApplying] = useState(false);

    const load = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [txPage, cats] = await Promise.all([getPending(0, 500), getCategories()]);
            setTransactions(txPage.content || []);
            setCategories(cats);
            onCountChange?.(txPage.totalElements || 0);
        } catch {
            toast.error('Erro ao carregar transações pendentes.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!filter.trim()) return transactions;
        const q = filter.toLowerCase();
        return transactions.filter(t =>
            t.description.toLowerCase().includes(q) ||
            String(t.amount).includes(q) ||
            t.date.includes(q)
        );
    }, [transactions, filter]);

    const { selected, setSelected, toggleSelect, toggleAll, clearSelection, allSelected, someSelected } = useRowSelection(filtered);

    const handleBulkApply = async () => {
        if (!bulkCategory || selected.size === 0) return;
        setApplying(true);
        try {
            await bulkCategorize([...selected], bulkCategory);
            toast.success(`${selected.size} transações categorizadas!`);
            clearSelection();
            setBulkCategory('');
            await load();
        } catch {
            toast.error('Erro ao categorizar.');
        } finally {
            setApplying(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        if (!window.confirm(`Excluir ${selected.size} transições selecionadas?`)) return;
        setApplying(true);
        try {
            await bulkDelete([...selected]);
            toast.success(`${selected.size} transações excluídas!`);
            clearSelection();
            await load();
        } catch {
            toast.error('Erro ao excluir em lote.');
        } finally {
            setApplying(false);
        }
    };

    const handleQuickCategory = async (id: any, categoryId: any) => {
        try {
            await categorizeOne(id, categoryId);
            await load(false);
        } catch {
            toast.error('Erro ao categorizar.');
        }
    };

    const handleDelete = async (id: any) => {
        if (!window.confirm('Excluir esta transação pendente?')) return;
        try {
            await deleteTransaction(id);
            toast.success('Transação excluída.');
            load(false);
        } catch {
            toast.error('Erro ao excluir.');
        }
    };

    const handleToggleIgnore = async (id: any, currentStatus: boolean) => {
        try {
            await toggleIgnoreInReports(id, !currentStatus);
            toast.success(!currentStatus ? 'Transação ignorada em relatórios.' : 'Transação incluída em relatórios.');
            await load(false);
        } catch (err: any) {
            console.error('handleToggleIgnore error:', err);
            toast.error(`Erro ao atualizar status: ${err?.message || 'Erro desconhecido'}`);
        }
    };


    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Transações Pendentes</h2>
                    <p>{transactions.length} transações aguardando categorização</p>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-bar" style={{ flex: 1, maxWidth: 420 }}>
                    <Search size={15} className="search-icon" />
                    <input
                        className="input"
                        placeholder="Filtrar por descrição, valor ou data..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Bulk Action Bar */}
            {someSelected && (
                <div className="bulk-bar">
                    <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
                    <span className="bulk-count">{selected.size} selecionadas</span>
                    <select
                        className="select"
                        value={bulkCategory}
                        onChange={e => setBulkCategory(e.target.value)}
                    >
                        <option value="">Escolher categoria...</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleBulkApply}
                        disabled={!bulkCategory || applying}
                    >
                        {applying ? <span className="spinner" /> : <Tag size={13} />}
                        Aplicar
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleBulkDelete}
                        disabled={applying}
                    >
                        {applying ? <span className="spinner" /> : <Trash2 size={13} />}
                        Excluir Selecionadas
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
                        Cancelar
                    </button>
                </div>
            )}

            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-page"><span className="spinner" /> Carregando...</div>
                    ) : filtered.length === 0 ? (
                        <div className="table-empty">
                            <div className="empty-icon">🎉</div>
                            <p>{filter ? 'Nenhum resultado para o filtro.' : 'Nenhuma transação pendente!'}</p>
                            <span>Importe um extrato CSV para começar.</span>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 44 }}>
                                        <input
                                            type="checkbox"
                                            className="custom-checkbox"
                                            checked={allSelected}
                                            onChange={() => toggleAll()}
                                        />
                                    </th>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Tipo</th>
                                    <th style={{ textAlign: 'right' }}>Valor</th>
                                    <th style={{ width: 200 }}>Categorizar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(tx => (
                                    <tr key={tx.id} className={selected.has(tx.id) ? 'selected' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="custom-checkbox"
                                                checked={selected.has(tx.id)}
                                                onChange={() => toggleSelect(tx.id)}
                                            />
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                            {formatDate(tx.date)}
                                        </td>
                                        <td style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tx.description}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${tx.amount >= 0 ? 'income' : 'expense'}`}>
                                                {tx.amount >= 0 ? '↑ Entrada' : '↓ Saída'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', textDecoration: tx.ignore_in_reports ? 'line-through' : 'none', opacity: tx.ignore_in_reports ? 0.6 : 1 }}>
                                            {formatAmount(tx.amount, baseCurrency)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <select
                                                    className="select"
                                                    style={{ fontSize: 12, padding: '5px 10px', flex: 1 }}
                                                    defaultValue=""
                                                    onChange={e => e.target.value && handleQuickCategory(tx.id, e.target.value)}
                                                >
                                                    <option value="">— categorizar —</option>
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title={tx.ignore_in_reports ? "Incluir nos relatórios" : "Ignorar nos relatórios (Transferência)"}
                                                    onClick={() => handleToggleIgnore(tx.id, tx.ignore_in_reports)}
                                                    style={{ padding: '6px 8px' }}
                                                >
                                                    {tx.ignore_in_reports ? <Eye size={13} /> : <EyeOff size={13} />}
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    title="Excluir Transação"
                                                    onClick={() => handleDelete(tx.id)}
                                                    style={{ padding: '6px 8px' }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
