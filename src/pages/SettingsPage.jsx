import { useState, useEffect } from 'react';
import { Database, Info, Coins } from 'lucide-react';
import { getSettings } from '../api/api';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPage() {
    const [dbDir, setDbDir] = useState('');
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const { baseCurrency, updateBaseCurrency } = useSettings();
    const [updatingCurrency, setUpdatingCurrency] = useState(false);

    useEffect(() => {
        getSettings()
            .then(data => {
                setDbDir(data.dbDir || '');
                setVersion(data.version || '');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        setUpdatingCurrency(true);
        try {
            await updateBaseCurrency(newCurrency);
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingCurrency(false);
        }
    };

    if (loading) return <div className="page-loading">Carregando…</div>;

    return (
        <div className="settings-page">
            {/* Preferences card */}
            <div className="settings-card card">
                <div className="card-header">
                    <Coins size={20} />
                    <span>Preferências</span>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                    <label>Moeda Base</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <select 
                            className="form-control" 
                            value={baseCurrency} 
                            onChange={handleCurrencyChange}
                            disabled={updatingCurrency}
                            style={{ maxWidth: 250 }}
                        >
                            <option value="EUR">Euro (€)</option>
                            <option value="BRL">Real Brasileiro (R$)</option>
                            <option value="USD">Dólar Americano ($)</option>
                        </select>
                        {updatingCurrency && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Atualizando...</span>}
                    </div>
                    <p className="form-hint">
                        A moeda base será exibida em todo o aplicativo (dashboard, transações, etc).
                    </p>
                </div>
            </div>

            {/* Database location card */}
            <div className="settings-card card" style={{ marginTop: 16 }}>
                <div className="card-header">
                    <Database size={20} />
                    <span>Armazenamento de Dados</span>
                </div>

                <p className="settings-desc">
                    O banco de dados é gerenciado automaticamente pelo aplicativo e salvo
                    no diretório padrão do sistema operacional.
                </p>

                <div className="form-group">
                    <label>Local do banco de dados</label>
                    <div
                        className="form-control"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'var(--bg-input, var(--bg-secondary))',
                            color: 'var(--text-secondary)',
                            cursor: 'default',
                            userSelect: 'text',
                            opacity: 0.85,
                        }}
                        title={dbDir}
                    >
                        <Database size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dbDir || '—'}
                        </span>
                    </div>
                    <p className="form-hint">
                        O arquivo <code>financedb.mv.db</code> é salvo nesta pasta automaticamente.
                        Este caminho não pode ser alterado pelo usuário. Em caso de exclusão do arquivo
                        <code>financedb.mv.db</code>, o aplicativo irá recriá-lo automaticamente e todos os dados
                        serão perdidos.
                    </p>
                </div>
            </div>

            {/* About card */}
            <div className="settings-card card" style={{ marginTop: 16 }}>
                <div className="card-header">
                    <Info size={20} />
                    <span>Sobre</span>
                </div>
                <div className="settings-about">
                    <div className="about-row"><span>Versão</span><span>{version}</span></div>
                    <div className="about-row"><span>Banco de dados</span><span>H2 (arquivo local)</span></div>
                </div>
            </div>
        </div>
    );
}
