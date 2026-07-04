// @ts-nocheck
import { useState, useRef } from 'react';
import { X, Upload, FileText, Sparkles } from 'lucide-react';
import { importCsv } from '../api/api';
import toast from 'react-hot-toast';

export default function ImportModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    // Fallback manual mapping state (only shown when backend can't auto-detect)
    const [manualMapping, setManualMapping] = useState(null); // { headers, previewRows }
    const [manualCols, setManualCols] = useState({ dateColumn: '', descColumn: '', amountColumn: '' });

    const fileInputRef = useRef(null);

    const handleFile = (f) => {
        if (f && f.name.toLowerCase().endsWith('.csv')) {
            setFile(f);
            setResult(null);
            setManualMapping(null);
        } else {
            toast.error('Por favor, selecione um arquivo .csv');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        try {
            // Zero-config: send no column params, let backend auto-detect
            const options = manualMapping
                ? { dateColumn: Number(manualCols.dateColumn), descColumn: Number(manualCols.descColumn), amountColumn: Number(manualCols.amountColumn) }
                : {};

            const res = await importCsv(file, options);

            if (res.requiresManualMapping) {
                // Backend could not auto-detect — show column picker
                setManualMapping({ headers: res.headers, previewRows: res.previewRows });
                toast('Selecione as colunas manualmente abaixo.', { icon: '🔍' });
                return;
            }

            setResult(res);
            if (res.imported > 0) {
                toast.success(`${res.imported} transações importadas!`);
                onSuccess?.();
            } else {
                toast(res.message || 'Nenhuma transação nova encontrada.');
            }
        } catch (err) {
            toast.error('Erro ao importar: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const manualReady = manualMapping &&
        manualCols.dateColumn !== '' &&
        manualCols.descColumn !== '' &&
        manualCols.amountColumn !== '';

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Importar Extrato CSV</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
                </div>

                {/* Drop Zone */}
                <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onClick={() => fileInputRef.current.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                    {file ? (
                        <>
                            <div className="drop-icon"><FileText style={{ width: 36, height: 36, color: 'var(--accent)' }} /></div>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{file.name}</p>
                            <span>{(file.size / 1024).toFixed(1)} KB — Clique para trocar</span>
                        </>
                    ) : (
                        <>
                            <div className="drop-icon"><Upload style={{ width: 36, height: 36 }} /></div>
                            <p>Arraste o CSV aqui ou clique para selecionar</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', textAlign: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                    <Sparkles size={13} /> Bancos suportados automaticamente:
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    • N26 (Exportação Padrão)<br/>
                                    • Nubank (Exportação Padrão)<br/>
                                    • Sparkasse (Excel CSV-CAMT V2 ou V8)
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Manual Column Picker — only shown when backend returns requiresManualMapping */}
                {manualMapping && (
                    <div className="advanced-section">
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
                            Não foi possível detectar as colunas automaticamente. Selecione abaixo:
                        </p>

                        {/* Preview Table */}
                        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {manualMapping.headers.map((h, i) => (
                                            <th key={i} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                [{i}] {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {manualMapping.previewRows.map((row, ri) => (
                                        <tr key={ri}>
                                            {row.map((cell, ci) => (
                                                <td key={ci} style={{ padding: '3px 8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle, var(--border))' }}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="advanced-grid">
                            {[
                                { label: 'Coluna Data', key: 'dateColumn' },
                                { label: 'Coluna Descrição', key: 'descColumn' },
                                { label: 'Coluna Valor', key: 'amountColumn' },
                            ].map(({ label, key }) => (
                                <div className="form-group" key={key}>
                                    <label className="label">{label}</label>
                                    <select
                                        className="select"
                                        value={manualCols[key]}
                                        onChange={(e) => setManualCols(prev => ({ ...prev, [key]: e.target.value }))}
                                    >
                                        <option value="">Selecione...</option>
                                        {manualMapping.headers.map((h, i) => (
                                            <option key={i} value={i}>[{i}] {h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Import Result */}
                {result && (
                    <div className="import-result" style={{ marginTop: 16 }}>
                        <div className="import-stat success">
                            <span className="count">{result.imported}</span>
                            <span className="label-text">Importadas</span>
                        </div>
                        <div className="import-stat skipped">
                            <span className="count">{result.skipped}</span>
                            <span className="label-text">Duplicatas</span>
                        </div>
                        <div className="import-stat error">
                            <span className="count">{result.errors}</span>
                            <span className="label-text">Erros</span>
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!file || loading || (manualMapping && !manualReady)}
                    >
                        {loading ? <><span className="spinner" /> Importando...</> : <><Upload size={14} /> Importar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
