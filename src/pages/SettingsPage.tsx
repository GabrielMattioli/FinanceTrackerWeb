import { useState, useEffect } from 'react';
import { Database, Info, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings } from '../api/settings';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPage() {
    // dbDir is declared but never read, we'll keep it or comment it out
    // const [dbDir, setDbDir] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { baseCurrency, updateBaseCurrency, initialBalance, updateInitialBalance, expectedIncome: dbExpectedIncome, updateExpectedIncome } = useSettings();
    const [updatingCurrency, setUpdatingCurrency] = useState(false);
    const [localExpectedIncome, setLocalExpectedIncome] = useState('');
    const [updatingInitialBalance, setUpdatingInitialBalance] = useState(false);
    const [localInitialBalance, setLocalInitialBalance] = useState('');

    useEffect(() => {
        setLocalExpectedIncome(dbExpectedIncome !== null ? String(dbExpectedIncome) : '');
        setLocalInitialBalance(String(initialBalance));
        getSettings()
            .then((data) => setLocalInitialBalance(String(data?.initialBalance || 0)))
            .finally(() => setLoading(false));
    }, [initialBalance, dbExpectedIncome]);

    const handleCurrencyChange = async (e: any) => {
        const newCurrency = e.target.value;
        setUpdatingCurrency(true);
        try {
            await updateBaseCurrency(newCurrency);
            toast.success('Moeda base atualizada!');
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao atualizar: ' + (err.message || JSON.stringify(err)));
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

                
                <div className="form-group" style={{ marginTop: 24 }}>
                    <label>Saldo Inicial</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={localInitialBalance}
                            onChange={(e) => setLocalInitialBalance(e.target.value)}
                            onBlur={async () => {
                                const val = parseFloat(localInitialBalance);
                                if (isNaN(val) || val === initialBalance) return;
                                setUpdatingInitialBalance(true);
                                try {
                                    await updateInitialBalance(val);
                                    toast.success('Saldo inicial atualizado!');
                                } catch (err: any) {
                                    console.error(err);
                                    toast.error('Erro ao atualizar: ' + (err.message || JSON.stringify(err)));
                                    setLocalInitialBalance(String(initialBalance));
                                } finally {
                                    setUpdatingInitialBalance(false);
                                }
                            }}
                            disabled={updatingInitialBalance}
                            placeholder="Ex: 1500,00"
                            style={{ maxWidth: 250 }}
                        />
                        {updatingInitialBalance && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Atualizando...</span>}
                    </div>
                    <p className="form-hint">
                        Este valor é adicionado ao saldo total da sua conta para refletir a quantia que você tinha antes de começar a rastrear transações.
                    </p>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                    <label>Receita Principal Esperada</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={localExpectedIncome}
                            onChange={(e) => setLocalExpectedIncome(e.target.value)}
                            onBlur={async () => {
                                const val = parseFloat(localExpectedIncome);
                                const newVal = isNaN(val) ? null : val;
                                if (newVal === dbExpectedIncome) return;
                                try {
                                    await updateExpectedIncome(newVal);
                                    toast.success('Receita esperada atualizada!');
                                } catch (err: any) {
                                    console.error(err);
                                    toast.error('Erro ao atualizar receita: ' + (err.message || JSON.stringify(err)));
                                    setLocalExpectedIncome(dbExpectedIncome !== null ? String(dbExpectedIncome) : '');
                                }
                            }}
                            placeholder="Ex: 3500,00"
                            style={{ maxWidth: 250 }}
                        />
                    </div>
                    <p className="form-hint">
                        Valor fixo usado para projetar a "Saúde Financeira". Deixe em branco para o app estimar automaticamente com base no mês passado.
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
                    O banco de dados é gerenciado na nuvem e salvo de forma segura.
                </p>

                <div className="form-group">
                    <label>Provedor de Banco de Dados</label>
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
                    >
                        <Database size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Supabase (Nuvem)
                        </span>
                    </div>
                    <p className="form-hint">
                        Seus dados são sincronizados automaticamente e não correm risco de serem perdidos localmente.
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
                    <div className="about-row"><span>Versão</span><span>1.0.0</span></div>
                    <div className="about-row"><span>Banco de dados</span><span>Supabase (PostgreSQL)</span></div>
                </div>
            </div>
        </div>
    );
}
