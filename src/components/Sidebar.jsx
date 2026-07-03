import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { LayoutDashboard, Clock, History, Tag, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ pendingCount }) {
    const { signOut } = useAuth();

    return (
        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="sidebar-logo">
                <div className="logo-icon">💰</div>
                <h1>FinanceTracker</h1>
                <p>Controle Financeiro Pessoal</p>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1 }}>
                <span className="sidebar-section-label">Visão Geral</span>

                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={16} />
                    Dashboard
                </NavLink>

                <span className="sidebar-section-label">Transações</span>

                <NavLink to="/pending" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Clock size={16} />
                    Pendentes
                    {pendingCount > 0 && <span className="nav-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}
                </NavLink>

                <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <History size={16} />
                    Histórico
                </NavLink>

                <span className="sidebar-section-label">Configurações</span>

                <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Tag size={16} />
                    Categorias
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Settings size={16} />
                    Configurações
                </NavLink>
            </nav>

            <div style={{ padding: '20px' }}>
                <button
                    onClick={signOut}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff4d4f' }}
                >
                    <LogOut size={16} />
                    Deslogar
                </button>
            </div>
        </aside>
    );
}

Sidebar.propTypes = {
    pendingCount: PropTypes.number,
};

Sidebar.defaultProps = {
    pendingCount: 0,
};
