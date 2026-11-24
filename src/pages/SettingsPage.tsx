import { useState, type ChangeEvent } from 'react';
import { Database, Info, Coins, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import { getAllTransactionsForExport } from '../api/transactions';
import {
  downloadTextFile,
  serializeTransactionsToCsv,
  serializeTransactionsToJson,
} from '../utils/exportTransactions';

export default function SettingsPage() {
  const {
    baseCurrency,
    updateBaseCurrency,
    initialBalance,
    updateInitialBalance,
    expectedIncome: dbExpectedIncome,
    updateExpectedIncome,
    loadingSettings,
  } = useSettings();
  const { preference, systemTheme, setPreference } = useTheme();
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [draftExpectedIncome, setDraftExpectedIncome] = useState<string | null>(null);
  const [updatingInitialBalance, setUpdatingInitialBalance] = useState(false);
  const [draftInitialBalance, setDraftInitialBalance] = useState<string | null>(null);
  const [exportingBackup, setExportingBackup] = useState(false);

  const handleFullBackup = async (format: 'csv' | 'json') => {
    setExportingBackup(true);
    try {
      const rows = await getAllTransactionsForExport({ includeUncategorized: true });
      if (rows.length === 0) {
        toast('Nenhuma transação encontrada para exportar.');
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        downloadTextFile(
          serializeTransactionsToCsv(rows),
          `backup-financetracker-${today}.csv`,
          'text/csv;charset=utf-8'
        );
      } else {
        downloadTextFile(
          serializeTransactionsToJson(rows),
          `backup-financetracker-${today}.json`,
          'application/json;charset=utf-8'
        );
      }
      toast.success(`Backup de ${rows.length} transações exportado!`);
    } catch {
      toast.error('Erro ao exportar backup.');
    } finally {
      setExportingBackup(false);
    }
  };

  const localInitialBalance = draftInitialBalance ?? String(initialBalance);
  const localExpectedIncome =
    draftExpectedIncome ?? (dbExpectedIncome !== null ? String(dbExpectedIncome) : '');

  const handleCurrencyChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setUpdatingCurrency(true);
    try {
      await updateBaseCurrency(newCurrency);
      toast.success('Moeda base atualizada!');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar: ${message}`);
    } finally {
      setUpdatingCurrency(false);
    }
  };

  if (loadingSettings) return <div className="page-loading">Carregando…</div>;

  return (
    <div className="settings-page">
      <div className="settings-card card">
        <div className="card-header">
          <Coins size={20} />
          <span>Preferências</span>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label htmlFor="settings-currency">Moeda Base</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              id="settings-currency"
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
            {updatingCurrency && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Atualizando...</span>
            )}
          </div>
          <p className="form-hint">
            A moeda base será exibida em todo o aplicativo (dashboard, transações, etc).
          </p>
        </div>

        <div className="form-group" style={{ marginTop: 24 }}>
          <label htmlFor="settings-theme">Aparência</label>
          <select
            id="settings-theme"
            className="form-control"
            value={preference}
            onChange={(e) => setPreference(e.target.value as ThemePreference)}
            style={{ maxWidth: 250 }}
          >
            <option value="system">
              Sistema ({systemTheme === 'dark' ? 'Escuro' : 'Claro'})
            </option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
          <p className="form-hint">
            Por padrão o aplicativo acompanha o tema do seu sistema operacional.
          </p>
        </div>

        <div className="form-group" style={{ marginTop: 24 }}>
          <label htmlFor="settings-initial-balance">Saldo Inicial</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="settings-initial-balance"
              type="number"
              step="0.01"
              className="form-control"
              value={localInitialBalance}
              onChange={(e) => setDraftInitialBalance(e.target.value)}
              onBlur={async () => {
                const raw = localInitialBalance;
                setDraftInitialBalance(null);
                const val = parseFloat(raw);
                if (Number.isNaN(val) || val === initialBalance) return;
                setUpdatingInitialBalance(true);
                try {
                  await updateInitialBalance(val);
                  toast.success('Saldo inicial atualizado!');
                } catch (err: unknown) {
                  console.error(err);
                  const message = err instanceof Error ? err.message : 'Erro desconhecido';
                  toast.error(`Erro ao atualizar: ${message}`);
                } finally {
                  setUpdatingInitialBalance(false);
                }
              }}
              disabled={updatingInitialBalance}
              placeholder="Ex: 1500,00"
              style={{ maxWidth: 250 }}
            />
            {updatingInitialBalance && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Atualizando...</span>
            )}
          </div>
          <p className="form-hint">
            Este valor é adicionado ao saldo total da sua conta para refletir a quantia que você
            tinha antes de começar a rastrear transações.
          </p>
        </div>

        <div className="form-group" style={{ marginTop: 24 }}>
          <label htmlFor="settings-expected-income">Receita Principal Esperada</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="settings-expected-income"
              type="number"
              step="0.01"
              className="form-control"
              value={localExpectedIncome}
              onChange={(e) => setDraftExpectedIncome(e.target.value)}
              onBlur={async () => {
                const raw = localExpectedIncome;
                setDraftExpectedIncome(null);
                const val = parseFloat(raw);
                const newVal = Number.isNaN(val) ? null : val;
                if (newVal === dbExpectedIncome) return;
                try {
                  await updateExpectedIncome(newVal);
                  toast.success('Receita esperada atualizada!');
                } catch (err: unknown) {
                  console.error(err);
                  const message = err instanceof Error ? err.message : 'Erro desconhecido';
                  toast.error(`Erro ao atualizar receita: ${message}`);
                }
              }}
              placeholder="Ex: 3500,00"
              style={{ maxWidth: 250 }}
            />
          </div>
          <p className="form-hint">
            Valor fixo usado para projetar a "Saúde Financeira". Deixe em branco para o app estimar
            automaticamente com base no mês passado.
          </p>
        </div>
      </div>

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
            Seus dados são sincronizados automaticamente e não correm risco de serem perdidos
            localmente.
          </p>
        </div>

        <div className="form-group" style={{ marginTop: 20, marginBottom: 0 }}>
          <label>Exportar Backup Completo</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleFullBackup('csv')}
              disabled={exportingBackup}
            >
              <Download size={14} /> Exportar CSV
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleFullBackup('json')}
              disabled={exportingBackup}
            >
              <Download size={14} /> Exportar JSON
            </button>
          </div>
          <p className="form-hint">
            Baixe todas as suas transações (categorizadas e pendentes) para backup ou uso em
            planilhas.
          </p>
        </div>
      </div>

      <div className="settings-card card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <Info size={20} />
          <span>Sobre</span>
        </div>
        <div className="settings-about">
          <div className="about-row">
            <span>Versão</span>
            <span>1.0.0</span>
          </div>
          <div className="about-row">
            <span>Banco de dados</span>
            <span>Supabase (PostgreSQL)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
