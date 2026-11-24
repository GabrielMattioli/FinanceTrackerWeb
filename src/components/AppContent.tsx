import { lazy, Suspense, useState } from 'react';
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
import { TransactionModal } from './transactions/TransactionModal';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const PendingPage = lazy(() => import('../pages/PendingPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const HelpPage = lazy(() => import('../pages/HelpPage'));

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pending': 'Transações Pendentes',
  '/history': 'Histórico',
  '/categories': 'Categorias',
  '/settings': 'Configurações',
  '/help': 'Ajuda',
};

function PageFallback() {
  return (
    <div className="loading-page" role="status" aria-live="polite">
      <span className="spinner" /> Carregando...
    </div>
  );
}

export default function AppContent() {
  const location = useLocation();
  const qc = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [showNewTx, setShowNewTx] = useState(false);
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
          onNewTransactionClick={() => setShowNewTx(true)}
          onImportClick={() => setShowImport(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="page-content">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pending" element={<PendingPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </Suspense>
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

      {showNewTx && (
        <TransactionModal isOpen={showNewTx} onClose={() => setShowNewTx(false)} />
      )}

      <InitialBalanceModal />
    </div>
  );
}
