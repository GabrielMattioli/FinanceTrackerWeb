import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { Wallet, X, Lightbulb } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function InitialBalanceModal() {
    const { initialBalance, updateInitialBalance, loadingSettings, hasSeenOnboarding, dismissOnboarding } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState<boolean>(false);

useEffect(() => {
        if (loadingSettings) return;

        const checkAndShow = async () => {
            try {
                if (!hasSeenOnboarding && initialBalance === 0) {
                    const { count } = await supabase
                        .from('transactions')
                        .select('id', { count: 'exact', head: true });
                    
                    setIsExistingUser((count || 0) > 0);
                    setIsOpen(true);
                }
            } catch (e) {
                console.error('Failed to check user status', e);
            }
        };

        checkAndShow();
    }, [initialBalance, loadingSettings, hasSeenOnboarding]);

const handleClose = async () => {
        try {
            await dismissOnboarding();
        } catch (e) {
            console.error('Error dismissing onboarding:', e);
        } finally {
            setIsOpen(false);
        }
    };

    const handleSave = async () => {
        const val = parseFloat(inputValue);
        if (isNaN(val)) {
            toast.error('Valor inválido.');
            return;
        }

        setLoading(true);
        try {
            await updateInitialBalance(val);
            toast.success('Saldo inicial configurado!');
            handleClose();
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="modal" style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isExistingUser ? 'Ajuste seu Saldo Inicial' : 'Qual o seu Saldo Atual?'}
                    </h2>
                    <button className="btn btn-ghost btn-sm" onClick={handleClose}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ 
                        background: 'var(--bg-secondary)', 
                        padding: 16, 
                        borderRadius: '50%', 
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <Wallet size={32} />
                    </div>
                </div>
                
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, textAlign: 'center' }}>
                    {isExistingUser 
                        ? 'Novidade! Para que o cálculo bata certinho com a sua conta bancária hoje, qual era o seu saldo ANTES de você começar a registrar transações aqui?'
                        : 'Para que o aplicativo calcule sua Saúde Financeira corretamente desde o início, informe o saldo atual da sua conta bancária.'}
                </p>

                <div className="form-group">
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Ex: 1500.00"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        autoFocus
                        style={{ fontSize: 18, padding: '12px 16px', textAlign: 'center' }}
                    />
                </div>

                <div style={{ 
                    background: 'var(--bg-input, var(--bg-secondary))', 
                    padding: 14, 
                    borderRadius: 10, 
                    display: 'flex', 
                    gap: 12, 
                    textAlign: 'left', 
                    marginTop: 20,
                    border: '1px solid var(--border-subtle, var(--border-color))'
                }}>
                    <Lightbulb size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isExistingUser 
                            ? "Dica: Tente colocar um valor aproximado agora. Depois, lá na tela de Configurações, você pode ir ajustando esse Saldo Inicial até o Saldo Acumulado bater centavo por centavo com o do seu banco hoje!"
                            : "Dica: É simples! Basta abrir o aplicativo do seu banco neste momento e digitar o saldo exato que aparece lá."}
                    </span>
                </div>

                <div className="modal-footer" style={{ marginTop: 28 }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Pular
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Saldo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
