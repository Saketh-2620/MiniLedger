import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import LoginPage         from './pages/LoginPage';
import AuthCallbackPage  from './pages/AuthCallbackPage';
import DashboardPage     from './pages/DashboardPage';
import TransactionsPage  from './pages/TransactionsPage';
import CategoriesPage    from './pages/CategoriesPage';
import NotificationsPage from './pages/NotificationsPage';
import Layout            from './components/Layout';


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; 
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/auth/callback"  element={<AuthCallbackPage />} />

      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index                  element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"       element={<DashboardPage />} />
        <Route path="transactions"    element={<TransactionsPage />} />
        <Route path="categories"      element={<CategoriesPage />} />
        <Route path="notifications"   element={<NotificationsPage />} />
      </Route>

      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
