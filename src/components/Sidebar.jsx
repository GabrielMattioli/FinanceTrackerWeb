import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Tag, Settings, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

export default function Sidebar({ pendingCount }) {
    const handleShutdown = async () => {
        if (window.confirm("Deseja realmente desligar o servidor e encerrar o aplicativo?")) {
            try {
                await api.post('/system/shutdown');
                toast.success("Servidor desligado.");
                // Tentativa de fechar a aba
                setTimeout(() => {
                    document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:white;font-family:sans-serif;'><h1>O servidor foi encerrado. Pode fechar esta página com segurança.</h1></div>";
                }, 1000);
            } catch (error) {
                toast.error("Erro ao desligar servidor: " + error.message);
            }
        }
    };

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
                    onClick={handleShutdown}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff4d4f' }}
                >
                    <Power size={16} />
                    Desligar Servidor
                </button>
            </div>
        </aside>
    );
}
