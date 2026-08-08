import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Lazy-load feature pages
const CustomersPage = React.lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = React.lazy(() => import('./pages/CustomerDetailPage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const ChallansPage = React.lazy(() => import('./pages/ChallansPage'));
const ChallanDetailPage = React.lazy(() => import('./pages/ChallanDetailPage'));
const CreateChallanPage = React.lazy(() => import('./pages/CreateChallanPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border-base border-t-accent-burgundy rounded-full animate-[spin_0.8s_linear_infinite]" style={{ borderTopColor: 'var(--color-accent-burgundy)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border-base border-t-accent-burgundy rounded-full animate-[spin_0.8s_linear_infinite]" style={{ borderTopColor: 'var(--color-accent-burgundy)' }} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function SuspenseFallback() {
  return (
      <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-border-base border-t-accent-burgundy rounded-full animate-[spin_0.8s_linear_infinite]" style={{ borderTopColor: 'var(--color-accent-burgundy)' }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/customers"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <CustomersPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/customers/:id"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <CustomerDetailPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/products"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <ProductsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <ProductDetailPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/challans"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <ChallansPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/challans/create"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <CreateChallanPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/challans/:id"
                element={
                  <React.Suspense fallback={<SuspenseFallback />}>
                    <ChallanDetailPage />
                  </React.Suspense>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
