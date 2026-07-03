import { Upload, Sun, Moon } from 'lucide-react';
import PropTypes from 'prop-types';

export default function Topbar({ title, onImportClick, theme, toggleTheme }) {
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

Topbar.propTypes = {
    title: PropTypes.string.isRequired,
    onImportClick: PropTypes.func.isRequired,
    theme: PropTypes.oneOf(['light', 'dark']).isRequired,
    toggleTheme: PropTypes.func.isRequired,
};
