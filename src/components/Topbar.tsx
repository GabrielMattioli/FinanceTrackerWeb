import { Upload, Sun, Moon } from 'lucide-react';

interface TopbarProps {
    title: string;
    onImportClick: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export default function Topbar({ title, onImportClick, theme, toggleTheme }: TopbarProps) {
    return (
        <header className="topbar">
            <span className="topbar-title">{title}</span>
            <div className="topbar-actions">
                <button className="btn btn-ghost" onClick={toggleTheme} aria-label="Toggle Theme" style={{ padding: '8px' }}>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="btn btn-primary" onClick={onImportClick}>
                    <Upload size={15} />
                    Adicionar Gastos
                </button>
            </div>
        </header>
    );
}


