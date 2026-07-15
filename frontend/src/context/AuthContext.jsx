import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── On mount: check if we already have a valid session ─────────────────────
  useEffect(() => {
    const token = window.__accessToken;
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Listen for forced logout events (from axios interceptor) ────────────────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  // ── Called by AuthCallbackPage after Google OAuth redirect ──────────────────
  const loginWithToken = useCallback(async (accessToken) => {
    window.__accessToken = accessToken;
    try {
      const me = await getMe();
      setUser(me);
      navigate('/dashboard', { replace: true });
    } catch {
      window.__accessToken = null;
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, [navigate]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // best-effort
    } finally {
      window.__accessToken = null;
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
