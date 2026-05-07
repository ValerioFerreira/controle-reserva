import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AUTH_KEY = 'cbmpe_session';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false); // não mais necessário, mantido para compatibilidade
  const [authError, setAuthError] = useState(null);

  // Carrega sessão do localStorage na inicialização
  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session?.access_token && session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (_) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      // data = { access_token, user: { nome, perfil } }
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
      setUser(data.user);
      setIsAuthenticated(true);
      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Usuário ou senha inválidos.';
      setAuthError({ type: 'auth_failed', message });
      return { ok: false, message };
    }
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings: null,
        authChecked: !isLoadingAuth,
        login,
        logout,
        navigateToLogin,
        checkUserAuth: () => {},
        checkAppState: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
