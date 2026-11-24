import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import {
  invalidateTransactionRelatedQueries,
  usePendingCount,
} from '../hooks/queries/useTransactionQueries';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ImportModal from './ImportModal';
import InitialBalanceModal from './InitialBalanceModal';
import PendingPage from '../pages/PendingPage';
import HistoryPage from '../pages/HistoryPage';
import DashboardPage from '../pages/DashboardPage';
import CategoriesPage from '../pages/CategoriesPage';
import SettingsPage from '../pages/SettingsPage';
import HelpPage from '../pages/HelpPage';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pending': 'Transações Pendentes',
  '/history': 'Histórico',
  '/categories': 'Categorias',
  '/settings': 'Configurações',
  '/help': 'Ajuda',
};

export default function AppContent() {
  const location = useLocation();
  const qc = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data: pendingCount = 0 } = usePendingCount();

  const title = PAGE_TITLES[location.pathname] || 'FinanceTracker';

  const handleImportSuccess = () => {
    void invalidateTransactionRelatedQueries(qc);
  };

  return (
    <div className="app-layout">
      <Sidebar
        pendingCount={pendingCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main-content">
        <Topbar
          title={title}
          onImportClick={() => setShowImport(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
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

      <InitialBalanceModal />
    </div>
  );
}
