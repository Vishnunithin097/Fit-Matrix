import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile, listSquadInvites, logoutUser, type AuthUser } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  pendingInvites: any[];
  currentDay: number;
  setCurrentDay: (day: number) => void;
  login: (user: AuthUser) => void;
  logout: (progressPercentage?: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredDayForUser = (userId?: string) => {
  if (!userId) return 1;
  try {
    const stored = window.localStorage.getItem(`fitmatrix_day_${userId}`);
    const parsed = stored ? Number(stored) : NaN;
    if (!Number.isInteger(parsed) || parsed < 1) return 1;
    return Math.min(parsed, 7);
  } catch {
    return 1;
  }
};

const saveDayForUser = (userId: string | undefined, day: number) => {
  if (!userId) return;
  try {
    window.localStorage.setItem(`fitmatrix_day_${userId}`, String(Math.min(Math.max(Math.floor(day), 1), 7)));
  } catch {
    // silent
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [currentDay, setCurrentDayState] = useState(1);

  const refreshNotifications = async () => {
    if (!user) {
      setPendingInvites([]);
      return;
    }

    try {
      const response = await listSquadInvites();
      setPendingInvites(response.data.invitations || []);
    } catch {
      setPendingInvites([]);
    }
  };

  const setCurrentDay = (day: number) => {
    const nextDay = Math.min(Math.max(Math.floor(day), 1), 7);
    setCurrentDayState(nextDay);
    saveDayForUser(user?.id, nextDay);
  };

  const refreshUser = async () => {
    try {
      const response = await fetchProfile();
      const fetchedUser = response.data.user as AuthUser;
      setUser(fetchedUser);
      setCurrentDayState(getStoredDayForUser(fetchedUser.id));
    } catch {
      setUser(null);
      setPendingInvites([]);
      setCurrentDayState(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      void refreshNotifications();
      setCurrentDayState(getStoredDayForUser(user.id));
    } else {
      setPendingInvites([]);
      setCurrentDayState(1);
    }
  }, [user]);

  const login = (nextUser: AuthUser) => {
    setUser(nextUser);
    setCurrentDayState(getStoredDayForUser(nextUser.id));
  };

  const logout = async (progressPercentage?: number) => {
    try {
      await logoutUser(progressPercentage ? { progressPercentage } : undefined);
    } finally {
      setUser(null);
      setPendingInvites([]);
    }
  };

  const value = useMemo(
    () => ({ user, loading, pendingInvites, currentDay, setCurrentDay, login, logout, refreshUser, refreshNotifications }),
    [user, loading, pendingInvites, currentDay]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
