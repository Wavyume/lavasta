import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserRole } from '../auth/phoneRoles';

export type Session = {
  phone: string;
  role: UserRole;
};

type AuthContextValue = {
  session: Session | null;
  login: (session: Session) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo(
    () => ({
      session,
      login: setSession,
      logout: () => setSession(null),
      setRole: (role: UserRole) => {
        setSession((s) => (s ? { ...s, role } : null));
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
