import { Upload, Sun, Moon, Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  onImportClick: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuClick?: () => void;
}

export default function Topbar({ title, onImportClick, theme, toggleTheme, onMenuClick }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Abrir menu de navegação"
        >
          <Menu size={20} />
        </button>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          style={{ padding: '8px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" className="btn btn-primary" onClick={onImportClick}>
          <Upload size={15} />
          Importar
        </button>
      </div>
    </header>
  );
}
