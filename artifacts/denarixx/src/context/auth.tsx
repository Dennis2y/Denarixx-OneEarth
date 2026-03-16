import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await apiFetch('/api/auth/me') as AuthUser;

        if (!mounted) return;

        setUser(data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      } catch {
        if (!mounted) return;
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      }) as AuthUser;

      setUser(data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Invalid credentials' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
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
