import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'admin' | 'operator' | 'government' | 'community';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  clearanceLevel: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (action: Permission) => boolean;
}

export type Permission =
  | 'alerts.acknowledge'
  | 'alerts.broadcast'
  | 'scenarios.run'
  | 'users.manage'
  | 'settings.edit'
  | 'nodes.deploy'
  | 'reports.generate'
  | 'drills.run';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['alerts.acknowledge', 'alerts.broadcast', 'scenarios.run', 'users.manage', 'settings.edit', 'nodes.deploy', 'reports.generate', 'drills.run'],
  operator: ['alerts.acknowledge', 'alerts.broadcast', 'scenarios.run', 'nodes.deploy', 'reports.generate', 'drills.run'],
  government: ['reports.generate'],
  community: [],
};

const AUTH_STORAGE_KEY = 'denarixx_auth_user';
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiUrl(path: string) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json() as AuthUser;
          setUser(data);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        } else {
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            setUser(JSON.parse(stored) as AuthUser);
          }
        }
      } catch {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored) as AuthUser);
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const resp = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (resp.ok) {
        const data = await resp.json() as AuthUser;
        setUser(data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        return { success: true };
      }

      const err = await resp.json().catch(() => ({})) as { error?: string };
      return { success: false, error: err.error ?? 'Invalid credentials. Access denied.' };
    } catch {
      const DEMO: Array<AuthUser & { password: string }> = [
        { id: 1, name: 'Cmdr. Prime', email: 'commander@denarixx.io', password: 'denarixx2026', role: 'admin', organization: 'Denarixx HQ', clearanceLevel: 5 },
        { id: 2, name: 'Adaeze Okonkwo', email: 'adaeze@denarixx.io', password: 'operator123', role: 'operator', organization: 'Lagos Grid Ops', clearanceLevel: 3 },
        { id: 3, name: 'Dr. Kofi Mensah', email: 'kofi@gov.gh', password: 'gov2026', role: 'government', organization: 'Ghana Disaster Authority', clearanceLevel: 4 },
        { id: 4, name: 'Fatuma Wanjiru', email: 'fatuma@community.ke', password: 'community1', role: 'community', organization: 'Kibera Community Watch', clearanceLevel: 1 },
      ];

      const match = DEMO.find(
        u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.password === cleanPassword
      );

      if (!match) {
        return { success: false, error: 'Invalid credentials. Access denied.' };
      }

      const { password: _, ...authUser } = match;
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const can = useCallback((action: Permission): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'System Administrator',
    operator: 'Field Operator',
    government: 'Government Liaison',
    community: 'Community Monitor',
  };
  return labels[role];
}

export function roleClearance(role: UserRole): number {
  const levels: Record<UserRole, number> = { admin: 5, government: 4, operator: 3, community: 1 };
  return levels[role];
}
