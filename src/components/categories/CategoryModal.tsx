import React, { useRef } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

const DEFAULT_COLORS = [
  '#ef4444', '#f43f5e', '#ec4899',
  '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#64748b', '#52525b', '#78716c',
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
  isOpen,
  isEditing,
  name,
  setName,
  color,
  setColor,
  isEssential,
  setIsEssential,
  isSavings,
  setIsSavings,
  isMainIncome,
  setIsMainIncome,
  saving,
  onSave,
  onClose,
}: CategoryModalProps) {
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}
      onClose={onClose}
      maxWidth={500}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="category-form"
            className="btn btn-primary"
            disabled={!name.trim() || saving}
          >
            {saving ? <span className="spinner" /> : isEditing ? <Edit2 size={15} /> : <Plus size={15} />}
            {isEditing ? 'Salvar' : 'Criar'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSave}>
        <div className="form-group">
          <label className="label" htmlFor="category-name-input">
            Nome
          </label>
          <input
            id="category-name-input"
            className="input"
            placeholder="Ex: Alimentação, Transporte..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="form-group">
          <span className="label">Cor</span>
          <div className="color-picker-wrapper" style={{ flexWrap: 'wrap', gap: 8 }}>
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch-option ${color === c ? 'selected' : ''}`}
                onClick={() => setColor(c)}
                aria-label={`Selecionar cor ${c}`}
                aria-pressed={color === c}
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
            <button
              type="button"
              className="color-swatch"
              style={{
                background: color,
                width: 28,
                height: 28,
                borderRadius: 8,
                border: '2px solid var(--border-color)',
                position: 'relative',
              }}
              onClick={() => colorRef.current?.click()}
              title="Cor personalizada"
              aria-label="Escolher cor personalizada"
            >
              <span style={{ fontSize: 12, position: 'absolute', bottom: -2, right: -2 }} aria-hidden="true">
                🎨
              </span>
            </button>
            <input
              ref={colorRef}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Seletor de cor personalizada"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 16 }}>
          <label className={`option-card ${isEssential ? 'active-accent' : ''}`}>
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              style={{ '--checkbox-color': 'var(--accent)', marginTop: 2 } as React.CSSProperties}
            />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Despesa Essencial
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Despesas fixas cobradas todos os meses.
              </span>
            </div>
          </label>

          <label className={`option-card ${isSavings ? 'active-savings' : ''}`}>
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={isSavings}
              onChange={(e) => setIsSavings(e.target.checked)}
              style={{ '--checkbox-color': 'var(--income)', marginTop: 2 } as React.CSSProperties}
            />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Economia ou Investimento
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Identifica valores poupados ou investidos.
              </span>
            </div>
          </label>

          <label className={`option-card ${isMainIncome ? 'active-income' : ''}`}>
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={isMainIncome}
              onChange={(e) => setIsMainIncome(e.target.checked)}
              style={{ '--checkbox-color': 'var(--warning)', marginTop: 2 } as React.CSSProperties}
            />
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Entrada Principal
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Considerada a fonte principal de receita.
              </span>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
}
