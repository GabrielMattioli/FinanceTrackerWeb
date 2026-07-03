import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getPending } from '../api/api';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ImportModal from './ImportModal';
import PendingPage from '../pages/PendingPage';
import HistoryPage from '../pages/HistoryPage';
import DashboardPage from '../pages/DashboardPage';
import CategoriesPage from '../pages/CategoriesPage';
import SettingsPage from '../pages/SettingsPage';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/pending': 'Transações Pendentes',
  '/history': 'Histórico',
  '/categories': 'Categorias',
  '/settings': 'Configurações',
};

export default function AppContent() {
  const location = useLocation();
  const [showImport, setShowImport] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await getPending(0, 1);
      setPendingCount(res.totalElements || 0);
    } catch {
      // silently ignore
    }
  }, []);

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
              element={<PendingPage key={refreshKey} onCountChange={setPendingCount} />}
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

    </div>
  );
}
