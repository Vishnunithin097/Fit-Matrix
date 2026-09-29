import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile, logoutUser, type AuthUser } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: (progressPercentage?: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetchProfile();
      setUser(response.data.user as AuthUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const login = (nextUser: AuthUser) => setUser(nextUser);

  const logout = async (progressPercentage?: number) => {
    try {
      await logoutUser(progressPercentage ? { progressPercentage } : undefined);
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
