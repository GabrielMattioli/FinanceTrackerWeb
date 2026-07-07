import { ShieldCheck, AlertCircle, Info, TrendingDown, Target } from 'lucide-react';
import { formatCurrencyValue } from '../../utils/formatters';

export default function SafetyMarginCard({ data, baseCurrency }: any) {
    const accBal = Number(data?.accumulatedBalance ?? data?.netBalance ?? 0);
    const pendingIncome = Number(data?.pendingIncome || 0);
    const effectiveBal = accBal + pendingIncome;
    const safe = Number(data?.safeMoneyMargin || 0);
    const expectedTotal = Number(data?.expectedEssentialOutflow || 0);
    const reserved = Math.max(0, effectiveBal - safe);

    const safePctCalc = effectiveBal > 0 ? (safe / effectiveBal) * 100 : 0;
    
    let statusColor = '#10b981';
    let statusMsg = '';
    let StatusIcon = ShieldCheck;
    
    if (safe <= 0) {
        statusColor = '#f43f5e'; // Red (Crítico)
        statusMsg = "Crítico: Saldo livre esgotado! Foque apenas no essencial.";
        StatusIcon = AlertCircle;
    } else if (safePctCalc < 15) {
        statusColor = '#f97316'; // Orange (Aperto)
        statusMsg = "Aperto: Quase todo o seu saldo projetado está comprometido.";
        StatusIcon = AlertCircle;
    } else if (safePctCalc < 30) {
        statusColor = '#f59e0b'; // Yellow (Atenção)
        statusMsg = "Atenção: Sua folga é pequena. Cuidado com gastos não planejados.";
        StatusIcon = Info;
    } else if (safePctCalc < 50) {
        statusColor = '#10b981'; // Green (Saudável)
        statusMsg = "Saudável: Você tem uma boa margem para lazer e imprevistos.";
        StatusIcon = ShieldCheck;
    } else {
        statusColor = '#3b82f6'; // Blue (Excelente)
        statusMsg = "Excelente: Grande parte da sua renda está livre! Ótimo momento para investir.";
        StatusIcon = ShieldCheck;
    }

    const statusClass = safe <= 0 ? 'danger' : (safePctCalc < 30 ? 'tight' : 'safe');

    // Percentage calculation for the bar visual
    let safePct = 0;
    let reservedPct = 0;
    if (effectiveBal > 0) {
        reservedPct = Math.min(100, (reserved / effectiveBal) * 100);
        safePct = Math.max(0, 100 - reservedPct);
    } else {
        reservedPct = 100;
    }

    return (
        <div className={`card safety-card ${statusClass}`} style={{ marginBottom: 24, padding: '24px' }}>
            <div className="safety-status-label" style={{ color: statusColor }}>
                <StatusIcon size={18} className={safe <= 0 ? 'danger-icon' : ''} />
                <span>Saúde Financeira: Margem de Segurança</span>
            </div>

            <div style={{ marginTop: 16, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Livre para Gastar</div>
                <div style={{ fontSize: 42, fontWeight: 700, color: statusColor, letterSpacing: '-1px' }}>
                    {formatCurrencyValue(safe, baseCurrency)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        Total Projetado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrencyValue(effectiveBal, baseCurrency)}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        Contas Fixas: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrencyValue(expectedTotal, baseCurrency)}</strong>
                    </div>
                </div>
            </div>

            <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--bg-input, var(--bg-secondary))', marginBottom: 12 }}>
                {effectiveBal > 0 ? (
                    <>
                        <div style={{ width: `${reservedPct}%`, backgroundColor: statusColor, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)', transition: 'width 0.5s ease-in-out' }} title={`Comprometido: ${reservedPct.toFixed(0)}%`} />
                        <div style={{ width: `${safePct}%`, background: 'var(--text-muted)', opacity: 0.3 }} title={`Folga: ${safePct.toFixed(0)}%`} />
                    </>
                ) : (
                    <div style={{ width: '100%', backgroundColor: '#f43f5e', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)' }} title="Sem folga" />
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                    <span>Comprometido ({reservedPct.toFixed(0)}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    <span>Folga ({safePct.toFixed(0)}%)</span>
                </div>
            </div>

            {safe <= 0 && (
                <div style={{ textAlign: 'center', color: '#f43f5e', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
                    <TrendingDown size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                    Excedido em {formatCurrencyValue(Math.abs(safe), baseCurrency)}
                </div>
            )}

            <div className="safety-tip">
                <Target size={16} />
                <span>
                    <strong>Dica:</strong> {statusMsg} (Despesas Fixas Pendentes: <strong>{formatCurrencyValue(expectedTotal, baseCurrency)}</strong>
                    {pendingIncome > 0 && <>, Receita Pendente Esperada: <strong>{formatCurrencyValue(pendingIncome, baseCurrency)}</strong></>})
                </span>
            </div>
        </div>
    );
}
