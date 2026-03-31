'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { auth, type AuthTokens, type User, ApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'knowhive_access_token';
const REFRESH_KEY = 'knowhive_refresh_token';

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleTokens = useCallback(async (tokens: AuthTokens) => {
    saveTokens(tokens);
    setToken(tokens.accessToken);
    const me = await auth.me(tokens.accessToken);
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const me = await auth.me(stored);
        setToken(stored);
        setUser(me);
      } catch {
        const refresh = getStoredRefresh();
        if (refresh) {
          try {
            const tokens = await auth.refresh(refresh);
            saveTokens(tokens);
            setToken(tokens.accessToken);
            const me = await auth.me(tokens.accessToken);
            setUser(me);
          } catch {
            clearTokens();
          }
        }
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  // Sync token state when the API client refreshes tokens in the background
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getStoredToken();
      if (current && current !== token) {
        setToken(current);
      } else if (!current && token) {
        setToken(null);
        setUser(null);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await auth.login({ email, password });
    await handleTokens(tokens);
  }, [handleTokens]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const tokens = await auth.register({ name, email, password });
    await handleTokens(tokens);
  }, [handleTokens]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
