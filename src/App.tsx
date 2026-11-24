import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient } from './lib/queryClient';

import './index.css';

const Login = lazy(() => import('./pages/Login'));
const AppContent = lazy(() => import('./components/AppContent'));

function RouteLoader() {
  return (
    <div
      className="loading-page"
      style={{ height: '100dvh', background: 'var(--bg-primary)' }}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" /> Carregando...
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SettingsProvider>
              <BrowserRouter>
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
                <Suspense fallback={<RouteLoader />}>
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
                </Suspense>
              </BrowserRouter>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
