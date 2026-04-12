import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@/lib/types";

const STORAGE_KEY = "spade.user";

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  signIn: (user: User) => void;
  updateUser: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsReady(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      signIn: (nextUser: User) => {
        setUser(nextUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      updateUser: (nextUser: User) => {
        setUser(nextUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      signOut: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
