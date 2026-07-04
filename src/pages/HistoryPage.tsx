// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RotateCcw, Trash2, CheckSquare, Eye, EyeOff } from 'lucide-react';
import { getHistory, getCategories, uncategorizeOne, deleteTransaction, bulkDelete, categorizeOne, toggleIgnoreInReports } from '../api/api';
import toast from 'react-hot-toast';
import { MonthBar, YearSelector } from '../components/MonthYearSelector';
import { formatAmount, formatDate } from '../utils/formatters';
import { useRowSelection } from '../hooks/useRowSelection';
import { useSettings } from '../context/SettingsContext';

export default function HistoryPage() {
    const { baseCurrency } = useSettings();
    const now = new Date();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [categoryId, setCategoryId] = useState('');
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [applying, setApplying] = useState(false);

    const load = async (p = 0, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = { page: p, size: 50 };
            if (year) params.year = year;
            if (month) params.month = month;
            if (categoryId) params.categoryId = categoryId;
            const [txPage, cats] = await Promise.all([getHistory(params), getCategories()]);
            setTransactions(txPage.content || []);
            setTotalPages(txPage.totalPages || 0);
            setTotalElements(txPage.totalElements || 0);
            setCategories(cats);
            clearSelection();
        } catch {
            toast.error('Erro ao carregar histórico.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month, categoryId]);

    const handleCategorize = async (id: any, catId: any) => {
        try {
            await uncategorizeOne(id);
            toast.success('Transação movida para Pendentes.');
            load(page, false);
        } catch {
            toast.error('Erro ao descategorizar.');
        }
    };

    const handleUncategorize = async (id: any) => {
        try {
            await uncategorizeOne(id);
            toast.success('Transação movida para Pendentes.');
            load(page, false);
        } catch {
            toast.error('Erro ao descategorizar.');
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm('Excluir esta transação?')) return;
        try {
            await deleteTransaction(id);
            toast.success('Transação excluída.');
            load(page, false);
        } catch {
            toast.error('Erro ao excluir.');
        }
    };

    const handleQuickCategory = async (id, catId) => {
        try {
            await categorizeOne(id, catId);
            load(page, false);
        } catch {
            toast.error('Erro ao categorizar.');
        }
    };

    const handleToggleIgnore = async (id: any, currentStatus: boolean) => {
        try {
            await toggleIgnoreInReports(id, !currentStatus);
            toast.success(!currentStatus ? 'Transação ignorada em relatórios.' : 'Transação incluída em relatórios.');
            load(page, false);
        } catch (err: any) {
            console.error('handleToggleIgnore error:', err);
            toast.error(`Erro ao atualizar status: ${err?.message || 'Erro desconhecido'}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        if (!confirm(`Excluir ${selected.size} transições selecionadas do histórico?`)) return;
        setApplying(true);
        try {
            await bulkDelete([...selected]);
            toast.success(`${selected.size} transações excluídas!`);
            clearSelection();
            load(page, false);
        } catch {
            toast.error('Erro ao excluir em lote.');
        } finally {
            setApplying(false);
        }
    };

    const filtered = filter.trim()
        ? transactions.filter(t => t.description.toLowerCase().includes(filter.toLowerCase()))
        : transactions;

    const { selected, setSelected, toggleSelect, toggleAll, clearSelection, allSelected, someSelected } = useRowSelection(filtered);

    // Note: clearSelection is used inside `load` — React guarantees the latest ref is used
    // because `load` is recreated each render and captures the latest `clearSelection`.


    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Histórico de Transações</h2>
                    <p>{totalElements} transações localizadas</p>
                </div>
                <YearSelector year={year} onYearChange={setYear} />
            </div>

            <div style={{ marginBottom: 24 }}>
                <MonthBar year={year} month={month} onMonthChange={setMonth} allowAllMonths={true} categorizedOnly={true} />
            </div>

            <div className="filter-bar">
                <select className="select" style={{ width: 180 }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Todas as categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
                    <Search size={15} className="search-icon" />
                    <input
                        className="input"
                        placeholder="Filtrar descrição..."
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
                            <div className="empty-icon">📂</div>
                            <p>Nenhuma transação neste período.</p>
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
                                    <th>Categoria</th>
                                    <th>Tipo</th>
                                    <th style={{ textAlign: 'right' }}>Valor</th>
                                    <th style={{ width: 80 }}></th>
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
                                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tx.description}
                                        </td>
                                        <td>
                                            <select
                                                className="select"
                                                style={{ fontSize: 12, padding: '5px 8px', maxWidth: 140 }}
                                                value={tx.category ? tx.category.id : ""}
                                                onChange={e => e.target.value && handleQuickCategory(tx.id, e.target.value)}
                                            >
                                                <option value="" disabled>Sem categoria</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
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
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title={tx.ignore_in_reports ? "Incluir nos relatórios" : "Ignorar nos relatórios (Transferência)"}
                                                    onClick={() => handleToggleIgnore(tx.id, tx.ignore_in_reports)}
                                                    style={{ padding: '4px 7px' }}
                                                >
                                                    {tx.ignore_in_reports ? <Eye size={13} /> : <EyeOff size={13} />}
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title="Mover para Pendentes"
                                                    onClick={() => handleUncategorize(tx.id)}
                                                    style={{ padding: '4px 7px' }}
                                                >
                                                    <RotateCcw size={13} />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    title="Excluir Transação"
                                                    onClick={() => handleDelete(tx.id)}
                                                    style={{ padding: '4px 7px' }}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => { setPage(page - 1); load(page - 1); }}>
                        ← Anterior
                    </button>
                    <span className="page-info">Página {page + 1} de {totalPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => { setPage(page + 1); load(page + 1); }}>
                        Próxima →
                    </button>
                </div>
            )}
        </div>
    );
}
