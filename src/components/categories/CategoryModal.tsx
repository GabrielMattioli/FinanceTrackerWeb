import React, { useRef } from 'react';
import { Plus, Edit2, X } from 'lucide-react';

const DEFAULT_COLORS = [
    '#ef4444', '#f43f5e', '#ec4899', // Reds & Pinks
    '#f97316', '#f59e0b', '#eab308', // Oranges & Yellows
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', // Greens
    '#06b6d4', '#0ea5e9', '#3b82f6', // Blues
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', // Purples & Indigos
    '#64748b', '#52525b', '#78716c', // Grays
];

interface CategoryModalProps {
    isOpen: boolean;
    isEditing: boolean;
    name: string;
    setName: (val: string) => void;
    color: string;
    setColor: (val: string) => void;
    isEssential: boolean;
    setIsEssential: (val: boolean) => void;
    isSavings: boolean;
    setIsSavings: (val: boolean) => void;
    isMainIncome: boolean;
    setIsMainIncome: (val: boolean) => void;
    saving: boolean;
    onSave: (e: React.FormEvent) => void;
    onClose: () => void;
}

export function CategoryModal({
    isOpen, isEditing, name, setName, color, setColor,
    isEssential, setIsEssential, isSavings, setIsSavings,
    isMainIncome, setIsMainIncome, saving, onSave, onClose
}: CategoryModalProps) {
    const colorRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 500, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <form id="category-form" onSubmit={onSave}>
                        <div className="form-group">
                            <label className="label">Nome</label>
                            <input
                                className="input"
                                placeholder="Ex: Alimentação, Transporte..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={100}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Cor</label>
                            <div className="color-picker-wrapper" style={{ flexWrap: 'wrap', gap: 8 }}>
                                {DEFAULT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: 28, height: 28,
                                            background: c,
                                            borderRadius: 8,
                                            border: color === c ? '2px solid white' : '2px solid transparent',
                                            cursor: 'pointer',
                                            boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                                            transition: 'transform 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="color-swatch"
                                    style={{ background: color, width: 28, height: 28, borderRadius: 8, border: '2px solid var(--border-light)', cursor: 'pointer', position: 'relative' }}
                                    onClick={() => colorRef.current?.click()}
                                    title="Cor personalizada"
                                >
                                    <span style={{ fontSize: 12, position: 'absolute', bottom: -2, right: -2 }}>🎨</span>
                                </button>
                                <input ref={colorRef} type="color" value={color} onChange={e => setColor(e.target.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
                            <div
                                onClick={() => setIsEssential(!isEssential)}
                                style={{
                                    border: `2px solid ${isEssential ? 'var(--accent)' : 'var(--border-color)'}`,
                                    background: isEssential ? 'var(--accent-light)' : 'var(--bg-card)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                }}
                            >
                                <input type="checkbox" className="custom-checkbox" checked={isEssential} readOnly style={{ '--checkbox-color': 'var(--accent)', marginTop: 2 } as any} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Despesa Essencial</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Despesas fixas cobradas todos os meses.</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setIsSavings(!isSavings)}
                                style={{
                                    border: `2px solid ${isSavings ? '#10b981' : 'var(--border-color)'}`,
                                    background: isSavings ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                }}
                            >
                                <input type="checkbox" className="custom-checkbox" checked={isSavings} readOnly style={{ '--checkbox-color': '#10b981', marginTop: 2 } as any} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Economia ou Investimento</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Identifica valores poupados ou investidos.</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setIsMainIncome(!isMainIncome)}
                                style={{
                                    border: `2px solid ${isMainIncome ? '#eab308' : 'var(--border-color)'}`,
                                    background: isMainIncome ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-card)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                }}
                            >
                                <input type="checkbox" className="custom-checkbox" checked={isMainIncome} readOnly style={{ '--checkbox-color': '#eab308', marginTop: 2 } as any} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Entrada Principal</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Considerada a fonte principal de receita.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                    <button type="submit" form="category-form" className="btn btn-primary" disabled={!name.trim() || saving}>
                        {saving ? <span className="spinner" /> : (isEditing ? <Edit2 size={15} /> : <Plus size={15} />)}
                        {isEditing ? 'Salvar' : 'Criar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
