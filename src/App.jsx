import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './api/api';
import { getPending } from './api/api';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ImportModal from './components/ImportModal';
import PendingPage from './pages/PendingPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import './index.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/pending': 'Transações Pendentes',
  '/history': 'Histórico',
  '/categories': 'Categorias',
  '/settings': 'Configurações',
};

function AppContent() {
  const location = useLocation();
  const [showImport, setShowImport] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isDisconnected, setIsDisconnected] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await getPending(0, 1);
      setPendingCount(res.totalElements || 0);
    } catch {
      // silently ignore
    }
  }, []);

  // Backend local removido: Heartbeat e desconexão não são mais necessários

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const title = PAGE_TITLES[location.pathname] || 'FinanceTracker';

  const handleImportSuccess = () => {
    setRefreshKey(k => k + 1);
    refreshPendingCount();
  };

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />

      <div className="main-content">
        <Topbar title={title} onImportClick={() => setShowImport(true)} theme={theme} toggleTheme={toggleTheme} />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage key={refreshKey} />} />
            <Route
              path="/pending"
              element={<PendingPage key={refreshKey} onCountChange={setPendingCount} onRefreshCount={refreshPendingCount} />}
            />
            <Route path="/history" element={<HistoryPage key={refreshKey} />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            handleImportSuccess();
          }}
        />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            fontSize: 13.5,
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
        }}
      />
    </div>
  );
}


const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
