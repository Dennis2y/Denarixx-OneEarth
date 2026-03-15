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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const DEMO_USERS: Array<AuthUser & { password: string }> = [
  {
    id: 1, name: 'Cmdr. Prime', email: 'commander@denarixx.io', password: 'denarixx2026',
    role: 'admin', organization: 'Denarixx HQ', clearanceLevel: 5,
  },
  {
    id: 2, name: 'Adaeze Okonkwo', email: 'adaeze@denarixx.io', password: 'operator123',
    role: 'operator', organization: 'Lagos Grid Ops', clearanceLevel: 3,
  },
  {
    id: 3, name: 'Dr. Kofi Mensah', email: 'kofi@gov.gh', password: 'gov2026',
    role: 'government', organization: 'Ghana Disaster Authority', clearanceLevel: 4,
  },
  {
    id: 4, name: 'Fatuma Wanjiru', email: 'fatuma@community.ke', password: 'community1',
    role: 'community', organization: 'Kibera Community Watch', clearanceLevel: 1,
  },
];

const AUTH_STORAGE_KEY = 'denarixx_auth_user';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 800));
    const match = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!match) {
      return { success: false, error: 'Invalid credentials. Access denied.' };
    }
    const { password: _, ...authUser } = match;
    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
